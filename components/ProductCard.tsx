"use client";

import { useState } from "react";
import Image from "next/image";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  title: string;
  description?: string | null;
  imageUrl: string;
  price: number;
  /** Uso interno (PDV / admin) — não exibido na vitrine pública. */
  productCode?: string | null;
  categoryName?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  /** Se definido, o card vira botão clicável (ex.: adicionar ao carrinho no PDV). */
  onClick?: () => void;
  className?: string;
}

export function ProductCard({ product, onClick, className }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = product.description?.trim() ?? "";
  const canToggleDescription = description.length > 70;

  const content = (
    <>
      {/* 1. Foto */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* 2–4. Título → Descrição → Valor */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        {product.productCode ? (
          <span className="font-mono text-[10px] leading-none text-slate-400 sm:text-xs">
            {product.productCode}
          </span>
        ) : null}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
          {product.title}
        </h3>

        {description ? (
          <div className="min-w-0">
            <p
              className={cn(
                "text-xs leading-relaxed text-slate-500",
                !isExpanded && "line-clamp-2"
              )}
            >
              {description}
            </p>
            {canToggleDescription ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsExpanded((v) => !v);
                }}
                className="mt-0.5 text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                {isExpanded ? "Ler menos" : "Ler mais"}
              </button>
            ) : null}
          </div>
        ) : product.categoryName ? (
          <p className="line-clamp-1 text-xs text-slate-400">
            {product.categoryName}
          </p>
        ) : null}

        <p className="mt-auto pt-1 text-sm font-bold text-brand-600 sm:text-base">
          {formatPrice(product.price)}
        </p>
      </div>
    </>
  );

  const shellClass = cn(
    "group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white text-left transition-shadow duration-300 hover:shadow-sm",
    onClick && "active:scale-[0.98]",
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shellClass}>
        {content}
      </button>
    );
  }

  return <article className={shellClass}>{content}</article>;
}
