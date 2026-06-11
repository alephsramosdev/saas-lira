-- Schema do Lira — Controle Financeiro (idempotente: pode rodar mais de uma vez)
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/lttpsqjvxhgrcpgyoedv/sql/new

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense', 'adjustment')),
  description text not null default '',
  amount numeric(12, 2) not null,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_occurred_on_idx
  on public.transactions (occurred_on desc);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  deadline date,
  color text not null default '#4f46e5',
  created_at timestamptz not null default now()
);

-- Ícone escolhido para cada meta (nomes do Lucide: target, plane, house…)
alter table public.goals
  add column if not exists icon text not null default 'target';

-- Meta finalizada (fica visível somente para leitura; null = ativa)
alter table public.goals
  add column if not exists completed_at timestamptz;

-- Foto de desejo da meta (URL pública no bucket goal-photos do Storage)
alter table public.goals
  add column if not exists photo_url text;

-- Fontes de entrada (venda, salário, indicação…)
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists source_id uuid references public.sources(id) on delete set null;

insert into public.sources (name) values ('Venda'), ('Salário'), ('Indicação')
  on conflict (name) do nothing;

-- RLS ligado sem políticas: o acesso anônimo fica bloqueado e somente o
-- servidor Next.js (chave secreta, que ignora RLS) consegue ler/escrever.
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.sources enable row level security;
