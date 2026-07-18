"use client";

import { useMemo, useState } from "react";
import { Plus, Ruler, Sparkles, X } from "lucide-react";

import { DataTableFacetedFilter } from "@/components/admin/data-table-faceted-filter";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildStoneSequence,
  colorToHex,
  computeAlloy,
  lengthCost,
  lengthWeight,
  type SequenceStone,
} from "@/utils/jewelryMath";
import type { InsumoAttrs } from "@/utils/materialRequisition";

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function countByNormalized(
  items: Array<string | null | undefined>
): Map<string, { label: string; count: number }> {
  const map = new Map<string, { label: string; count: number }>();
  for (const raw of items) {
    const label = (raw ?? "").trim();
    if (!label) continue;
    const key = normalize(label);
    const prev = map.get(key);
    if (prev) prev.count += 1;
    else map.set(key, { label, count: 1 });
  }
  return map;
}

function stoneSearchBlob(stone: SequenceStone): string {
  return [
    stone.name,
    stone.cut,
    stone.color,
    stone.sizeMm != null ? `${stone.sizeMm}mm` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Linha pronta para ser inserida na composição da Ficha Técnica.
// Estende InsumoAttrs para levar os metadados estruturados (usados na
// Requisição de Materiais) junto com a linha de custo.
export interface DraftLine extends InsumoAttrs {
  name: string;
  type: "metal" | "gema" | "componente";
  packagePrice: number;
  packageQuantity: number;
  unit: string;
  quantityUsed: number;
}

export interface ChainOption {
  id: string;
  name: string;
  mesh: string;
  material: string;
  thicknessMm: number | null;
  pricePerCm: number;
  weightPerCm: number | null;
}

export interface WireOption {
  id: string;
  name: string;
  material: string;
  profile: string;
  gauge: number;
  pricePerCm: number;
  weightPerCm: number | null;
}

export interface AlloyOption {
  id: string;
  name: string;
  purity: number;
  pureMetalName: string;
  alloyMetalName: string;
  pureMetalPricePerG: number;
  alloyMetalPricePerG: number;
}

// ─────────────────────────────────────────────────────────────
// Construtor de correntes e fios
// ─────────────────────────────────────────────────────────────

export function WireChainBuilder({
  chains,
  wires,
  onAppend,
}: {
  chains: ChainOption[];
  wires: WireOption[];
  onAppend: (lines: DraftLine[]) => void;
}) {
  const [selected, setSelected] = useState("");
  const [cm, setCm] = useState("");

  const resolved = useMemo(() => {
    if (!selected) return null;
    const [kind, id] = selected.split(":");
    if (kind === "chain") {
      const c = chains.find((x) => x.id === id);
      return c ? ({ kind: "chain", chain: c } as const) : null;
    }
    const w = wires.find((x) => x.id === id);
    return w ? ({ kind: "wire", wire: w } as const) : null;
  }, [selected, chains, wires]);

  const pricePerCm =
    resolved?.kind === "chain"
      ? resolved.chain.pricePerCm
      : resolved?.wire.pricePerCm ?? 0;
  const weightPerCm =
    resolved?.kind === "chain"
      ? resolved.chain.weightPerCm
      : resolved?.wire.weightPerCm ?? null;
  const resolvedName =
    resolved?.kind === "chain" ? resolved.chain.name : resolved?.wire.name ?? "";

  const centimeters = Number(String(cm).replace(",", ".")) || 0;
  const cost = resolved ? lengthCost(pricePerCm, centimeters) : 0;
  const weight = resolved ? lengthWeight(weightPerCm, centimeters) : 0;

  const hasOptions = chains.length > 0 || wires.length > 0;

  function handleAdd() {
    if (!resolved || centimeters <= 0) return;

    const base = {
      packagePrice: pricePerCm,
      packageQuantity: 1,
      unit: "cm",
      quantityUsed: centimeters,
      weightPerCm,
    };

    if (resolved.kind === "chain") {
      const c = resolved.chain;
      onAppend([
        {
          ...base,
          name: c.name,
          type: "componente",
          attrMesh: c.mesh,
          attrMaterial: c.material,
          attrSizeMm: c.thicknessMm,
        },
      ]);
    } else {
      const w = resolved.wire;
      onAppend([
        {
          ...base,
          name: w.name,
          type: "metal",
          attrProfile: w.profile,
          attrMaterial: w.material,
          attrGauge: w.gauge,
        },
      ]);
    }
    setCm("");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Ruler className="h-4 w-4 text-brand-700" />
          5. Construtor de correntes e fios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasOptions && (
          <p className="text-sm text-slate-400">
            Cadastre correntes e fios na Biblioteca de Insumos para usá-los aqui.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,7rem,auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Insumo</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione o fio/corrente..." />
              </SelectTrigger>
              <SelectContent>
                {wires.map((w) => (
                  <SelectItem key={w.id} value={`wire:${w.id}`}>
                    Fio · {w.name}
                  </SelectItem>
                ))}
                {chains.map((c) => (
                  <SelectItem key={c.id} value={`chain:${c.id}`}>
                    Corrente · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cm usados</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              value={cm}
              onChange={(e) => setCm(e.target.value)}
              placeholder="0"
              className="h-9"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!resolved || centimeters <= 0}
            className="h-9 bg-brand-600 text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {resolved && centimeters > 0 && (
          <div className="flex items-center justify-between rounded-md border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm">
            <span className="text-slate-600">
              {resolvedName} · {centimeters} cm
              {weight > 0 && (
                <>
                  {" "}
                  ·{" "}
                  {weight.toLocaleString("pt-BR", {
                    maximumFractionDigits: 3,
                  })}{" "}
                  g
                </>
              )}
            </span>
            <span className="font-semibold text-brand-800">
              {BRL.format(cost)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Sequenciador visual de pedras
// ─────────────────────────────────────────────────────────────

export function StoneSequencer({
  stones,
  onAppend,
}: {
  stones: SequenceStone[];
  onAppend: (lines: DraftLine[]) => void;
}) {
  const [pattern, setPattern] = useState<string[]>([]);
  const [total, setTotal] = useState("");

  // Mesma lógica de busca facetada do módulo Insumos (aba Pedras)
  const [search, setSearch] = useState("");
  const [cuts, setCuts] = useState<Set<string>>(new Set());
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Set<string>>(new Set());

  const stoneById = useMemo(() => {
    const map = new Map<string, SequenceStone>();
    for (const s of stones) map.set(s.id, s);
    return map;
  }, [stones]);

  const cutOptions = useMemo(() => {
    const counts = countByNormalized(stones.map((s) => s.cut));
    return Array.from(counts.entries())
      .sort((a, b) => a[1].label.localeCompare(b[1].label, "pt-BR"))
      .map(([value, { label, count }]) => ({ value, label, count }));
  }, [stones]);

  const colorOptions = useMemo(() => {
    const counts = countByNormalized(stones.map((s) => s.color));
    return Array.from(counts.entries())
      .sort((a, b) => a[1].label.localeCompare(b[1].label, "pt-BR"))
      .map(([value, { label, count }]) => ({ value, label, count }));
  }, [stones]);

  const sizeOptions = useMemo(() => {
    const counts = countByNormalized(
      stones.map((s) =>
        s.sizeMm != null && Number.isFinite(s.sizeMm) ? String(s.sizeMm) : null
      )
    );
    return Array.from(counts.entries())
      .sort((a, b) => Number(a[1].label) - Number(b[1].label))
      .map(([value, { label, count }]) => ({
        value,
        label: `${label} mm`,
        count,
      }));
  }, [stones]);

  const filteredStones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stones.filter((s) => {
      if (q && !stoneSearchBlob(s).includes(q)) return false;
      if (cuts.size > 0 && !cuts.has(normalize(s.cut))) return false;
      if (colors.size > 0 && !colors.has(normalize(s.color))) return false;
      if (
        sizes.size > 0 &&
        !sizes.has(
          normalize(
            s.sizeMm != null && Number.isFinite(s.sizeMm)
              ? String(s.sizeMm)
              : ""
          )
        )
      ) {
        return false;
      }
      return true;
    });
  }, [stones, search, cuts, colors, sizes]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    cuts.size > 0 ||
    colors.size > 0 ||
    sizes.size > 0;

  function resetFilters() {
    setSearch("");
    setCuts(new Set());
    setColors(new Set());
    setSizes(new Set());
  }

  const patternStones = useMemo(
    () =>
      pattern
        .map((id) => stoneById.get(id))
        .filter((s): s is SequenceStone => Boolean(s)),
    [pattern, stoneById]
  );

  const totalNum = Math.max(Math.floor(Number(total) || 0), 0);

  const result = useMemo(
    () => buildStoneSequence(patternStones, totalNum),
    [patternStones, totalNum]
  );

  const visibleDots = result.sequence.slice(0, 120);
  const hiddenDots = result.sequence.length - visibleDots.length;

  function addToPattern(id: string) {
    setPattern((p) => [...p, id]);
  }
  function removeFromPattern(index: number) {
    setPattern((p) => p.filter((_, i) => i !== index));
  }

  function handleAppend() {
    if (result.groups.length === 0) return;
    onAppend(
      result.groups
        .filter((g) => g.count > 0)
        .map((g) => {
          // Nome único por lapidação+cor+tamanho — evita colisão no Material.upsert.
          const name = [g.name, g.cut, g.color, g.sizeMm != null ? `${g.sizeMm}mm` : null]
            .filter(Boolean)
            .join(" · ");
          return {
            name,
            type: "gema" as const,
            packagePrice: g.unitPrice,
            packageQuantity: 1,
            unit: "un",
            quantityUsed: g.count,
            attrCut: g.cut?.trim() || null,
            attrColor: g.color?.trim() || null,
            attrSizeMm: g.sizeMm ?? null,
          };
        })
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Sparkles className="h-4 w-4 text-brand-700" />
          6. Sequenciador de pedras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stones.length === 0 ? (
          <p className="text-sm text-slate-400">
            Cadastre pedras na Biblioteca de Insumos para montar o padrão.
          </p>
        ) : (
          <>
            {/* Paleta — busca + filtros facetados (mesmo padrão de Insumos) */}
            <div className="space-y-2">
              <Label className="text-xs">
                Busque ou filtre e toque para montar o padrão
              </Label>
              <DataTableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar pedra, lapidação, cor, tamanho…"
                hasActiveFilters={hasActiveFilters}
                onReset={resetFilters}
                resultCount={filteredStones.length}
                totalCount={stones.length}
                className="rounded-lg border-brand-100 bg-brand-50/40 px-2.5 py-2"
              >
                <DataTableFacetedFilter
                  title="Lapidação"
                  options={cutOptions}
                  selected={cuts}
                  onSelectedChange={setCuts}
                />
                <DataTableFacetedFilter
                  title="Cor"
                  options={colorOptions}
                  selected={colors}
                  onSelectedChange={setColors}
                />
                <DataTableFacetedFilter
                  title="Tamanho"
                  options={sizeOptions}
                  selected={sizes}
                  onSelectedChange={setSizes}
                />
              </DataTableToolbar>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                {filteredStones.map((s) => {
                  const meta = [
                    s.cut,
                    s.color,
                    s.sizeMm != null ? `${s.sizeMm}mm` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addToPattern(s.id)}
                      title={`${s.name}${meta ? ` · ${meta}` : ""}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-slate-300"
                        style={{ backgroundColor: colorToHex(s.color) }}
                      />
                      <span className="truncate">{s.name}</span>
                      {meta ? (
                        <span className="truncate text-[10px] text-slate-400">
                          {meta}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {filteredStones.length === 0 && (
                  <p className="w-full py-2 text-center text-xs text-slate-400">
                    Nenhuma pedra com esses filtros.
                  </p>
                )}
              </div>
            </div>

            {/* Padrão montado */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Padrão ({pattern.length} pedra
                {pattern.length === 1 ? "" : "s"})
              </Label>
              {pattern.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                  Nenhuma pedra no padrão ainda.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-2">
                  {patternStones.map((s, index) => (
                    <span
                      key={`${s.id}-${index}`}
                      className="group inline-flex items-center gap-1 rounded-full bg-slate-50 py-0.5 pl-1 pr-1.5 text-xs text-slate-700"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: colorToHex(s.color) }}
                        title={`${s.name} · ${s.color}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeFromPattern(index)}
                        aria-label="Remover do padrão"
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPattern([])}
                    className="ml-auto text-xs text-slate-400 hover:text-red-500"
                  >
                    limpar
                  </button>
                </div>
              )}
            </div>

            {/* Quantidade total */}
            <div className="w-full sm:w-56 space-y-1">
              <Label className="text-xs">Quantidade total de pedras</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="Ex.: 45"
                className="h-9"
              />
            </div>

            {/* Prévia da cravação + resumo */}
            {result.groups.length > 0 && totalNum > 0 && (
              <div className="space-y-3 rounded-md border border-brand-200 bg-brand-50/60 p-3">
                <div className="flex flex-wrap gap-1">
                  {visibleDots.map((id, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-white shadow-sm"
                      style={{
                        backgroundColor: colorToHex(
                          stoneById.get(id)?.color ?? ""
                        ),
                      }}
                    />
                  ))}
                  {hiddenDots > 0 && (
                    <span className="text-xs text-slate-500">
                      +{hiddenDots}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {result.groups.map((g) => (
                    <div
                      key={g.stoneId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <span
                          className="h-3 w-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: g.colorHex }}
                        />
                        {g.count}× {g.name}
                      </span>
                      <span className="text-slate-600">
                        {g.totalWeightCt.toLocaleString("pt-BR", {
                          maximumFractionDigits: 3,
                        })}{" "}
                        ct · {BRL.format(g.totalValue)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-brand-200 pt-2 text-sm">
                  <span className="font-medium text-slate-700">
                    {result.totalStones} pedras ·{" "}
                    {result.totalWeightCt.toLocaleString("pt-BR", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    ct
                  </span>
                  <span className="font-semibold text-brand-800">
                    {BRL.format(result.totalValue)}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={handleAppend}
                  className="w-full bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar pedras à composição
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Construtor de metais e ligas (decompõe a liga em metal puro + pré-liga)
// ─────────────────────────────────────────────────────────────

export function AlloyBuilder({
  alloys,
  onAppend,
}: {
  alloys: AlloyOption[];
  onAppend: (lines: DraftLine[]) => void;
}) {
  const [selected, setSelected] = useState("");
  const [grams, setGrams] = useState("");

  const alloy = useMemo(
    () => alloys.find((a) => a.id === selected) ?? null,
    [alloys, selected]
  );

  const weight = Number(String(grams).replace(",", ".")) || 0;

  const result = useMemo(() => {
    if (!alloy) return null;
    return computeAlloy({
      finalWeight: weight,
      purity: alloy.purity,
      pureMetalPricePerG: alloy.pureMetalPricePerG,
      alloyMetalPricePerG: alloy.alloyMetalPricePerG,
    });
  }, [alloy, weight]);

  function handleAdd() {
    if (!alloy || !result || weight <= 0) return;
    onAppend([
      {
        name: alloy.name,
        type: "metal",
        packagePrice: result.costPerGram,
        packageQuantity: 1,
        unit: "g",
        quantityUsed: weight,
        attrMaterial: alloy.name,
        purity: alloy.purity,
        pureMetalName: alloy.pureMetalName,
        alloyMetalName: alloy.alloyMetalName,
      },
    ]);
    setGrams("");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Sparkles className="h-4 w-4 text-brand-700" />
          7. Metais e ligas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alloys.length === 0 && (
          <p className="text-sm text-slate-400">
            Cadastre ligas na Biblioteca de Insumos para usá-las aqui.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,7rem,auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Liga</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione a liga..." />
              </SelectTrigger>
              <SelectContent>
                {alloys.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gramas (peça)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="0"
              className="h-9"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!alloy || weight <= 0}
            className="h-9 bg-brand-600 text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {alloy && result && weight > 0 && (
          <div className="space-y-1 rounded-md border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>{alloy.pureMetalName}</span>
              <span>
                {result.pureWeight.toLocaleString("pt-BR", {
                  maximumFractionDigits: 3,
                })}{" "}
                g
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>{alloy.alloyMetalName}</span>
              <span>
                {result.alloyWeight.toLocaleString("pt-BR", {
                  maximumFractionDigits: 3,
                })}{" "}
                g
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-brand-200 pt-1 font-semibold text-brand-800">
              <span>{weight} g de liga</span>
              <span>{BRL.format(result.totalCost)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
