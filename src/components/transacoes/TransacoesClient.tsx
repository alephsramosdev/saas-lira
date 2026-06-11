"use client";

import { useMemo, useState, useTransition } from "react";
import styled from "@emotion/styled";
import { Transaction } from "@/lib/types";
import { deleteTransaction } from "@/app/actions";
import {
  formatBRL,
  formatDayLabel,
  parseDateOnly,
  sourceColor,
} from "@/lib/format";
import { balance, signedAmount, sumExpense, sumIncome } from "@/lib/metrics";
import { useShell } from "../shell-context";
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  Row,
  SegmentButton,
  Segmented,
  SplitMoney,
} from "../ui";
import {
  IconArrowDown,
  IconArrowUp,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconPlus,
  IconScale,
  IconTrash,
} from "../icons";
import { TransactionModal } from "../TransactionModal";

type Period = "day" | "week" | "month" | "year" | "all";
type TypeFilter = "all" | "income" | "expense";

const HeaderActions = styled(Row)`
  /* no mobile as ações vivem na tab bar (FAB + Saída) — menos poluição */
  @media (max-width: 720px) {
    display: none;
  }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  animation: fade-up 0.35s ease both;
  animation-delay: 50ms;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
    gap: 9px;
  }
`;

const PeriodScroller = styled.div`
  @media (max-width: 720px) {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    margin: 0 -16px;
    padding: 0 16px;
    width: calc(100% + 32px);

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const PeriodNav = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  /* no mobile vira uma linha própria: ‹  período  › */
  @media (max-width: 720px) {
    justify-content: space-between;
    background: var(--surface-2);
    border-radius: 99px;
    padding: 3px 6px;
  }
`;

const PeriodLabel = styled.span`
  font-size: 13px;
  font-weight: 650;
  min-width: 140px;
  text-align: center;
  text-transform: capitalize;
  font-variant-numeric: tabular-nums;
`;

const TypeSearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 720px) {
    input {
      flex: 1;
      width: auto !important;
    }
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;

  /* no mobile vira um trilho horizontal compacto, sem empilhar */
  @media (max-width: 900px) {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    margin-left: -16px;
    margin-right: -16px;
    padding: 0 16px 4px;
    scroll-snap-type: x proximity;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const SummaryCard = styled.div<{ delay?: number }>`
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 13px 15px;
  animation: fade-up 0.35s ease both;
  animation-delay: ${(p) => 80 + (p.delay ?? 0) * 50}ms;

  small {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 5px;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    flex: 0 0 auto;
    min-width: 138px;
    scroll-snap-align: start;
    padding: 11px 14px;
  }
`;

const DayGroup = styled.div`
  margin-bottom: 16px;
  animation: fade-up 0.3s ease both;
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 2px 6px;
  border-bottom: 1px solid var(--border);

  h3 {
    font-size: 12.5px;
    font-weight: 650;
    color: var(--text-muted);

    &::first-letter {
      text-transform: uppercase;
    }
  }

  span {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--text-soft);
    font-weight: 600;
  }
`;

const TxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 2px;
  border-radius: var(--r-md);
  transition: background 0.12s ease;

  & + & {
    border-top: 1px solid var(--border);
  }

  @media (hover: hover) {
    &:hover {
      background: var(--surface-2);
      padding-left: 8px;
      padding-right: 8px;
      margin: 0 -6px;
    }

    &:hover .tx-actions {
      opacity: 1;
    }
  }

  @media (max-width: 720px) {
    gap: 10px;
    padding: 10px 0;
  }
`;

const TxIcon = styled.div<{ tone: "in" | "out" | "adj" }>`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  color: ${(p) => (p.tone === "out" ? "var(--red)" : "var(--text)")};
`;

const TxDesc = styled.div`
  flex: 1;
  min-width: 0;

  p {
    font-size: 13.5px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const TxTags = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 1px;
  font-size: 11.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;

  /* no mobile o tipo já está claro pelo ícone — mostra só a fonte/data */
  @media (max-width: 720px) {
    .tx-type {
      display: none;
    }
  }
`;

const SourceTag = styled.span<{ dot: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);

  &::before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 99px;
    background: ${(p) => p.dot};
  }
`;

const TxActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;

  @media (hover: none) {
    opacity: 1;
  }
`;

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

function periodRange(period: Period, offset: number): { start: Date; end: Date } | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  switch (period) {
    case "day": {
      const start = new Date(now);
      start.setDate(start.getDate() + offset);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case "week": {
      const start = startOfWeek(now);
      start.setDate(start.getDate() + offset * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
      return { start, end };
    }
    case "year": {
      const start = new Date(now.getFullYear() + offset, 0, 1);
      const end = new Date(now.getFullYear() + offset + 1, 0, 1);
      return { start, end };
    }
    default:
      return null;
  }
}

function periodLabel(period: Period, offset: number): string {
  const range = periodRange(period, offset);
  if (!range) return "Todo o histórico";
  const { start, end } = range;
  switch (period) {
    case "day":
      return start.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    case "week": {
      const last = new Date(end);
      last.setDate(last.getDate() - 1);
      return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${last.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
    }
    case "month":
      return start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    case "year":
      return String(start.getFullYear());
  }
  return "";
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
  { key: "year", label: "Ano" },
  { key: "all", label: "Tudo" },
];

export default function TransacoesClient({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { sources, hidden, openTransaction, openAdjust } = useShell();
  const [period, setPeriod] = useState<Period>("month");
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [, startTransition] = useTransition();

  const sourceById = useMemo(
    () => new Map(sources.map((s) => [s.id, s.name])),
    [sources]
  );

  const totalBalance = useMemo(() => balance(transactions), [transactions]);

  const filtered = useMemo(() => {
    const range = periodRange(period, offset);
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (range) {
        const d = parseDateOnly(t.occurred_on);
        if (d < range.start || d >= range.end) return false;
      }
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (q) {
        const sourceName = t.source_id ? (sourceById.get(t.source_id) ?? "") : "";
        if (
          !t.description.toLowerCase().includes(q) &&
          !sourceName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [transactions, period, offset, typeFilter, search, sourceById]);

  const stats = useMemo(() => {
    const income = sumIncome(filtered);
    const expense = sumExpense(filtered);
    const days = new Set(
      filtered.filter((t) => t.type === "income").map((t) => t.occurred_on)
    ).size;
    return {
      income,
      expense,
      net: filtered.reduce((acc, t) => acc + signedAmount(t), 0),
      avgPerDay: days > 0 ? income / days : 0,
    };
  }, [filtered]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.occurred_on) ?? [];
      list.push(t);
      map.set(t.occurred_on, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  function changePeriod(p: Period) {
    setPeriod(p);
    setOffset(0);
  }

  function remove(t: Transaction) {
    const label = t.description || formatBRL(Math.abs(t.amount));
    if (!confirm(`Excluir o lançamento "${label}"?`)) return;
    startTransition(async () => {
      await deleteTransaction(t.id);
    });
  }

  const isCurrent = period !== "all" && offset === 0;

  return (
    <Page>
      <HeaderActions style={{ justifyContent: "flex-end", marginBottom: 12 }}>
        <Button size="sm" onClick={() => openTransaction("income")}>
          <IconPlus size={14} /> Entrada
        </Button>
        <Button size="sm" onClick={() => openTransaction("expense")}>
          <IconArrowDown size={14} /> Saída
        </Button>
        <Button size="sm" variant="outline" onClick={openAdjust}>
          <IconScale size={14} /> Ajustar
        </Button>
      </HeaderActions>

      <FilterBar>
        <PeriodScroller>
          <Segmented>
            {PERIODS.map((p) => (
              <SegmentButton
                key={p.key}
                active={period === p.key}
                onClick={() => changePeriod(p.key)}
              >
                {p.label}
              </SegmentButton>
            ))}
          </Segmented>
        </PeriodScroller>

        {period !== "all" && (
          <PeriodNav>
            <IconButton onClick={() => setOffset((o) => o - 1)} aria-label="Período anterior">
              <IconChevronLeft size={17} />
            </IconButton>
            <PeriodLabel>{periodLabel(period, offset)}</PeriodLabel>
            <IconButton
              onClick={() => setOffset((o) => Math.min(0, o + 1))}
              aria-label="Próximo período"
              disabled={isCurrent}
            >
              <IconChevronRight size={17} />
            </IconButton>
          </PeriodNav>
        )}

        <TypeSearchRow>
          <Segmented>
            <SegmentButton active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
              Tudo
            </SegmentButton>
            <SegmentButton
              active={typeFilter === "income"}
              onClick={() => setTypeFilter("income")}
            >
              Entradas
            </SegmentButton>
            <SegmentButton
              active={typeFilter === "expense"}
              onClick={() => setTypeFilter("expense")}
            >
              Saídas
            </SegmentButton>
          </Segmented>
          <Input
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 146, padding: "7px 13px", fontSize: 13.5 }}
          />
        </TypeSearchRow>
      </FilterBar>

      <SummaryGrid>
        <SummaryCard delay={0}>
          <small>Entradas no período</small>
          <SplitMoney value={stats.income} size="lg" hidden={hidden} />
        </SummaryCard>
        <SummaryCard delay={1}>
          <small>Saídas no período</small>
          <SplitMoney
            value={stats.expense}
            size="lg"
            sign={stats.expense > 0 ? "−" : undefined}
            color={stats.expense > 0 ? "var(--red)" : undefined}
            hidden={hidden}
          />
        </SummaryCard>
        <SummaryCard delay={2}>
          <small>Resultado</small>
          <SplitMoney
            value={stats.net}
            size="lg"
            color={stats.net < 0 ? "var(--red)" : undefined}
            hidden={hidden}
          />
        </SummaryCard>
        <SummaryCard delay={3}>
          <small>Média por dia com entrada</small>
          <SplitMoney value={stats.avgPerDay} size="lg" hidden={hidden} />
        </SummaryCard>
      </SummaryGrid>

      {groups.length === 0 ? (
        <EmptyState>
          <strong>Nenhum lançamento neste período</strong>
          Ajuste os filtros ou adicione uma nova entrada.
        </EmptyState>
      ) : (
        groups.map(([date, items]) => {
          const dayTotal = items.reduce((acc, t) => acc + signedAmount(t), 0);
          return (
            <DayGroup key={date}>
              <DayHeader>
                <h3>{formatDayLabel(date)}</h3>
                <span>
                  {hidden
                    ? "••••"
                    : `${dayTotal >= 0 ? "+" : "−"}${formatBRL(Math.abs(dayTotal))}`}
                </span>
              </DayHeader>
              <div>
                {items.map((t) => {
                  const tone =
                    t.type === "income" ? "in" : t.type === "expense" ? "out" : "adj";
                  const negative =
                    t.type === "expense" || (t.type === "adjustment" && t.amount < 0);
                  const sourceName = t.source_id
                    ? sourceById.get(t.source_id)
                    : undefined;
                  return (
                    <TxItem key={t.id}>
                      <TxIcon tone={tone}>
                        {tone === "in" ? (
                          <IconArrowUp size={16} />
                        ) : tone === "out" ? (
                          <IconArrowDown size={16} />
                        ) : (
                          <IconScale size={16} />
                        )}
                      </TxIcon>
                      <TxDesc>
                        <p>
                          {t.description ||
                            (t.type === "income"
                              ? "Entrada"
                              : t.type === "expense"
                                ? "Saída"
                                : "Ajuste de saldo")}
                        </p>
                        <TxTags>
                          <span className="tx-type">
                            {t.type === "income"
                              ? "Entrada"
                              : t.type === "expense"
                                ? "Saída"
                                : "Ajuste"}
                            {sourceName ? " ·" : ""}
                          </span>
                          {sourceName && (
                            <SourceTag dot={sourceColor(sourceName)}>
                              {sourceName}
                            </SourceTag>
                          )}
                        </TxTags>
                      </TxDesc>
                      <SplitMoney
                        value={Math.abs(t.amount)}
                        size="md"
                        sign={negative ? "−" : undefined}
                        color={negative ? "var(--red)" : undefined}
                        hidden={hidden}
                      />
                      <TxActions className="tx-actions">
                        <IconButton onClick={() => setEditing(t)} aria-label="Editar">
                          <IconEdit size={15} />
                        </IconButton>
                        <IconButton
                          data-tone="danger"
                          onClick={() => remove(t)}
                          aria-label="Excluir"
                        >
                          <IconTrash size={15} />
                        </IconButton>
                      </TxActions>
                    </TxItem>
                  );
                })}
              </div>
            </DayGroup>
          );
        })
      )}

      {editing && (
        <TransactionModal editing={editing} onClose={() => setEditing(null)} />
      )}
    </Page>
  );
}
