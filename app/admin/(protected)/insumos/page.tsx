import { prisma } from "@/lib/prisma";
import { HelpButton } from "@/components/admin/help-button";
import { InsumosClient } from "./insumos-client";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  // Select apenas dos campos usados nas tabelas/filtros (payload menor).
  const [stones, chains, wires, alloys] = await Promise.all([
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
        createdAt: true,
        updatedAt: true,
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
        weightPerCm: true,
        pricePerCm: true,
        createdAt: true,
        updatedAt: true,
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
        widthMm: true,
        weightPerCm: true,
        pricePerCm: true,
        createdAt: true,
        updatedAt: true,
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
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">
            Biblioteca de Insumos
          </h1>
          <p className="mt-1 text-slate-500">
            Controle granular de pedras, correntes, fios/chapas e ligas metálicas
            da ourivesaria.
          </p>
        </div>
        <HelpButton moduleKey="insumos" />
      </div>

      <InsumosClient
        stones={stones}
        chains={chains}
        wires={wires}
        alloys={alloys}
      />
    </div>
  );
}
