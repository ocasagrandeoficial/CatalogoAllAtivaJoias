import { prisma } from "@/lib/prisma";
import { InsumosClient } from "./insumos-client";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  const [stones, chains, wires, alloys] = await Promise.all([
    prisma.stone.findMany({ orderBy: { name: "asc" } }),
    prisma.chain.findMany({ orderBy: { name: "asc" } }),
    prisma.wire.findMany({ orderBy: { name: "asc" } }),
    prisma.metalAlloy.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-slate-900">
          Biblioteca de Insumos
        </h1>
        <p className="mt-1 text-slate-500">
          Controle granular de pedras, correntes, fios/chapas e ligas metálicas
          da ourivesaria.
        </p>
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
