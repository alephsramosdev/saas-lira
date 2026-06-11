import { getSupabase, isMissingTableError } from "./supabase/server";
import { BalanceSummary, Goal, Source, Transaction } from "./types";

export interface AppData {
  transactions: Transaction[];
  goals: Goal[];
  sources: Source[];
  summary: BalanceSummary;
  setupNeeded: boolean;
  /** colunas novas de metas (icon/photo_url/completed_at) ainda não migradas */
  goalsMigrationNeeded: boolean;
}

const EMPTY: AppData = {
  transactions: [],
  goals: [],
  sources: [],
  summary: { balance: 0, reserved: 0, available: 0 },
  setupNeeded: true,
  goalsMigrationNeeded: true,
};

/** Busca tudo (app pessoal, volume pequeno). setupNeeded=true se o schema SQL ainda não foi aplicado/atualizado. */
export async function getAppData(): Promise<AppData> {
  const supabase = getSupabase();

  const [tx, gl, src, probe] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("goals").select("*").order("created_at", { ascending: true }),
    supabase.from("sources").select("*").order("name", { ascending: true }),
    // sonda barata: erro = migração das colunas novas de metas pendente
    supabase.from("goals").select("icon, photo_url, completed_at").limit(0),
  ]);

  if (
    isMissingTableError(tx.error) ||
    isMissingTableError(gl.error) ||
    isMissingTableError(src.error)
  ) {
    return EMPTY;
  }
  if (tx.error) throw new Error(tx.error.message);
  if (gl.error) throw new Error(gl.error.message);
  if (src.error) throw new Error(src.error.message);

  const transactions = (tx.data ?? []).map((t) => ({
    ...t,
    amount: Number(t.amount),
    source_id: t.source_id ?? null,
  })) as Transaction[];

  const goals = (gl.data ?? []).map((g) => ({
    ...g,
    target_amount: Number(g.target_amount),
    saved_amount: Number(g.saved_amount),
    icon: g.icon ?? "target",
    photo_url: g.photo_url ?? null,
    completed_at: g.completed_at ?? null,
  })) as Goal[];

  const sources = (src.data ?? []) as Source[];

  const balance = transactions.reduce((acc, t) => {
    if (t.type === "income") return acc + t.amount;
    if (t.type === "expense") return acc - t.amount;
    return acc + t.amount;
  }, 0);
  // metas finalizadas não reservam mais dinheiro — o valor volta ao disponível
  const reserved = goals
    .filter((g) => !g.completed_at)
    .reduce((acc, g) => acc + g.saved_amount, 0);

  return {
    transactions,
    goals,
    sources,
    summary: { balance, reserved, available: balance - reserved },
    setupNeeded: false,
    goalsMigrationNeeded: !!probe.error,
  };
}
