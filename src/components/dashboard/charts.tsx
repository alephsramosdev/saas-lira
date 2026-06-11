"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BalancePoint, DayPoint, WeekdayStat } from "@/lib/metrics";
import { formatBRL, formatDateShort, WEEKDAY_LABELS } from "@/lib/format";
import { useShell } from "../shell-context";

/** Paleta estática por tema — CSS vars não resolvem de forma confiável em atributos SVG do Recharts */
const PALETTE = {
  light: {
    ink: "#141415",
    red: "#ff2121",
    muted: "#737378",
    grid: "#e8e8eb",
    tooltipBg: "#141415",
    tooltipText: "#ffffff",
    tooltipMuted: "#9a9aa0",
    sparkStroke: "#c4c4c9",
    patternBg: "#ededf0",
    patternLine: "#d8d8dc",
  },
  dark: {
    ink: "#f4f4f5",
    red: "#f87171",
    muted: "#a1a1aa",
    grid: "#3f3f46",
    tooltipBg: "#27272a",
    tooltipText: "#fafafa",
    tooltipMuted: "#71717a",
    sparkStroke: "#52525b",
    patternBg: "#27272a",
    patternLine: "#3f3f46",
  },
} as const;

function compactBRL(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString("pt-BR")}k`;
  return v.toLocaleString("pt-BR");
}

export function IncomeAreaChart({ data }: { data: DayPoint[] }) {
  const { theme } = useShell();
  const c = PALETTE[theme];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.ink} stopOpacity={0.14} />
            <stop offset="100%" stopColor={c.ink} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fontSize: 10.5, fill: c.muted }}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
          dy={4}
        />
        <YAxis
          tickFormatter={compactBRL}
          tick={{ fontSize: 10.5, fill: c.muted }}
          tickLine={false}
          axisLine={false}
          width={42}
        />
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12.5,
            color: c.tooltipText,
            boxShadow: "0 12px 32px rgba(20,20,21,.28)",
          }}
          labelStyle={{ color: c.tooltipMuted, marginBottom: 3, fontWeight: 600, fontSize: 11.5 }}
          labelFormatter={(label) => formatDateShort(String(label))}
          formatter={(value, name) => [
            formatBRL(Number(value)),
            name === "income" ? "Entradas" : "Sa\u00eddas",
          ]}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke={c.ink}
          strokeWidth={2.2}
          fill="url(#income-fill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: c.tooltipBg, fill: c.ink }}
          animationDuration={900}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke={c.red}
          strokeWidth={1.7}
          strokeDasharray="5 4"
          fill="transparent"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: c.tooltipBg, fill: c.red }}
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeekdayBarChart({
  data,
  bestWeekday,
}: {
  data: WeekdayStat[];
  bestWeekday: number;
}) {
  const { theme } = useShell();
  const c = PALETTE[theme];
  const chartData = data.map((d) => ({
    ...d,
    label: WEEKDAY_LABELS[d.weekday],
  }));

  return (
    <ResponsiveContainer width="100%" height={172}>
      <BarChart
        data={chartData}
        margin={{ top: 6, right: 4, bottom: 0, left: 4 }}
        barCategoryGap="30%"
      >
        <defs>
          {/* listras diagonais para as barras comuns */}
          <pattern
            id="bar-stripes"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill={c.patternBg} />
            <line x1="0" y1="0" x2="0" y2="6" stroke={c.patternLine} strokeWidth="2.5" />
          </pattern>
        </defs>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10.5, fill: c.muted }}
          tickLine={false}
          axisLine={false}
          dy={4}
        />
        <YAxis
          tickFormatter={compactBRL}
          tick={{ fontSize: 10.5, fill: c.muted }}
          tickLine={false}
          axisLine={false}
          width={42}
        />
        <Tooltip
          cursor={{ fill: theme === "light" ? "#ffecec" : "rgba(248,113,113,0.1)" }}
          contentStyle={{
            background: c.tooltipBg,
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12.5,
            color: c.tooltipText,
            boxShadow: "0 12px 32px rgba(20,20,21,.28)",
          }}
          labelStyle={{ color: c.tooltipMuted, marginBottom: 3, fontWeight: 600, fontSize: 11.5 }}
          formatter={(value) => [formatBRL(Number(value)), "Total de entradas"]}
        />
        <Bar dataKey="total" radius={[6, 6, 6, 6]} animationDuration={800}>
          {chartData.map((d) => (
            <Cell
              key={d.weekday}
              fill={d.weekday === bestWeekday ? c.red : "url(#bar-stripes)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Mini-gráfico do saldo abaixo do número gigante (sem eixos). */
export function BalanceSparkline({ data }: { data: BalancePoint[] }) {
  const { theme } = useShell();
  const c = PALETTE[theme];

  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.ink} stopOpacity={0.08} />
            <stop offset="100%" stopColor={c.ink} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            border: "none",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12.5,
            color: c.tooltipText,
            boxShadow: "0 12px 32px rgba(20,20,21,.28)",
          }}
          labelStyle={{ color: c.tooltipMuted, marginBottom: 3, fontWeight: 600, fontSize: 11.5 }}
          labelFormatter={(_, payload) => {
            const date = payload?.[0]?.payload?.date;
            return date ? formatDateShort(String(date)) : "";
          }}
          formatter={(value) => [formatBRL(Number(value)), "Saldo"]}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={c.sparkStroke}
          strokeWidth={2}
          fill="url(#spark-fill)"
          dot={false}
          activeDot={{ r: 3.5, fill: c.red, strokeWidth: 0 }}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
