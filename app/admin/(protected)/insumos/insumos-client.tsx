"use client";

import { useMemo, useState } from "react";
import { Gem, Link2, Pencil, Plus, Layers, Sparkles } from "lucide-react";
import type { Chain, MetalAlloy, Stone, Wire } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { DataTableFacetedFilter } from "@/components/admin/data-table-faceted-filter";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { colorToHex, purityToThousandths } from "@/utils/jewelryMath";
import {
  deleteAlloy,
  deleteChain,
  deleteStone,
  deleteWire,
} from "@/app/admin/insumos/actions";
import {
  AlloyFormDialog,
  ChainFormDialog,
  StoneFormDialog,
  WireFormDialog,
} from "./insumo-forms";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function num(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}${suffix}`;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Conta ocorrências de um valor textual (case-insensitive). */
function countByNormalized(
  values: (string | null | undefined)[]
): Map<string, { label: string; count: number }> {
  const map = new Map<string, { label: string; count: number }>();
  for (const raw of values) {
    if (!raw?.trim()) continue;
    const key = normalize(raw);
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { label: raw.trim(), count: 1 });
  }
  return map;
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="text-slate-500 hover:bg-slate-100 hover:text-brand-700"
      aria-label="Editar"
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-10 text-center text-sm text-slate-400"
      >
        {label}
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────────
// Pedras — busca + facetas (lapidação, cor, tamanho)
// ─────────────────────────────────────────────────────────────

function StonesPanel({
  stones,
  onNew,
  onEdit,
}: {
  stones: Stone[];
  onNew: () => void;
  onEdit: (stone: Stone) => void;
}) {
  const [search, setSearch] = useState("");
  const [cuts, setCuts] = useState<Set<string>>(new Set());
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Set<string>>(new Set());

  const cutOptions = useMemo(() => {
    const map = countByNormalized(stones.map((s) => s.cut));
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [stones]);

  const colorOptions = useMemo(() => {
    const map = countByNormalized(stones.map((s) => s.color));
    return [...map.entries()]
      .map(([value, { label, count }]) => ({
        value,
        label,
        count,
        swatch: colorToHex(label),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [stones]);

  const sizeOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stones) {
      if (s.sizeMm === null || s.sizeMm === undefined) continue;
      const key = String(s.sizeMm);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([value, count]) => ({
        value,
        label: `${Number(value).toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })} mm`,
        count,
      }))
      .sort((a, b) => Number(a.value) - Number(b.value));
  }, [stones]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return stones.filter((s) => {
      if (cuts.size > 0 && !cuts.has(normalize(s.cut))) return false;
      if (colors.size > 0 && !colors.has(normalize(s.color))) return false;
      if (sizes.size > 0) {
        if (s.sizeMm === null || s.sizeMm === undefined) return false;
        if (!sizes.has(String(s.sizeMm))) return false;
      }
      if (!q) return true;
      // Busca livre: nome, lapidação, cor (e “código” embutido no nome).
      const haystack = normalize(
        [s.name, s.cut, s.color, s.sizeMm != null ? String(s.sizeMm) : ""].join(
          " "
        )
      );
      return haystack.includes(q);
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

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div>
          <h2 className="font-semibold text-slate-900">Pedras & gemas</h2>
          <p className="text-sm text-slate-500">
            {stones.length} cadastrada(s)
          </p>
        </div>
        <Button
          type="button"
          onClick={onNew}
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Nova pedra
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, cor ou referência..."
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        resultCount={filtered.length}
        totalCount={stones.length}
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Lapidação</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead className="text-right">Tam. (mm)</TableHead>
            <TableHead className="text-right">Peso (ct)</TableHead>
            <TableHead className="text-right">Valor un.</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <EmptyRow
              colSpan={7}
              label={
                stones.length === 0
                  ? "Nenhuma pedra cadastrada."
                  : "Nenhuma pedra corresponde aos filtros."
              }
            />
          )}
          {filtered.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium text-slate-900">
                {s.name}
              </TableCell>
              <TableCell className="capitalize text-slate-600">
                {s.cut}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-slate-300"
                    style={{ backgroundColor: colorToHex(s.color) }}
                  />
                  {s.color}
                </span>
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {num(s.sizeMm)}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {num(s.weightCt)}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {BRL.format(s.unitPrice)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <EditButton onClick={() => onEdit(s)} />
                  <DeleteConfirmDialog
                    title="Excluir pedra"
                    description={`Remover "${s.name}" da biblioteca de insumos?`}
                    onConfirm={() => deleteStone(s.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Fios/Chapas — busca + facetas (perfil, material, bitola)
// ─────────────────────────────────────────────────────────────

function WiresPanel({
  wires,
  onNew,
  onEdit,
}: {
  wires: Wire[];
  onNew: () => void;
  onEdit: (wire: Wire) => void;
}) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Set<string>>(new Set());
  const [materials, setMaterials] = useState<Set<string>>(new Set());
  const [gauges, setGauges] = useState<Set<string>>(new Set());

  const profileOptions = useMemo(() => {
    const map = countByNormalized(wires.map((w) => w.profile));
    return [...map.entries()]
      .map(([value, { label, count }]) => ({
        value,
        // Rótulo amigável: "chato" → "Fio Chato" (sem forçar se já for descritivo)
        label: label.toLowerCase().includes("fio")
          ? label
          : label.toLowerCase().includes("chapa")
            ? label
            : `Fio ${label.charAt(0).toUpperCase()}${label.slice(1)}`,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [wires]);

  const materialOptions = useMemo(() => {
    const map = countByNormalized(wires.map((w) => w.material));
    return [...map.entries()]
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [wires]);

  const gaugeOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of wires) {
      const key = String(w.gauge);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([value, count]) => ({
        value,
        label: `${Number(value).toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })} mm`,
        count,
      }))
      .sort((a, b) => Number(a.value) - Number(b.value));
  }, [wires]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return wires.filter((w) => {
      if (profiles.size > 0 && !profiles.has(normalize(w.profile))) return false;
      if (materials.size > 0 && !materials.has(normalize(w.material)))
        return false;
      if (gauges.size > 0 && !gauges.has(String(w.gauge))) return false;
      if (!q) return true;
      const haystack = normalize(
        [w.name, w.material, w.profile, String(w.gauge)].join(" ")
      );
      return haystack.includes(q);
    });
  }, [wires, search, profiles, materials, gauges]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    profiles.size > 0 ||
    materials.size > 0 ||
    gauges.size > 0;

  function resetFilters() {
    setSearch("");
    setProfiles(new Set());
    setMaterials(new Set());
    setGauges(new Set());
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div>
          <h2 className="font-semibold text-slate-900">Fios & chapas</h2>
          <p className="text-sm text-slate-500">
            {wires.length} cadastrado(s)
          </p>
        </div>
        <Button
          type="button"
          onClick={onNew}
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Novo fio/chapa
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome, material ou bitola..."
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        resultCount={filtered.length}
        totalCount={wires.length}
      >
        <DataTableFacetedFilter
          title="Perfil"
          options={profileOptions}
          selected={profiles}
          onSelectedChange={setProfiles}
        />
        <DataTableFacetedFilter
          title="Material"
          options={materialOptions}
          selected={materials}
          onSelectedChange={setMaterials}
        />
        <DataTableFacetedFilter
          title="Bitola"
          options={gaugeOptions}
          selected={gauges}
          onSelectedChange={setGauges}
        />
      </DataTableToolbar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Bitola (mm)</TableHead>
            <TableHead className="text-right">Largura</TableHead>
            <TableHead className="text-right">Valor/cm</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <EmptyRow
              colSpan={7}
              label={
                wires.length === 0
                  ? "Nenhum fio/chapa cadastrado."
                  : "Nenhum fio/chapa corresponde aos filtros."
              }
            />
          )}
          {filtered.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="font-medium text-slate-900">
                {w.name}
              </TableCell>
              <TableCell className="text-slate-600">{w.material}</TableCell>
              <TableCell className="capitalize text-slate-600">
                {w.profile}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {num(w.gauge)}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {num(w.widthMm, " mm")}
              </TableCell>
              <TableCell className="text-right text-slate-600">
                {BRL.format(w.pricePerCm)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <EditButton onClick={() => onEdit(w)} />
                  <DeleteConfirmDialog
                    title="Excluir fio/chapa"
                    description={`Remover "${w.name}" da biblioteca de insumos?`}
                    onConfirm={() => deleteWire(w.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

interface InsumosClientProps {
  stones: Stone[];
  chains: Chain[];
  wires: Wire[];
  alloys: MetalAlloy[];
}

export function InsumosClient({
  stones,
  chains,
  wires,
  alloys,
}: InsumosClientProps) {
  const [stoneOpen, setStoneOpen] = useState(false);
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);

  const [chainOpen, setChainOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);

  const [wireOpen, setWireOpen] = useState(false);
  const [selectedWire, setSelectedWire] = useState<Wire | null>(null);

  const [alloyOpen, setAlloyOpen] = useState(false);
  const [selectedAlloy, setSelectedAlloy] = useState<MetalAlloy | null>(null);

  function openNewStone() {
    setSelectedStone(null);
    setStoneOpen(true);
  }
  function openEditStone(stone: Stone) {
    setSelectedStone(stone);
    setStoneOpen(true);
  }
  function handleStoneOpenChange(open: boolean) {
    setStoneOpen(open);
    if (!open) setSelectedStone(null);
  }

  function openNewChain() {
    setSelectedChain(null);
    setChainOpen(true);
  }
  function openEditChain(chain: Chain) {
    setSelectedChain(chain);
    setChainOpen(true);
  }
  function handleChainOpenChange(open: boolean) {
    setChainOpen(open);
    if (!open) setSelectedChain(null);
  }

  function openNewWire() {
    setSelectedWire(null);
    setWireOpen(true);
  }
  function openEditWire(wire: Wire) {
    setSelectedWire(wire);
    setWireOpen(true);
  }
  function handleWireOpenChange(open: boolean) {
    setWireOpen(open);
    if (!open) setSelectedWire(null);
  }

  function openNewAlloy() {
    setSelectedAlloy(null);
    setAlloyOpen(true);
  }
  function openEditAlloy(alloy: MetalAlloy) {
    setSelectedAlloy(alloy);
    setAlloyOpen(true);
  }
  function handleAlloyOpenChange(open: boolean) {
    setAlloyOpen(open);
    if (!open) setSelectedAlloy(null);
  }

  return (
    <Tabs defaultValue="stones">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="stones">
          <Gem className="h-4 w-4" /> Pedras
        </TabsTrigger>
        <TabsTrigger value="chains">
          <Link2 className="h-4 w-4" /> Correntes
        </TabsTrigger>
        <TabsTrigger value="wires">
          <Layers className="h-4 w-4" /> Fios/Chapas
        </TabsTrigger>
        <TabsTrigger value="alloys">
          <Sparkles className="h-4 w-4" /> Ligas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stones">
        <StonesPanel
          stones={stones}
          onNew={openNewStone}
          onEdit={openEditStone}
        />
        <StoneFormDialog
          open={stoneOpen}
          onOpenChange={handleStoneOpenChange}
          stone={selectedStone}
        />
      </TabsContent>

      <TabsContent value="chains">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="font-semibold text-slate-900">Correntes</h2>
              <p className="text-sm text-slate-500">
                {chains.length} cadastrada(s)
              </p>
            </div>
            <Button
              type="button"
              onClick={openNewChain}
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Nova corrente
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Malha</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Esp. (mm)</TableHead>
                <TableHead className="text-right">Peso/cm</TableHead>
                <TableHead className="text-right">Valor/cm</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chains.length === 0 && (
                <EmptyRow colSpan={7} label="Nenhuma corrente cadastrada." />
              )}
              {chains.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-slate-900">
                    {c.name}
                  </TableCell>
                  <TableCell className="capitalize text-slate-600">
                    {c.mesh}
                  </TableCell>
                  <TableCell className="text-slate-600">{c.material}</TableCell>
                  <TableCell className="text-right text-slate-600">
                    {num(c.thicknessMm)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {num(c.weightPerCm, " g")}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {BRL.format(c.pricePerCm)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <EditButton onClick={() => openEditChain(c)} />
                      <DeleteConfirmDialog
                        title="Excluir corrente"
                        description={`Remover "${c.name}" da biblioteca de insumos?`}
                        onConfirm={() => deleteChain(c.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <ChainFormDialog
          open={chainOpen}
          onOpenChange={handleChainOpenChange}
          chain={selectedChain}
        />
      </TabsContent>

      <TabsContent value="wires">
        <WiresPanel wires={wires} onNew={openNewWire} onEdit={openEditWire} />
        <WireFormDialog
          open={wireOpen}
          onOpenChange={handleWireOpenChange}
          wire={selectedWire}
        />
      </TabsContent>

      <TabsContent value="alloys">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h2 className="font-semibold text-slate-900">Ligas metálicas</h2>
              <p className="text-sm text-slate-500">
                {alloys.length} cadastrada(s)
              </p>
            </div>
            <Button
              type="button"
              onClick={openNewAlloy}
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Nova liga
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Teor</TableHead>
                <TableHead>Metal nobre</TableHead>
                <TableHead className="text-right">R$/g nobre</TableHead>
                <TableHead>Pré-liga</TableHead>
                <TableHead className="text-right">R$/g liga</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alloys.length === 0 && (
                <EmptyRow colSpan={7} label="Nenhuma liga cadastrada." />
              )}
              {alloys.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-slate-900">
                    {a.name}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {purityToThousandths(a.purity)}‰
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {a.pureMetalName}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {BRL.format(a.pureMetalPricePerG)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {a.alloyMetalName}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {BRL.format(a.alloyMetalPricePerG)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <EditButton onClick={() => openEditAlloy(a)} />
                      <DeleteConfirmDialog
                        title="Excluir liga"
                        description={`Remover "${a.name}" da biblioteca de insumos?`}
                        onConfirm={() => deleteAlloy(a.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <AlloyFormDialog
          open={alloyOpen}
          onOpenChange={handleAlloyOpenChange}
          alloy={selectedAlloy}
        />
      </TabsContent>
    </Tabs>
  );
}
