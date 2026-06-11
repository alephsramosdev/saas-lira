"use client";

import styled from "@emotion/styled";
import { Card, Page, PageHeader, PageTitle, PageSubtitle } from "./ui";

const Steps = styled.ol`
  margin: 14px 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;

  a {
    color: var(--primary);
    font-weight: 600;
    text-decoration: underline;
  }

  code {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 1px 6px;
    font-size: 13px;
  }
`;

const Sql = styled.pre`
  margin-top: 16px;
  background: #1b1a17;
  color: #e9e7e2;
  border-radius: var(--r-md);
  padding: 16px;
  font-size: 12.5px;
  line-height: 1.6;
  overflow-x: auto;
`;

const SQL = `create table if not exists public.transactions (
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

alter table public.goals
  add column if not exists icon text not null default 'target';

alter table public.goals
  add column if not exists completed_at timestamptz;

alter table public.goals
  add column if not exists photo_url text;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists source_id uuid references public.sources(id) on delete set null;

insert into public.sources (name) values ('Venda'), ('Salário'), ('Indicação')
  on conflict (name) do nothing;

alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.sources enable row level security;`;

export default function SetupNotice() {
  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Quase lá — falta atualizar o banco</PageTitle>
          <PageSubtitle>
            O Supabase está conectado, mas o schema ainda não foi aplicado (ou está
            desatualizado). O SQL abaixo é seguro de rodar mais de uma vez.
          </PageSubtitle>
        </div>
      </PageHeader>
      <Card>
        <Steps>
          <li>
            Abra o{" "}
            <a
              href="https://supabase.com/dashboard/project/lttpsqjvxhgrcpgyoedv/sql/new"
              target="_blank"
              rel="noreferrer"
            >
              SQL Editor do seu projeto Supabase
            </a>
            .
          </li>
          <li>
            Cole o SQL abaixo (também salvo em <code>supabase/schema.sql</code>) e
            clique em <strong>Run</strong>.
          </li>
          <li>Volte aqui e recarregue a página.</li>
        </Steps>
        <Sql>{SQL}</Sql>
      </Card>
    </Page>
  );
}
