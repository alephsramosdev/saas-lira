export type TransactionType = "income" | "expense" | "adjustment";

export interface Source {
  id: string;
  name: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  source_id: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null; // YYYY-MM-DD
  color: string;
  /** nome do ícone Lucide escolhido para a meta (ex.: "plane", "house") */
  icon: string;
  /** foto de desejo da meta (URL pública no Supabase Storage); tem prioridade sobre o ícone */
  photo_url: string | null;
  /** quando a meta foi finalizada (null = ativa); finalizada fica só para visualização */
  completed_at: string | null;
  created_at: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Resumo global exibido no Shell (sidebar/topbar fixos). */
export interface BalanceSummary {
  balance: number;
  /** total reservado em metas */
  reserved: number;
  /** balance − reserved */
  available: number;
}
