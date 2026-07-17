"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export type InsumoActionState = {
  error?: string;
  success?: boolean;
};

function revalidateAll() {
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/ficha-tecnica");
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === "") return fallback;
  const value = Number(String(raw).replace(",", "."));
  return Number.isFinite(value) ? value : fallback;
}

function optNum(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === "") return null;
  const value = Number(String(raw).replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ─────────────────────────────────────────────────────────────
// Pedras (Stone)
// ─────────────────────────────────────────────────────────────

export async function saveStone(
  _prev: InsumoActionState,
  formData: FormData
): Promise<InsumoActionState> {
  await requireAdmin();

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Informe o nome da pedra." };

  const data = {
    name,
    cut: str(formData, "cut") || "brilhante",
    color: str(formData, "color") || "branco",
    sizeMm: optNum(formData, "sizeMm"),
    weightCt: num(formData, "weightCt"),
    unitPrice: num(formData, "unitPrice"),
  };

  try {
    if (id) await prisma.stone.update({ where: { id }, data });
    else await prisma.stone.create({ data });
  } catch {
    return { error: "Não foi possível salvar a pedra." };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteStone(id: string): Promise<InsumoActionState> {
  await requireAdmin();
  if (!id) return { error: "Pedra inválida." };
  try {
    await prisma.stone.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a pedra." };
  }
  revalidateAll();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Correntes (Chain)
// ─────────────────────────────────────────────────────────────

export async function saveChain(
  _prev: InsumoActionState,
  formData: FormData
): Promise<InsumoActionState> {
  await requireAdmin();

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Informe o nome da corrente." };

  const data = {
    name,
    mesh: str(formData, "mesh") || "veneziana",
    material: str(formData, "material") || "Ouro 18k",
    thicknessMm: optNum(formData, "thicknessMm"),
    weightPerCm: optNum(formData, "weightPerCm"),
    pricePerCm: num(formData, "pricePerCm"),
  };

  try {
    if (id) await prisma.chain.update({ where: { id }, data });
    else await prisma.chain.create({ data });
  } catch {
    return { error: "Não foi possível salvar a corrente." };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteChain(id: string): Promise<InsumoActionState> {
  await requireAdmin();
  if (!id) return { error: "Corrente inválida." };
  try {
    await prisma.chain.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a corrente." };
  }
  revalidateAll();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Fios e chapas (Wire)
// ─────────────────────────────────────────────────────────────

export async function saveWire(
  _prev: InsumoActionState,
  formData: FormData
): Promise<InsumoActionState> {
  await requireAdmin();

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Informe o nome do fio/chapa." };

  const data = {
    name,
    material: str(formData, "material") || "Ouro 18k",
    profile: str(formData, "profile") || "redondo",
    gauge: num(formData, "gauge"),
    widthMm: optNum(formData, "widthMm"),
    weightPerCm: optNum(formData, "weightPerCm"),
    pricePerCm: num(formData, "pricePerCm"),
  };

  try {
    if (id) await prisma.wire.update({ where: { id }, data });
    else await prisma.wire.create({ data });
  } catch {
    return { error: "Não foi possível salvar o fio/chapa." };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteWire(id: string): Promise<InsumoActionState> {
  await requireAdmin();
  if (!id) return { error: "Fio/chapa inválido." };
  try {
    await prisma.wire.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir o fio/chapa." };
  }
  revalidateAll();
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Ligas metálicas (MetalAlloy)
// ─────────────────────────────────────────────────────────────

export async function saveAlloy(
  _prev: InsumoActionState,
  formData: FormData
): Promise<InsumoActionState> {
  await requireAdmin();

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Informe o nome da liga." };

  const purity = num(formData, "purity");
  const data = {
    name,
    purity: Math.min(Math.max(purity, 0), 1),
    pureMetalName: str(formData, "pureMetalName") || "Ouro 24k",
    pureMetalPricePerG: num(formData, "pureMetalPricePerG"),
    alloyMetalName: str(formData, "alloyMetalName") || "Pré-liga (Prata/Cobre)",
    alloyMetalPricePerG: num(formData, "alloyMetalPricePerG"),
  };

  try {
    if (id) await prisma.metalAlloy.update({ where: { id }, data });
    else await prisma.metalAlloy.create({ data });
  } catch {
    return { error: "Não foi possível salvar a liga." };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteAlloy(id: string): Promise<InsumoActionState> {
  await requireAdmin();
  if (!id) return { error: "Liga inválida." };
  try {
    await prisma.metalAlloy.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a liga." };
  }
  revalidateAll();
  return { success: true };
}
