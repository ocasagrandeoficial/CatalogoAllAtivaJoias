export type SaleReceiptItem = {
  quantity: number;
  title: string;
  unitPrice: number;
};

export type SaleReceiptData = {
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  sellerName?: string | null;
  createdAt: string;
  totalAmount: number;
  advancePayment: number;
  items: SaleReceiptItem[];
};

type OrderForReceipt = {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  sellerName?: string | null;
  createdAt: Date;
  totalAmount: number;
  advancePayment?: number | null;
  items: {
    quantity: number;
    priceAtTime: number;
    product: { title: string };
  }[];
};

export function toSaleReceiptData(order: OrderForReceipt): SaleReceiptData {
  return {
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? null,
    sellerName: order.sellerName ?? null,
    createdAt: order.createdAt.toISOString(),
    totalAmount: order.totalAmount,
    // Vendas antigas não possuem sinal: tratamos como 0.
    advancePayment: order.advancePayment ?? 0,
    items: order.items.map(
      (item): SaleReceiptItem => ({
        quantity: item.quantity,
        title: item.product.title,
        unitPrice: item.priceAtTime,
      })
    ),
  };
}
