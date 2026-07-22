import { prisma } from "@/lib/prisma";
import { HelpButton } from "@/components/admin/help-button";
import { FichaTecnicaClient } from "./ficha-tecnica-client";

export const dynamic = "force-dynamic";

export default async function FichaTecnicaPage() {
  // Metadados estruturados dos insumos, reaproveitados na Requisição de Materiais.
  const MATERIAL_ATTR_SELECT = {
    attrCut: true,
    attrColor: true,
    attrSizeMm: true,
    attrMaterial: true,
    attrMesh: true,
    attrProfile: true,
    attrGauge: true,
    weightPerCm: true,
    purity: true,
    pureMetalName: true,
    alloyMetalName: true,
  } as const;

  const [products, materials, stones, chains, wires, alloys] =
    await Promise.all([
      prisma.product.findMany({
        where: { isDeleted: false },
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          price: true,
          pricingStrategy: true,
          pricingValue: true,
          compositionItems: {
            select: {
              quantityUsed: true,
              material: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  purchasePrice: true,
                  purchaseQuantity: true,
                  unit: true,
                  ...MATERIAL_ATTR_SELECT,
                },
              },
            },
          },
        },
      }),
      prisma.material.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          purchasePrice: true,
          purchaseQuantity: true,
          unit: true,
          ...MATERIAL_ATTR_SELECT,
        },
      }),
      prisma.stone.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          cut: true,
          color: true,
          sizeMm: true,
          weightCt: true,
          unitPrice: true,
        },
      }),
      prisma.chain.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          mesh: true,
          material: true,
          thicknessMm: true,
          pricePerCm: true,
          weightPerCm: true,
        },
      }),
      prisma.wire.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          material: true,
          profile: true,
          gauge: true,
          pricePerCm: true,
          weightPerCm: true,
        },
      }),
      prisma.metalAlloy.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          purity: true,
          pureMetalName: true,
          pureMetalPricePerG: true,
          alloyMetalName: true,
          alloyMetalPricePerG: true,
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">
            Ficha Técnica
          </h1>
          <p className="mt-1 text-slate-500">
            Precificação de ourivesaria: calcule custo, lucro e preço ideal da
            joia em tempo real.
          </p>
        </div>
        <HelpButton moduleKey="ficha-tecnica" />
      </div>

      <FichaTecnicaClient
        products={products}
        materials={materials}
        stones={stones}
        chains={chains}
        wires={wires}
        alloys={alloys}
      />
    </div>
  );
}
