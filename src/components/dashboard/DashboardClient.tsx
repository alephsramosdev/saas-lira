"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { Goal, Transaction } from "@/lib/types";
import {
  avgIncomePerDay,
  avgIncomePerActiveDay,
  balance,
  bestWeekday,
  dailySeries,
  incomeByWeekday,
  inMonth,
  sumExpense,
  sumIncome,
} from "@/lib/metrics";
import { formatBRL, formatDateShort, todayHeading, WEEKDAY_FULL } from "@/lib/format";
import { useShell } from "../shell-context";
import {
  Card,
  CardHeader,
  CardTitle,
  DeltaBadge,
  EmptyState,
  Page,
  ProgressBar,
  Row,
  SplitMoney,
} from "../ui";
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconList,
  IconScale,
  IconSparkle,
  IconTarget,
  IconTrendUp,
} from "../icons";
import { IncomeAreaChart, WeekdayBarChart } from "./charts";

/* ---------- contagem animada ---------- */

function useCountUp(target: number, duration = 900): number {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

/* ---------- painel de saldo lilás (referência Nina Skrbic) ---------- */

const HeroPanel = styled.section`
  position: relative;
  background: linear-gradient(175deg, var(--lilac) 0%, var(--lilac-deep) 100%);
  border-radius: 28px;
  padding: 20px 20px 30px;
  text-align: center;
  margin-bottom: 8px;
  animation: fade-up 0.4s ease both;
`;

const HeroTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  text-align: left;
`;

const HeroGreeting = styled.div`
  font-size: 15px;
  line-height: 1.3;

  strong {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  span {
    display: block;
    color: rgba(20, 20, 21, 0.45);
    font-size: 12.5px;
    font-weight: 500;

    &::first-letter {
      text-transform: uppercase;
    }
  }
`;

const HeroRound = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 99px;
  border: none;
  background: rgba(255, 255, 255, 0.65);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const CurrencyChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 99px;
  padding: 4px 11px 4px 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(20, 20, 21, 0.55);
  margin-bottom: 10px;

  i {
    width: 18px;
    height: 18px;
    border-radius: 99px;
    background: var(--text);
    color: #fff;
    font-style: normal;
    font-size: 10px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

const HeroAmount = styled.div`
  display: flex;
  justify-content: center;

  @media (max-width: 560px) {
    transform: scale(0.88);
  }
`;

const HeroSub = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(20, 20, 21, 0.5);
  transition: color 0.15s ease;

  &:hover {
    color: var(--text);
  }
`;

const DeltaPill = styled.span`
  position: absolute;
  bottom: -13px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--green);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 99px;
  padding: 5px 13px;
  border: 3px solid var(--bg);
  white-space: nowrap;
  animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
`;

/* faixa escura de ações (Send / Request da referência) */
const ActionStrip = styled.div`
  background: var(--text);
  border-radius: 24px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 20px 0 24px;
  animation: fade-up 0.4s ease 80ms both;
`;

const StripPill = styled.button`
  flex: 1;
  max-width: 190px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #2e2e31;
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;

  i {
    width: 22px;
    height: 22px;
    border-radius: 99px;
    border: 1.5px solid rgba(255, 255, 255, 0.4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-style: normal;
  }

  &:hover {
    background: #3a3a3e;
  }

  &:active {
    transform: scale(0.96);
  }
`;

const StripSquare = styled.button`
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 16px;
  border: none;
  background: var(--surface-2);
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease;

  &:hover {
    background: var(--surface-3);
  }

  &:active {
    transform: scale(0.9);
  }
`;

/* ---------- mini cards (Invest/Shared/Loans da referência) ---------- */

const MiniCards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 900px) {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    margin-left: -16px;
    margin-right: -16px;
    padding: 0 16px 4px;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MiniCard = styled.div<{ delay?: number; clickable?: boolean }>`
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
  animation: fade-up 0.4s ease both;
  animation-delay: ${(p) => 60 + (p.delay ?? 0) * 60}ms;
  transition: transform 0.18s ease, background 0.18s ease;
  cursor: ${(p) => (p.clickable ? "pointer" : "default")};

  ${(p) =>
    p.clickable &&
    `&:hover { background: var(--surface-3); transform: translateY(-2px); }
     &:active { transform: scale(0.97); }`}

  @media (max-width: 900px) {
    flex: 0 0 148px;
  }
`;

const MiniHead = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
`;

const MiniIcon = styled.span<{ tone?: "red" | "ink" | "peri" }>`
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--surface);
  box-shadow: var(--shadow-chip);
  color: ${(p) =>
    p.tone === "red" ? "var(--red)" : p.tone === "peri" ? "var(--peri-ink)" : "var(--text)"};
`;

const MiniFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
`;

/* ---------- grids ---------- */

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.75fr 1fr;
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 1060px) {
    grid-template-columns: 1fr;
  }
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 1060px) {
    grid-template-columns: 1fr;
  }
`;

const AnimatedCard = styled(Card)<{ delay?: number }>`
  animation: fade-up 0.4s ease both;
  animation-delay: ${(p) => (p.delay ?? 0) * 60}ms;
`;

const LegendChip = styled.span<{ color: string; dashed?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);

  &::before {
    content: "";
    width: 12px;
    height: 0;
    border-top: 2.5px ${(p) => (p.dashed ? "dashed" : "solid")} ${(p) => p.color};
    border-radius: 2px;
  }
`;

const BestDayCallout = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--surface);
  border-radius: var(--r-md);
  padding: 9px 12px;
  margin-bottom: 12px;
  color: var(--text);
  font-size: 12px;
  line-height: 1.4;
  box-shadow: var(--shadow-chip);

  svg {
    color: var(--red);
    flex-shrink: 0;
  }

  strong {
    font-weight: 700;
  }
`;

const GoalRow = styled.div<{ delay?: number }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0;
  animation: fade-up 0.35s ease both;
  animation-delay: ${(p) => (p.delay ?? 0) * 50}ms;

  & + & {
    border-top: 1px solid var(--border-strong);
  }
`;

const GoalMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;

  strong {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    color: var(--text-muted);
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
`;

const TxRow = styled.div<{ delay?: number }>`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 0;
  animation: fade-up 0.35s ease both;
  animation-delay: ${(p) => (p.delay ?? 0) * 50}ms;

  & + & {
    border-top: 1px solid var(--border-strong);
  }
`;

const TxIcon = styled.span<{ tone: "in" | "out" | "adj" }>`
  width: 32px;
  height: 32px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--surface);
  box-shadow: var(--shadow-chip);
  color: ${(p) => (p.tone === "out" ? "var(--red)" : "var(--text)")};
`;

const TxInfo = styled.div`
  flex: 1;
  min-width: 0;

  p {
    font-size: 13px;
    font-weight: 550;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 11px;
  }
`;

const SeeAll = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 0.15s ease;

  &:hover {
    color: var(--text);
  }
`;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardClient({
  transactions,
  goals,
}: {
  transactions: Transaction[];
  goals: Goal[];
}) {
  const { summary, hidden, toggleHidden, openTransaction, openAdjust } = useShell();

  const m = useMemo(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = inMonth(transactions, now);
    const lastMonth = inMonth(transactions, prevMonth);
    const incomeThis = sumIncome(thisMonth);
    const incomeLast = sumIncome(lastMonth);
    return {
      balance: balance(transactions),
      incomeThis,
      expenseThis: sumExpense(thisMonth),
      incomeDelta:
        incomeLast > 0 ? ((incomeThis - incomeLast) / incomeLast) * 100 : null,
      avg30: avgIncomePerDay(transactions, 30),
      avgActive: avgIncomePerActiveDay(transactions, 30),
      best: bestWeekday(transactions),
      series: dailySeries(transactions, 30),
      weekdays: incomeByWeekday(transactions),
    };
  }, [transactions]);

  const animatedBalance = useCountUp(m.balance);
  const Eye = hidden ? IconEyeOff : IconEye;

  const recent = transactions.slice(0, 6);
  const topGoals = goals.filter((g) => !g.completed_at).slice(0, 4);

  return (
    <Page>
      <HeroPanel>
        <HeroTop>
          <HeroGreeting>
            <strong>{greeting()}!</strong>
            <span>{todayHeading()}</span>
          </HeroGreeting>
          <HeroRound onClick={toggleHidden} aria-label="Mostrar/ocultar valores">
            <Eye size={17} />
          </HeroRound>
        </HeroTop>
        <CurrencyChip>
          <i>$</i> BRL
        </CurrencyChip>
        <HeroAmount>
          <SplitMoney
            value={hidden ? 0 : animatedBalance}
            size="hero"
            dotGroups
            hidden={hidden}
          />
        </HeroAmount>
        <div>
          <HeroSub href="/metas">
            {hidden ? "Disponível ••••" : `Disponível ${formatBRL(summary.available)}`}
            <IconChevronRight size={12} strokeWidth={2.6} />
          </HeroSub>
        </div>
        {m.incomeDelta !== null && (
          <DeltaPill>
            <IconTrendUp size={13} strokeWidth={2.4} />
            {m.incomeDelta >= 0 ? "+" : "−"}
            {Math.abs(m.incomeDelta).toFixed(0)}% no mês
          </DeltaPill>
        )}
      </HeroPanel>

      <ActionStrip>
        <StripPill onClick={() => openTransaction("income")}>
          Entrada
          <i>
            <IconArrowUp size={12} strokeWidth={2.4} />
          </i>
        </StripPill>
        <StripSquare onClick={openAdjust} aria-label="Ajustar saldo">
          <IconScale size={19} strokeWidth={1.9} />
        </StripSquare>
        <StripPill onClick={() => openTransaction("expense")}>
          <i>
            <IconArrowDown size={12} strokeWidth={2.4} />
          </i>
          Saída
        </StripPill>
      </ActionStrip>

      <MiniCards>
        <MiniCard delay={0}>
          <MiniHead>
            <MiniIcon>
              <IconArrowUp size={13} />
            </MiniIcon>
            Entradas · mês
          </MiniHead>
          <MiniFoot>
            <SplitMoney value={m.incomeThis} size="lg" hidden={hidden} />
            {m.incomeDelta !== null && <DeltaBadge value={m.incomeDelta} />}
          </MiniFoot>
        </MiniCard>

        <MiniCard delay={1}>
          <MiniHead>
            <MiniIcon tone="red">
              <IconArrowDown size={13} />
            </MiniIcon>
            Saídas · mês
          </MiniHead>
          <MiniFoot>
            <SplitMoney
              value={m.expenseThis}
              size="lg"
              sign={m.expenseThis > 0 ? "−" : undefined}
              hidden={hidden}
            />
          </MiniFoot>
        </MiniCard>

        <MiniCard delay={2}>
          <MiniHead>
            <MiniIcon>
              <IconTrendUp size={13} />
            </MiniIcon>
            Média / dia
          </MiniHead>
          <MiniFoot>
            <SplitMoney value={m.avg30} size="lg" hidden={hidden} />
          </MiniFoot>
        </MiniCard>

        <Link href="/metas" style={{ display: "contents" }}>
          <MiniCard delay={3} clickable>
            <MiniHead>
              <MiniIcon tone="peri">
                <IconTarget size={13} />
              </MiniIcon>
              Em metas
            </MiniHead>
            <MiniFoot>
              <SplitMoney value={summary.reserved} size="lg" hidden={hidden} />
              <IconChevronRight size={15} />
            </MiniFoot>
          </MiniCard>
        </Link>
      </MiniCards>

      <ChartsGrid>
        <AnimatedCard delay={3}>
          <CardHeader>
            <CardTitle>
              <IconTrendUp size={15} />
              Movimento diário
            </CardTitle>
            <Row style={{ gap: 12 }}>
              <LegendChip color="var(--text)">Entradas</LegendChip>
              <LegendChip color="var(--red)" dashed>
                Saídas
              </LegendChip>
            </Row>
          </CardHeader>
          {transactions.length === 0 ? (
            <EmptyState>
              <strong>Nada por aqui ainda</strong>
              Adicione sua primeira entrada para ver o gráfico ganhar vida.
            </EmptyState>
          ) : (
            <IncomeAreaChart data={m.series} />
          )}
        </AnimatedCard>

        <AnimatedCard delay={4}>
          <CardHeader>
            <CardTitle>
              <IconCalendar size={14} />
              Dias da semana
            </CardTitle>
          </CardHeader>
          {m.best && (
            <BestDayCallout>
              <IconSparkle size={16} />
              <span>
                <strong>{WEEKDAY_FULL[m.best.weekday]}</strong> é o dia que mais
                entra dinheiro — {formatBRL(m.best.avg)} em média
              </span>
            </BestDayCallout>
          )}
          {transactions.length === 0 ? (
            <EmptyState>
              <strong>Sem dados</strong>
              Registre entradas para descobrir seu melhor dia.
            </EmptyState>
          ) : (
            <WeekdayBarChart data={m.weekdays} bestWeekday={m.best?.weekday ?? -1} />
          )}
        </AnimatedCard>
      </ChartsGrid>

      <BottomGrid>
        <AnimatedCard delay={5}>
          <CardHeader>
            <CardTitle>
              <IconTarget size={15} />
              Metas em andamento
            </CardTitle>
            <SeeAll href="/metas">
              Ver todas <IconChevronRight size={12} />
            </SeeAll>
          </CardHeader>
          {topGoals.length === 0 ? (
            <EmptyState>
              <strong>Nenhuma meta criada</strong>
              Defina objetivos e acompanhe o progresso por aqui.
            </EmptyState>
          ) : (
            topGoals.map((g, i) => {
              const pct =
                g.target_amount > 0 ? (g.saved_amount / g.target_amount) * 100 : 0;
              return (
                <GoalRow key={g.id} delay={i}>
                  <GoalMeta>
                    <strong>{g.name}</strong>
                    <span>
                      {hidden ? "••••" : `${formatBRL(g.saved_amount)} / ${formatBRL(g.target_amount)}`}{" "}
                      · <b style={{ color: "var(--text)" }}>{Math.min(100, Math.round(pct))}%</b>
                    </span>
                  </GoalMeta>
                  <ProgressBar value={pct} color={g.color} />
                </GoalRow>
              );
            })
          )}
        </AnimatedCard>

        <AnimatedCard delay={6}>
          <CardHeader>
            <CardTitle>
              <IconList size={15} />
              Últimos lançamentos
            </CardTitle>
            <SeeAll href="/transacoes">
              Ver todos <IconChevronRight size={12} />
            </SeeAll>
          </CardHeader>
          {recent.length === 0 ? (
            <EmptyState>
              <strong>Nenhum lançamento</strong>
              Suas entradas e saídas mais recentes aparecem aqui.
            </EmptyState>
          ) : (
            recent.map((t, i) => {
              const negative =
                t.type === "expense" || (t.type === "adjustment" && t.amount < 0);
              return (
                <TxRow key={t.id} delay={i}>
                  <TxIcon
                    tone={
                      t.type === "income" ? "in" : t.type === "expense" ? "out" : "adj"
                    }
                  >
                    {t.type === "income" ? (
                      <IconArrowUp size={14} />
                    ) : t.type === "expense" ? (
                      <IconArrowDown size={14} />
                    ) : (
                      <IconScale size={14} />
                    )}
                  </TxIcon>
                  <TxInfo>
                    <p>
                      {t.description ||
                        (t.type === "income"
                          ? "Entrada"
                          : t.type === "expense"
                            ? "Saída"
                            : "Ajuste de saldo")}
                    </p>
                    <small>{formatDateShort(t.occurred_on)}</small>
                  </TxInfo>
                  <SplitMoney
                    value={Math.abs(t.amount)}
                    size="md"
                    sign={negative ? "−" : undefined}
                    hidden={hidden}
                    color={negative ? "var(--red)" : undefined}
                  />
                </TxRow>
              );
            })
          )}
        </AnimatedCard>
      </BottomGrid>
    </Page>
  );
}
