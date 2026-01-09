import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { mapDomainStatusToDb } from "./mapDbPuppyToDomain";

/**
 * Atualiza linhas na tabela `puppies`, garantindo que o campo `status`
 * seja convertido para o valor esperado pelo banco (pt-BR) quando presente.
 *
 * @param payload - campos a atualizar (pode incluir `status` em inglês)
 * @param where - condição simples de igualdade { column, value } (opcional)
 */
export async function updatePuppyRow(payload: Record<string, any>, where?: { column: string; value: any }) {
  const sb = supabaseAdmin();
  const body = { ...payload };
  if (body.status) {
    body.status = mapDomainStatusToDb(body.status);
  }

  let query = sb.from("puppies").update(body).select();
  if (where) query = query.eq(where.column, where.value as any);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Insere um novo registro em `puppies`, convertendo `status` quando informado.
 */
export async function insertPuppyRow(payload: Record<string, any>) {
  const sb = supabaseAdmin();
  const body = { ...payload };
  if (body.status) body.status = mapDomainStatusToDb(body.status);
  const { data, error } = await sb.from("puppies").insert(body).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

const dbWrites = { updatePuppyRow, insertPuppyRow };

export default dbWrites;
