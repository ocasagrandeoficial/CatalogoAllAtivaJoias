import { prisma } from "@/lib/prisma";
import { PdvClient } from "./pdv-client";

export const dynamic = "force-dynamic";

export default async function NovoPedidoPage() {
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    orderBy: [{ category: { order: "asc" } }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      productCode: true,
      price: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
  });

  const pdvProducts = products.map((product) => ({
    id: product.id,
    title: product.title,
    productCode: product.productCode,
    price: product.price,
    imageUrl: product.imageUrl,
    categoryName: product.category.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-800">
          Novo Pedido
        </h1>
        <p className="mt-1 text-stone-500">
          Monte o pedido e finalize a venda do cliente.
        </p>
      </div>

      <PdvClient products={pdvProducts} />
    </div>
  );
}
