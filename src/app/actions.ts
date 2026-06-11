"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { ActionResult, TransactionType } from "@/lib/types";
import { formatBRL } from "@/lib/format";

function revalidateAll() {
  revalidatePath("/", "layout");
}

function fail(message: string): ActionResult {
  return { ok: false, error: message };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validTransaction(
  type: string,
  amount: number,
  occurredOn: string
): string | null {
  if (!["income", "expense", "adjustment"].includes(type)) return "Tipo inválido.";
  if (!Number.isFinite(amount)) return "Valor inválido.";
  if (type !== "adjustment" && amount <= 0) return "O valor deve ser maior que zero.";
  if (!DATE_RE.test(occurredOn)) return "Data inválida.";
  return null;
}

interface TransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  occurred_on: string;
  source_id: string | null;
}

function transactionRow(input: TransactionInput) {
  return {
    type: input.type,
    description: input.description.trim(),
    amount: input.amount,
    occurred_on: input.occurred_on,
    source_id: input.type === "income" ? input.source_id : null,
  };
}

export async function addTransaction(input: TransactionInput): Promise<ActionResult> {
  const invalid = validTransaction(input.type, input.amount, input.occurred_on);
  if (invalid) return fail(invalid);

  const { error } = await getSupabase()
    .from("transactions")
    .insert(transactionRow(input));
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<ActionResult> {
  const invalid = validTransaction(input.type, input.amount, input.occurred_on);
  if (invalid) return fail(invalid);

  const { error } = await getSupabase()
    .from("transactions")
    .update(transactionRow(input))
    .eq("id", id);
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { error } = await getSupabase().from("transactions").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

async function currentBalance(): Promise<{ value?: number; error?: string }> {
  const { data, error } = await getSupabase()
    .from("transactions")
    .select("type, amount");
  if (error) return { error: error.message };
  const value = (data ?? []).reduce((acc, t) => {
    if (t.type === "income") return acc + Number(t.amount);
    if (t.type === "expense") return acc - Number(t.amount);
    return acc + Number(t.amount);
  }, 0);
  return { value };
}

/**
 * Ajusta o saldo total para um novo valor: calcula a diferença em relação ao
 * saldo atual e registra uma transação de ajuste (positiva ou negativa).
 */
export async function setSubtotal(newTotal: number): Promise<ActionResult> {
  if (!Number.isFinite(newTotal)) return fail("Valor inválido.");

  const current = await currentBalance();
  if (current.error) return fail(current.error);

  const diff = Number((newTotal - current.value!).toFixed(2));
  if (diff === 0) return { ok: true };

  const { error } = await getSupabase().from("transactions").insert({
    type: "adjustment",
    description: "Ajuste de saldo",
    amount: diff,
    occurred_on: new Date().toISOString().slice(0, 10),
  });
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

/* ---------- Fontes de entrada ---------- */

export async function createSource(name: string): Promise<ActionResult & { id?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return fail("Dê um nome para a fonte.");
  if (trimmed.length > 40) return fail("Nome muito longo.");

  const { data, error } = await getSupabase()
    .from("sources")
    .insert({ name: trimmed })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return fail("Já existe uma fonte com esse nome.");
    return fail(error.message);
  }
  revalidateAll();
  return { ok: true, id: data.id };
}

export async function deleteSource(id: string): Promise<ActionResult> {
  const { error } = await getSupabase().from("sources").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

/* ---------- Metas ---------- */

interface GoalInput {
  name: string;
  target_amount: number;
  deadline: string | null;
  color: string;
  icon: string;
  photo_url: string | null;
}

function validGoal(input: GoalInput): string | null {
  if (!input.name.trim()) return "Dê um nome para a meta.";
  if (!Number.isFinite(input.target_amount) || input.target_amount <= 0)
    return "O valor da meta deve ser maior que zero.";
  if (input.deadline && !DATE_RE.test(input.deadline)) return "Prazo inválido.";
  return null;
}

function goalRow(input: GoalInput) {
  return {
    name: input.name.trim(),
    target_amount: input.target_amount,
    deadline: input.deadline,
    color: input.color,
    icon: input.icon,
    photo_url: input.photo_url,
  };
}

/**
 * Coluna inexistente (migração do ícone ainda não rodada): tenta sem o campo.
 * 42703 = Postgres undefined_column · PGRST204 = coluna fora do schema cache do PostgREST.
 */
function isMissingColumn(error: { code?: string } | null): boolean {
  return !!error && (error.code === "42703" || error.code === "PGRST204");
}

export async function createGoal(input: GoalInput): Promise<ActionResult> {
  const invalid = validGoal(input);
  if (invalid) return fail(invalid);

  const row = goalRow(input);
  let { error } = await getSupabase().from("goals").insert(row);
  if (isMissingColumn(error)) {
    const { icon: _i, photo_url: _p, ...legacy } = row;
    ({ error } = await getSupabase().from("goals").insert(legacy));
  }
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

export async function updateGoal(id: string, input: GoalInput): Promise<ActionResult> {
  const invalid = validGoal(input);
  if (invalid) return fail(invalid);

  const row = goalRow(input);
  let { error } = await getSupabase().from("goals").update(row).eq("id", id);
  if (isMissingColumn(error)) {
    const { icon: _i, photo_url: _p, ...legacy } = row;
    ({ error } = await getSupabase().from("goals").update(legacy).eq("id", id));
  }
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

/* ---------- foto de desejo (Supabase Storage, bucket público goal-photos) ---------- */

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadGoalPhoto(
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return fail("Escolha uma imagem.");
  if (file.size > 4 * 1024 * 1024) return fail("A imagem deve ter no máximo 4 MB.");
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return fail("Formato inválido — use JPG, PNG, WEBP ou GIF.");

  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabase()
    .storage.from("goal-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return fail(error.message);

  const { data } = getSupabase().storage.from("goal-photos").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const { error } = await getSupabase().from("goals").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

/**
 * Finaliza uma meta concluída: ela permanece visível (somente leitura) e o
 * valor guardado deixa de contar como reservado, voltando ao disponível.
 */
export async function completeGoal(id: string): Promise<ActionResult> {
  const { error } = await getSupabase()
    .from("goals")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id);
  if (isMissingColumn(error)) {
    return fail(
      "Rode a migração no Supabase: alter table public.goals add column if not exists completed_at timestamptz;"
    );
  }
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}

/**
 * Guarda (ou retira, com delta negativo) dinheiro em uma meta.
 * O depósito é proporcional ao que existe livre: nunca passa do saldo
 * disponível (saldo total − total já reservado em metas).
 */
export async function depositToGoal(id: string, delta: number): Promise<ActionResult> {
  if (!Number.isFinite(delta) || delta === 0) return fail("Valor inválido.");

  const supabase = getSupabase();
  const [goal, allGoals, bal] = await Promise.all([
    supabase.from("goals").select("saved_amount").eq("id", id).single(),
    supabase.from("goals").select("*"),
    currentBalance(),
  ]);
  if (goal.error) return fail(goal.error.message);
  if (allGoals.error) return fail(allGoals.error.message);
  if (bal.error) return fail(bal.error);

  if (delta > 0) {
    const reserved = (allGoals.data ?? [])
      .filter((g) => !g.completed_at)
      .reduce((acc, g) => acc + Number(g.saved_amount), 0);
    const available = bal.value! - reserved;
    if (delta > available + 0.005) {
      return fail(
        available > 0
          ? `Você só tem ${formatBRL(available)} disponível fora das metas.`
          : "Sem saldo disponível: todo o dinheiro já está reservado em metas."
      );
    }
  }

  const next = Math.max(0, Number(goal.data.saved_amount) + delta);
  const { error } = await supabase
    .from("goals")
    .update({ saved_amount: next })
    .eq("id", id);
  if (error) return fail(error.message);
  revalidateAll();
  return { ok: true };
}
