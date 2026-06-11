import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number): string {
  return brl.format(value);
}

/** Formata reais sem o símbolo (para inputs mascarados): 1234.5 → "1.234,50" */
export function formatMoneyPlain(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Máscara estilo banco: dígitos viram centavos ("1234" → 12.34). null se vazio. */
export function moneyFromDigits(raw: string): number | null {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

/** Converte "YYYY-MM-DD" em Date local (evita o deslocamento UTC do new Date(string)). */
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function isValid(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

export function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toDateOnly(new Date());
}

export function formatDateShort(iso: string): string {
  const d = parseDateOnly(iso);
  if (!isValid(d)) return String(iso);
  return format(d, "d MMM", { locale: ptBR });
}

/** "Hoje", "Ontem" ou "segunda-feira, 9 de junho" */
export function formatDayLabel(iso: string): string {
  const d = parseDateOnly(iso);
  if (!isValid(d)) return String(iso);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatDateFull(iso: string): string {
  const d = parseDateOnly(iso);
  if (!isValid(d)) return String(iso);
  return format(d, "dd MMM yyyy", { locale: ptBR });
}

export function todayHeading(): string {
  return format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
}

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAY_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/** Cor estável para uma fonte de entrada (chip), derivada do nome. */
const SOURCE_PALETTE = [
  "#4f46e5",
  "#2563eb",
  "#7c3aed",
  "#e11d48",
  "#db2777",
  "#0891b2",
  "#9333ea",
  "#f59e0b",
];

export function sourceColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SOURCE_PALETTE[h % SOURCE_PALETTE.length];
}
