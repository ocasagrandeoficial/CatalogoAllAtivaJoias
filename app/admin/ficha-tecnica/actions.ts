"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import type { MaterialType, PricingMode, Unit } from "@/lib/pricing";
import type { InsumoAttrs } from "@/lib/material-requisition";

export type FichaActionState = {
  error?: string;
  success?: boolean;
};

export type SaveFichaMaterial = {
  materialId?: string;
  name: string;
  type: MaterialType;
  packagePrice: number;
  packageQuantity: number;
  unit: Unit;
  quantityUsed: number;
} & InsumoAttrs;

export type SaveFichaInput = {
  productId: string;
  mode: PricingMode;
  strategyValue: number;
  sellingPrice: number;
  totalCost: number;
  materials: SaveFichaMaterial[];
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Nome único de Material para gemas: evita que pedras com o mesmo nome comercial
 * e cores/lapidações diferentes colidam no upsert por `name` e sobrescrevam
 * o attrColor (bug que fazia todas as pedras saírem com a cor da última salva).
 */
function resolveMaterialName(line: SaveFichaMaterial): string {
  const raw = line.name.trim();
  if (line.type !== "gema") return raw;

  const root = raw.split(" · ")[0]?.trim() || raw;
  const cut = line.attrCut?.trim() || "";
  const color = line.attrColor?.trim() || "";
  const size =
    line.attrSizeMm !== null && line.attrSizeMm !== undefined
      ? `${line.attrSizeMm}mm`
      : "";

  const parts = [root, cut, color, size].filter(Boolean);
  // Sem metadados, mantém o nome informado (item avulso).
  if (parts.length === 1) return root;
  return parts.join(" · ");
}

export async function saveFichaTecnica(
  input: SaveFichaInput
): Promise<FichaActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (!input.productId) {
    return { error: "Selecione uma peça para salvar a ficha técnica." };
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true },
  });
  if (!product) {
    return { error: "Peça não encontrada." };
  }

  // Considera apenas materiais válidos (com nome e quantidade usada).
  const validLines = input.materials.filter(
    (line) => line.name.trim() && line.quantityUsed > 0
  );

  try {
    // Resolve/cria os materiais e mescla linhas duplicadas por material.
    const usedByMaterial = new Map<string, number>();

    for (const line of validLines) {
      const name = resolveMaterialName(line);

      // Metadados estruturados p/ a Requisição de Materiais (null limpa o campo).
      const attrs = {
        attrCut: line.attrCut?.trim() || null,
        attrColor: line.attrColor?.trim() || null,
        attrSizeMm: line.attrSizeMm ?? null,
        attrMaterial: line.attrMaterial ?? null,
        attrMesh: line.attrMesh ?? null,
        attrProfile: line.attrProfile ?? null,
        attrGauge: line.attrGauge ?? null,
        weightPerCm: line.weightPerCm ?? null,
        purity: line.purity ?? null,
        pureMetalName: line.pureMetalName ?? null,
        alloyMetalName: line.alloyMetalName ?? null,
      };

      // Sempre upsert pelo nome único resolvido (gemas incluem cor/lapidação/mm).
      // Assim cores distintas nunca colidem no mesmo Material, mesmo com materialId antigo.
      const material = await prisma.material.upsert({
        where: { name },
        update: {
          type: line.type,
          purchasePrice: line.packagePrice,
          purchaseQuantity: line.packageQuantity,
          unit: line.unit,
          ...attrs,
        },
        create: {
          name,
          type: line.type,
          purchasePrice: line.packagePrice,
          purchaseQuantity: line.packageQuantity,
          unit: line.unit,
          ...attrs,
        },
        select: { id: true },
      });

      usedByMaterial.set(
        material.id,
        (usedByMaterial.get(material.id) ?? 0) + line.quantityUsed
      );
    }

    await prisma.$transaction([
      prisma.compositionItem.deleteMany({
        where: { productId: input.productId },
      }),
      ...[...usedByMaterial.entries()].map(([materialId, quantityUsed]) =>
        prisma.compositionItem.create({
          data: { productId: input.productId, materialId, quantityUsed },
        })
      ),
      prisma.product.update({
        where: { id: input.productId },
        data: {
          price: round2(input.sellingPrice),
          costPrice: round2(input.totalCost),
          pricingStrategy: input.mode,
          pricingValue: input.strategyValue,
        },
      }),
    ]);
  } catch (error) {
    console.error("saveFichaTecnica:", error);
    return { error: "Não foi possível salvar a ficha técnica." };
  }

  revalidatePath("/admin/ficha-tecnica");
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  revalidateTag("dashboard");

  return { success: true };
}
