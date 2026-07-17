"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export type InsumoActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

function revalidateAll() {
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/ficha-tecnica");
}

const optionalNumber = z
  .number()
  .nonnegative()
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v));

const requiredNumber = z.number().nonnegative();

const stoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da pedra."),
  cut: z.string().trim().min(1).default("brilhante"),
  color: z.string().trim().min(1).default("branco"),
  sizeMm: optionalNumber,
  weightCt: requiredNumber,
  unitPrice: requiredNumber,
});

const chainSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da corrente."),
  mesh: z.string().trim().min(1).default("veneziana"),
  material: z.string().trim().min(1).default("Ouro 18k"),
  thicknessMm: optionalNumber,
  weightPerCm: optionalNumber,
  pricePerCm: requiredNumber,
});

const wireSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome do fio/chapa."),
  material: z.string().trim().min(1).default("Ouro 18k"),
  profile: z.string().trim().min(1).default("redondo"),
  gauge: requiredNumber,
  widthMm: optionalNumber,
  weightPerCm: optionalNumber,
  pricePerCm: requiredNumber,
});

const alloySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da liga."),
  purity: z.number().min(0).max(1),
  pureMetalName: z.string().trim().min(1).default("Ouro 24k"),
  pureMetalPricePerG: requiredNumber,
  alloyMetalName: z.string().trim().min(1).default("Pré-liga (Prata/Cobre)"),
  alloyMetalPricePerG: requiredNumber,
});

function zodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Dados inválidos. Verifique o formulário.";
}

// ─────────────────────────────────────────────────────────────
// Pedras
// ─────────────────────────────────────────────────────────────

export async function saveStone(
  input: unknown
): Promise<InsumoActionState> {
  await requireAdmin();

  const parsed = stoneSchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.stone.update({ where: { id }, data });
      revalidateAll();
      return { success: true, message: "Pedra atualizada com sucesso." };
    }
    await prisma.stone.create({ data });
    revalidateAll();
    return { success: true, message: "Pedra cadastrada com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar a pedra."
        : "Não foi possível cadastrar a pedra.",
    };
  }
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
  return { success: true, message: "Pedra excluída." };
}

// ─────────────────────────────────────────────────────────────
// Correntes
// ─────────────────────────────────────────────────────────────

export async function saveChain(
  input: unknown
): Promise<InsumoActionState> {
  await requireAdmin();

  const parsed = chainSchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.chain.update({ where: { id }, data });
      revalidateAll();
      return { success: true, message: "Corrente atualizada com sucesso." };
    }
    await prisma.chain.create({ data });
    revalidateAll();
    return { success: true, message: "Corrente cadastrada com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar a corrente."
        : "Não foi possível cadastrar a corrente.",
    };
  }
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
  return { success: true, message: "Corrente excluída." };
}

// ─────────────────────────────────────────────────────────────
// Fios / chapas
// ─────────────────────────────────────────────────────────────

export async function saveWire(input: unknown): Promise<InsumoActionState> {
  await requireAdmin();

  const parsed = wireSchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.wire.update({ where: { id }, data });
      revalidateAll();
      return { success: true, message: "Fio/chapa atualizado com sucesso." };
    }
    await prisma.wire.create({ data });
    revalidateAll();
    return { success: true, message: "Fio/chapa cadastrado com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar o fio/chapa."
        : "Não foi possível cadastrar o fio/chapa.",
    };
  }
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
  return { success: true, message: "Fio/chapa excluído." };
}

// ─────────────────────────────────────────────────────────────
// Ligas
// ─────────────────────────────────────────────────────────────

export async function saveAlloy(
  input: unknown
): Promise<InsumoActionState> {
  await requireAdmin();

  const parsed = alloySchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.metalAlloy.update({ where: { id }, data });
      revalidateAll();
      return { success: true, message: "Liga atualizada com sucesso." };
    }
    await prisma.metalAlloy.create({ data });
    revalidateAll();
    return { success: true, message: "Liga cadastrada com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar a liga."
        : "Não foi possível cadastrar a liga.",
    };
  }
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
  return { success: true, message: "Liga excluída." };
}
