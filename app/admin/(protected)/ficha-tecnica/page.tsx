import { prisma } from "@/lib/prisma";
import { FichaTecnicaClient } from "./ficha-tecnica-client";

export const dynamic = "force-dynamic";

export default async function FichaTecnicaPage() {
  const [products, materials, stones, chains, wires] = await Promise.all([
    prisma.product.findMany({
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
      },
    }),
    prisma.stone.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        weightCt: true,
        unitPrice: true,
      },
    }),
    prisma.chain.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        material: true,
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
        pricePerCm: true,
        weightPerCm: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-slate-900">
          Ficha Técnica
        </h1>
        <p className="mt-1 text-slate-500">
          Precificação de ourivesaria: calcule custo, lucro e preço ideal da
          joia em tempo real.
        </p>
      </div>

      <FichaTecnicaClient
        products={products}
        materials={materials}
        stones={stones}
        chains={chains}
        wires={wires}
      />
    </div>
  );
}
