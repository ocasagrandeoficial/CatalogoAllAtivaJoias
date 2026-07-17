"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Chain, MetalAlloy, Stone, Wire } from "@prisma/client";

import {
  saveStone,
  saveChain,
  saveWire,
  saveAlloy,
  type InsumoActionState,
} from "@/app/admin/insumos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { colorToHex, computeAlloy, karatToPurity } from "@/utils/jewelryMath";

const CUTS = [
  "brilhante",
  "navete",
  "gota",
  "oval",
  "princesa",
  "esmeralda",
  "coração",
  "gota pêra",
  "redonda",
  "quadrada",
];
const MESHES = [
  "veneziana",
  "cartier",
  "singapura",
  "grumet",
  "português",
  "cordão baiano",
  "malha francesa",
  "elo português",
];
const PROFILES = ["redondo", "quadrado", "meia-cana", "chato/laminado"];
const MATERIALS = [
  "Ouro 18k",
  "Ouro 24k",
  "Prata 925",
  "Prata 950",
  "Ouro branco 18k",
  "Latão",
];

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function SubmitButton({
  isPending,
  isEditing,
}: {
  isPending: boolean;
  isEditing: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="bg-brand-600 text-white hover:bg-brand-700"
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      {isEditing ? "Salvar alterações" : "Cadastrar"}
    </Button>
  );
}

function useSaveDialog(
  action: (
    state: InsumoActionState,
    formData: FormData
  ) => Promise<InsumoActionState>
) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<
    InsumoActionState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return { open, setOpen, state, formAction, isPending };
}

// ─────────────────────────────────────────────────────────────
// Pedra
// ─────────────────────────────────────────────────────────────

export function StoneFormDialog({
  stone,
  trigger,
}: {
  stone?: Stone;
  trigger: React.ReactNode;
}) {
  const isEditing = Boolean(stone);
  const { open, setOpen, state, formAction, isPending } =
    useSaveDialog(saveStone);
  const [color, setColor] = useState(stone?.color ?? "branco");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar pedra" : "Nova pedra"}</DialogTitle>
          <DialogDescription>
            Cadastre gemas com lapidação, cor e peso para usar no sequenciador.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="id" value={stone!.id} />}

          <div className="space-y-2">
            <Label htmlFor="stone-name">Nome</Label>
            <Input
              id="stone-name"
              name="name"
              defaultValue={stone?.name}
              placeholder="Ex.: Zircônia rosa 2mm"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stone-cut">Formato / lapidação</Label>
              <Input
                id="stone-cut"
                name="cut"
                list="cut-options"
                defaultValue={stone?.cut ?? "brilhante"}
                placeholder="brilhante"
              />
              <datalist id="cut-options">
                {CUTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stone-color">Cor</Label>
              <div className="relative">
                <span
                  className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-slate-300"
                  style={{ backgroundColor: colorToHex(color) }}
                />
                <Input
                  id="stone-color"
                  name="color"
                  className="pl-8"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="rosa"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stone-size">Tamanho (mm)</Label>
              <Input
                id="stone-size"
                name="sizeMm"
                type="number"
                step="0.01"
                min={0}
                defaultValue={stone?.sizeMm ?? ""}
                placeholder="2.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stone-weight">Peso (ct)</Label>
              <Input
                id="stone-weight"
                name="weightCt"
                type="number"
                step="0.001"
                min={0}
                defaultValue={stone?.weightCt ?? ""}
                placeholder="0.03"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stone-price">Valor unit. (R$)</Label>
              <Input
                id="stone-price"
                name="unitPrice"
                type="number"
                step="0.01"
                min={0}
                defaultValue={stone?.unitPrice ?? ""}
                placeholder="1.50"
              />
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <DialogFooter>
            <SubmitButton isPending={isPending} isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Corrente
// ─────────────────────────────────────────────────────────────

export function ChainFormDialog({
  chain,
  trigger,
}: {
  chain?: Chain;
  trigger: React.ReactNode;
}) {
  const isEditing = Boolean(chain);
  const { open, setOpen, state, formAction, isPending } =
    useSaveDialog(saveChain);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar corrente" : "Nova corrente"}
          </DialogTitle>
          <DialogDescription>
            Correntes vendidas por cm, com malha e espessura.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="id" value={chain!.id} />}

          <div className="space-y-2">
            <Label htmlFor="chain-name">Nome</Label>
            <Input
              id="chain-name"
              name="name"
              defaultValue={chain?.name}
              placeholder="Ex.: Corrente veneziana 1mm"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="chain-mesh">Malha / modelo</Label>
              <Input
                id="chain-mesh"
                name="mesh"
                list="mesh-options"
                defaultValue={chain?.mesh ?? "veneziana"}
                placeholder="veneziana"
              />
              <datalist id="mesh-options">
                {MESHES.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain-material">Material</Label>
              <Input
                id="chain-material"
                name="material"
                list="material-options"
                defaultValue={chain?.material ?? "Ouro 18k"}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="chain-thickness">Espessura (mm)</Label>
              <Input
                id="chain-thickness"
                name="thicknessMm"
                type="number"
                step="0.01"
                min={0}
                defaultValue={chain?.thicknessMm ?? ""}
                placeholder="1.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain-weight">Peso/cm (g)</Label>
              <Input
                id="chain-weight"
                name="weightPerCm"
                type="number"
                step="0.001"
                min={0}
                defaultValue={chain?.weightPerCm ?? ""}
                placeholder="0.15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain-price">Valor/cm (R$)</Label>
              <Input
                id="chain-price"
                name="pricePerCm"
                type="number"
                step="0.01"
                min={0}
                defaultValue={chain?.pricePerCm ?? ""}
                placeholder="12.00"
              />
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <DialogFooter>
            <SubmitButton isPending={isPending} isEditing={isEditing} />
          </DialogFooter>
        </form>
        <MaterialsDatalist />
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Fio / chapa
// ─────────────────────────────────────────────────────────────

export function WireFormDialog({
  wire,
  trigger,
}: {
  wire?: Wire;
  trigger: React.ReactNode;
}) {
  const isEditing = Boolean(wire);
  const { open, setOpen, state, formAction, isPending } =
    useSaveDialog(saveWire);
  const [profile, setProfile] = useState(wire?.profile ?? "redondo");
  const isFlat = profile.startsWith("chato");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar fio/chapa" : "Novo fio/chapa"}
          </DialogTitle>
          <DialogDescription>
            Fios e laminados usados em garras, chatões e acabamentos.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="id" value={wire!.id} />}

          <div className="space-y-2">
            <Label htmlFor="wire-name">Nome</Label>
            <Input
              id="wire-name"
              name="name"
              defaultValue={wire?.name}
              placeholder="Ex.: Fio chato 0.45"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wire-material">Material</Label>
              <Input
                id="wire-material"
                name="material"
                list="material-options"
                defaultValue={wire?.material ?? "Ouro 18k"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wire-profile">Perfil</Label>
              <Input
                id="wire-profile"
                name="profile"
                list="profile-options"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
              />
              <datalist id="profile-options">
                {PROFILES.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wire-gauge">Bitola / espessura (mm)</Label>
              <Input
                id="wire-gauge"
                name="gauge"
                type="number"
                step="0.01"
                min={0}
                defaultValue={wire?.gauge ?? ""}
                placeholder="0.60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wire-width">
                Largura (mm){" "}
                <span className="text-xs text-slate-400">
                  {isFlat ? "(chato)" : "(opcional)"}
                </span>
              </Label>
              <Input
                id="wire-width"
                name="widthMm"
                type="number"
                step="0.01"
                min={0}
                defaultValue={wire?.widthMm ?? ""}
                placeholder={isFlat ? "2.0" : "—"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wire-weight">Peso/cm (g)</Label>
              <Input
                id="wire-weight"
                name="weightPerCm"
                type="number"
                step="0.001"
                min={0}
                defaultValue={wire?.weightPerCm ?? ""}
                placeholder="0.08"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wire-price">Valor/cm (R$)</Label>
              <Input
                id="wire-price"
                name="pricePerCm"
                type="number"
                step="0.01"
                min={0}
                defaultValue={wire?.pricePerCm ?? ""}
                placeholder="6.50"
              />
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <DialogFooter>
            <SubmitButton isPending={isPending} isEditing={isEditing} />
          </DialogFooter>
        </form>
        <MaterialsDatalist />
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Liga metálica (com calculadora dinâmica)
// ─────────────────────────────────────────────────────────────

export function AlloyFormDialog({
  alloy,
  trigger,
}: {
  alloy?: MetalAlloy;
  trigger: React.ReactNode;
}) {
  const isEditing = Boolean(alloy);
  const { open, setOpen, state, formAction, isPending } =
    useSaveDialog(saveAlloy);

  const [karat, setKarat] = useState(
    alloy ? String(Math.round(alloy.purity * 24)) : "18"
  );
  const [pureprice, setPurePrice] = useState(
    alloy ? String(alloy.pureMetalPricePerG) : ""
  );
  const [alloyprice, setAlloyPrice] = useState(
    alloy ? String(alloy.alloyMetalPricePerG) : ""
  );
  const [demoWeight, setDemoWeight] = useState("10");

  const purity = karatToPurity(Number(karat));

  const result = useMemo(
    () =>
      computeAlloy({
        finalWeight: Number(demoWeight) || 0,
        purity,
        pureMetalPricePerG: Number(pureprice) || 0,
        alloyMetalPricePerG: Number(alloyprice) || 0,
      }),
    [demoWeight, purity, pureprice, alloyprice]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar liga" : "Nova liga"}</DialogTitle>
          <DialogDescription>
            Defina o teor e os metais base. A calculadora mostra a proporção em
            tempo real.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="id" value={alloy!.id} />}
          <input type="hidden" name="purity" value={purity} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="alloy-name">Nome da liga</Label>
              <Input
                id="alloy-name"
                name="name"
                defaultValue={alloy?.name}
                placeholder="Ex.: Ouro 18k (Au750)"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alloy-karat">
                Teor (quilates){" "}
                <span className="text-xs font-medium text-brand-700">
                  = {Math.round(purity * 1000)}‰
                </span>
              </Label>
              <Input
                id="alloy-karat"
                type="number"
                step="1"
                min={1}
                max={24}
                value={karat}
                onChange={(e) => setKarat(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="alloy-pure-name">Metal nobre (puro)</Label>
              <Input
                id="alloy-pure-name"
                name="pureMetalName"
                defaultValue={alloy?.pureMetalName ?? "Ouro 24k"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alloy-pure-price">R$/g do metal nobre</Label>
              <Input
                id="alloy-pure-price"
                name="pureMetalPricePerG"
                type="number"
                step="0.01"
                min={0}
                value={pureprice}
                onChange={(e) => setPurePrice(e.target.value)}
                placeholder="380.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="alloy-mix-name">Pré-liga (adição)</Label>
              <Input
                id="alloy-mix-name"
                name="alloyMetalName"
                defaultValue={alloy?.alloyMetalName ?? "Pré-liga (Prata/Cobre)"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alloy-mix-price">R$/g da pré-liga</Label>
              <Input
                id="alloy-mix-price"
                name="alloyMetalPricePerG"
                type="number"
                step="0.01"
                min={0}
                value={alloyprice}
                onChange={(e) => setAlloyPrice(e.target.value)}
                placeholder="8.00"
              />
            </div>
          </div>

          <AlloyCalculator
            demoWeight={demoWeight}
            setDemoWeight={setDemoWeight}
            result={result}
          />

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <DialogFooter>
            <SubmitButton isPending={isPending} isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AlloyCalculator({
  demoWeight,
  setDemoWeight,
  result,
}: {
  demoWeight: string;
  setDemoWeight: (v: string) => void;
  result: ReturnType<typeof computeAlloy>;
}) {
  return (
    <div className="rounded-md border border-brand-200 bg-brand-50/60 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="alloy-demo" className="text-brand-800">
            Calculadora — peso final desejado (g)
          </Label>
          <Input
            id="alloy-demo"
            type="number"
            step="0.01"
            min={0}
            value={demoWeight}
            onChange={(e) => setDemoWeight(e.target.value)}
            className="w-40 bg-white"
          />
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-brand-700">
            Custo por grama
          </p>
          <p className="text-lg font-semibold text-brand-800">
            {BRL.format(result.costPerGram)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-white p-3 shadow-sm">
          <p className="text-slate-500">Metal nobre puro</p>
          <p className="text-base font-semibold text-slate-900">
            {result.pureWeight.toLocaleString("pt-BR", {
              maximumFractionDigits: 3,
            })}{" "}
            g
          </p>
          <p className="text-xs text-slate-500">
            {BRL.format(result.pureCost)}
          </p>
        </div>
        <div className="rounded-md bg-white p-3 shadow-sm">
          <p className="text-slate-500">Pré-liga (adição)</p>
          <p className="text-base font-semibold text-slate-900">
            {result.alloyWeight.toLocaleString("pt-BR", {
              maximumFractionDigits: 3,
            })}{" "}
            g
          </p>
          <p className="text-xs text-slate-500">
            {BRL.format(result.alloyCost)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-right text-sm text-slate-600">
        Custo total do lote:{" "}
        <span className="font-semibold text-brand-800">
          {BRL.format(result.totalCost)}
        </span>
      </p>
    </div>
  );
}

function MaterialsDatalist() {
  return (
    <datalist id="material-options">
      {MATERIALS.map((m) => (
        <option key={m} value={m} />
      ))}
    </datalist>
  );
}
