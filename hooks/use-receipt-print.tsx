"use client";

import { useCallback, useEffect, useState } from "react";

import { SaleReceipt } from "@/components/admin/sale-receipt";
import { canPrintOnCashierPc, handlePrint } from "@/lib/print";
import type { SaleReceiptData } from "@/lib/receipt";

export function useReceiptPrint() {
  const [receiptToPrint, setReceiptToPrint] = useState<SaleReceiptData | null>(
    null
  );
  const [printMessage, setPrintMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptToPrint || !canPrintOnCashierPc()) return;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handlePrint();
      });
    });

    const onAfterPrint = () => {
      setReceiptToPrint(null);
    };

    window.addEventListener("afterprint", onAfterPrint);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [receiptToPrint]);

  const printReceipt = useCallback((data: SaleReceiptData) => {
    setPrintMessage(null);

    if (!canPrintOnCashierPc()) {
      setPrintMessage("Reimpressão disponível apenas no PC do caixa.");
      return;
    }

    setReceiptToPrint(data);
  }, []);

  const ReceiptLayer =
    receiptToPrint !== null ? (
      <div className="sale-receipt" aria-hidden="true">
        <SaleReceipt data={receiptToPrint} />
      </div>
    ) : null;

  return {
    printReceipt,
    printMessage,
    clearPrintMessage: () => setPrintMessage(null),
    canPrint: canPrintOnCashierPc(),
    ReceiptLayer,
  };
}
