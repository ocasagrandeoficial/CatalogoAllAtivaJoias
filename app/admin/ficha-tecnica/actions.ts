"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import type { MaterialType, PricingMode, Unit } from "@/lib/pricing";

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
};

export type SaveFichaInput = {
  productId: string;
  mode: PricingMode;
  strategyValue: number;
  sellingPrice: number;
  totalCost: number;
  materials: SaveFichaMaterial[];
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

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
      const name = line.name.trim();

      const material = await prisma.material.upsert({
        where: line.materialId ? { id: line.materialId } : { name },
        update: {
          type: line.type,
          purchasePrice: line.packagePrice,
          purchaseQuantity: line.packageQuantity,
          unit: line.unit,
        },
        create: {
          name,
          type: line.type,
          purchasePrice: line.packagePrice,
          purchaseQuantity: line.packageQuantity,
          unit: line.unit,
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
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}
