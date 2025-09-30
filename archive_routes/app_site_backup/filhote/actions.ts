"use server";

import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// validação
const PuppyInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  color: z.string().optional().nullable(),
  gender: z.enum(["male", "female"]),
  price_cents: z.number().int().positive().optional().nullable(),
  status: z.enum(["disponivel","reservado","vendido"]),
  nascimento: z.string().optional().nullable(), // YYYY-MM-DD
  descricao: z.string().optional().nullable(),
  delivery: z.boolean().default(true),
  midia: z.array(z.string()).default([]),
});

export async function createPuppy(form: unknown) {
  const input = PuppyInput.omit({ id: true }).parse(form);
  const s = supabaseAdmin();
  const { data, error } = await s.from("puppies").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePuppy(form: unknown) {
  const input = PuppyInput.parse(form);
  const { id, ...fields } = input;
  if (!id) throw new Error("id requerido");
  const s = supabaseAdmin();
  const { error } = await s.from("puppies").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deletePuppy(id: string) {
  const s = supabaseAdmin();
  const { error } = await s.from("puppies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
