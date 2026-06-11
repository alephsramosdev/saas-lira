import { Transaction } from "./types";
import { parseDateOnly, toDateOnly } from "./format";

/** Valor com sinal: entrada soma, saída subtrai, ajuste já vem com sinal. */
export function signedAmount(t: Transaction): number {
  if (t.type === "income") return t.amount;
  if (t.type === "expense") return -t.amount;
  return t.amount;
}

export function balance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => acc + signedAmount(t), 0);
}

export function sumIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
}

export function sumExpense(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
}

export function inMonth(transactions: Transaction[], ref: Date): Transaction[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  return transactions.filter((t) => {
    const d = parseDateOnly(t.occurred_on);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

export function lastNDays(transactions: Transaction[], days: number): Transaction[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return transactions.filter((t) => parseDateOnly(t.occurred_on) >= start);
}

/** Média de entradas por dia corrido nos últimos N dias. */
export function avgIncomePerDay(transactions: Transaction[], days = 30): number {
  return sumIncome(lastNDays(transactions, days)) / days;
}

/** Média de entradas considerando apenas dias que tiveram entrada. */
export function avgIncomePerActiveDay(transactions: Transaction[], days = 30): number {
  const recent = lastNDays(transactions, days).filter((t) => t.type === "income");
  const activeDays = new Set(recent.map((t) => t.occurred_on)).size;
  if (activeDays === 0) return 0;
  return sumIncome(recent) / activeDays;
}

export interface WeekdayStat {
  weekday: number;
  total: number;
  avg: number;
  occurrences: number;
}

/** Total e média de entradas por dia da semana (para "dia que mais entra dinheiro"). */
export function incomeByWeekday(transactions: Transaction[]): WeekdayStat[] {
  const totals = Array(7).fill(0) as number[];
  const daySets: Set<string>[] = Array.from({ length: 7 }, () => new Set());
  for (const t of transactions) {
    if (t.type !== "income") continue;
    const wd = parseDateOnly(t.occurred_on).getDay();
    totals[wd] += t.amount;
    daySets[wd].add(t.occurred_on);
  }
  return totals.map((total, weekday) => ({
    weekday,
    total,
    occurrences: daySets[weekday].size,
    avg: daySets[weekday].size > 0 ? total / daySets[weekday].size : 0,
  }));
}

export function bestWeekday(transactions: Transaction[]): WeekdayStat | null {
  const stats = incomeByWeekday(transactions).filter((s) => s.total > 0);
  if (stats.length === 0) return null;
  return stats.reduce((best, s) => (s.avg > best.avg ? s : best));
}

export interface DayPoint {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
  /** entradas − saídas + ajustes do dia */
  net: number;
}

/** Série diária dos últimos N dias (zera dias sem lançamento). */
export function dailySeries(transactions: Transaction[], days = 30): DayPoint[] {
  const map = new Map<string, DayPoint>();
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = toDateOnly(cursor);
    map.set(key, { date: key, income: 0, expense: 0, net: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const t of transactions) {
    const point = map.get(t.occurred_on);
    if (!point) continue;
    if (t.type === "income") point.income += t.amount;
    if (t.type === "expense") point.expense += t.amount;
    point.net += signedAmount(t);
  }
  return [...map.values()];
}

export interface BalancePoint {
  date: string;
  balance: number;
}

/** Evolução do saldo dia a dia, terminando no saldo atual. */
export function balanceSeries(
  transactions: Transaction[],
  days = 30
): BalancePoint[] {
  const series = dailySeries(transactions, days);
  let run = balance(transactions);
  const out: BalancePoint[] = [];
  for (let i = series.length - 1; i >= 0; i--) {
    out[i] = { date: series[i].date, balance: run };
    run -= series[i].net;
  }
  return out;
}

/** Dia (data específica) com maior entrada registrada. */
export function bestSingleDay(
  transactions: Transaction[]
): { date: string; total: number } | null {
  const byDay = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "income") continue;
    byDay.set(t.occurred_on, (byDay.get(t.occurred_on) ?? 0) + t.amount);
  }
  let best: { date: string; total: number } | null = null;
  for (const [date, total] of byDay) {
    if (!best || total > best.total) best = { date, total };
  }
  return best;
}
