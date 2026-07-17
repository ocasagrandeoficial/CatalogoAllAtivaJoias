"use client";

import { useMemo, useState } from "react";
import { Plus, Ruler, Sparkles, X } from "lucide-react";

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
  lengthCost,
  lengthWeight,
  type SequenceStone,
} from "@/utils/jewelryMath";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Linha pronta para ser inserida na composição da Ficha Técnica.
export interface DraftLine {
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
  material: string;
  pricePerCm: number;
  weightPerCm: number | null;
}

export interface WireOption {
  id: string;
  name: string;
  material: string;
  profile: string;
  pricePerCm: number;
  weightPerCm: number | null;
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
      return c ? { kind, name: c.name, pricePerCm: c.pricePerCm, weightPerCm: c.weightPerCm } : null;
    }
    const w = wires.find((x) => x.id === id);
    return w
      ? { kind, name: w.name, pricePerCm: w.pricePerCm, weightPerCm: w.weightPerCm }
      : null;
  }, [selected, chains, wires]);

  const centimeters = Number(String(cm).replace(",", ".")) || 0;
  const cost = resolved ? lengthCost(resolved.pricePerCm, centimeters) : 0;
  const weight = resolved ? lengthWeight(resolved.weightPerCm, centimeters) : 0;

  const hasOptions = chains.length > 0 || wires.length > 0;

  function handleAdd() {
    if (!resolved || centimeters <= 0) return;
    onAppend([
      {
        name: `${resolved.name} (${centimeters} cm)`,
        type: resolved.kind === "chain" ? "componente" : "metal",
        packagePrice: resolved.pricePerCm,
        packageQuantity: 1,
        unit: "cm",
        quantityUsed: centimeters,
      },
    ]);
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
              {resolved.name} · {centimeters} cm
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

  const stoneById = useMemo(() => {
    const map = new Map<string, SequenceStone>();
    for (const s of stones) map.set(s.id, s);
    return map;
  }, [stones]);

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
        .map((g) => ({
          name: `${g.name} (${g.color})`,
          type: "gema" as const,
          packagePrice: g.unitPrice,
          packageQuantity: 1,
          unit: "un",
          quantityUsed: g.count,
        }))
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
            {/* Paleta de pedras disponíveis */}
            <div className="space-y-1.5">
              <Label className="text-xs">Toque para montar o padrão</Label>
              <div className="flex flex-wrap gap-2">
                {stones.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addToPattern(s.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: colorToHex(s.color) }}
                    />
                    {s.name}
                  </button>
                ))}
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
