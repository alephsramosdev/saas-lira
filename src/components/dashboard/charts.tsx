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

const INK = "#141415";
const RED = "#ff2121";
const MUTED = "#a7a7ac";
const GRID = "#e6e6e9";

const tooltipStyle: React.CSSProperties = {
  background: "#141415",
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 12.5,
  color: "#fff",
  boxShadow: "0 12px 32px rgba(20,20,21,.28)",
};

const tooltipLabelStyle: React.CSSProperties = {
  color: "#9a9aa0",
  marginBottom: 3,
  fontWeight: 600,
  fontSize: 11.5,
};

function compactBRL(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString("pt-BR")}k`;
  return v.toLocaleString("pt-BR");
}

export function IncomeAreaChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK} stopOpacity={0.14} />
            <stop offset="100%" stopColor={INK} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fontSize: 10.5, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
          dy={4}
        />
        <YAxis
          tickFormatter={compactBRL}
          tick={{ fontSize: 10.5, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          width={42}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          labelFormatter={(label) => formatDateShort(String(label))}
          formatter={(value, name) => [
            formatBRL(Number(value)),
            name === "income" ? "Entradas" : "Saídas",
          ]}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke={INK}
          strokeWidth={2.2}
          fill="url(#income-fill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: INK }}
          animationDuration={900}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke={RED}
          strokeWidth={1.7}
          strokeDasharray="5 4"
          fill="transparent"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: RED }}
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
            <rect width="6" height="6" fill="#e9e9ec" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d4d4d9" strokeWidth="2.5" />
          </pattern>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10.5, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          dy={4}
        />
        <YAxis
          tickFormatter={compactBRL}
          tick={{ fontSize: 10.5, fill: MUTED }}
          tickLine={false}
          axisLine={false}
          width={42}
        />
        <Tooltip
          cursor={{ fill: "rgba(20, 20, 21, 0.04)" }}
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          formatter={(value) => [formatBRL(Number(value)), "Total de entradas"]}
        />
        <Bar dataKey="total" radius={[6, 6, 6, 6]} animationDuration={800}>
          {chartData.map((d) => (
            <Cell
              key={d.weekday}
              fill={d.weekday === bestWeekday ? RED : "url(#bar-stripes)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Mini-gráfico do saldo abaixo do número gigante (sem eixos). */
export function BalanceSparkline({ data }: { data: BalancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK} stopOpacity={0.08} />
            <stop offset="100%" stopColor={INK} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          labelFormatter={(_, payload) => {
            const date = payload?.[0]?.payload?.date;
            return date ? formatDateShort(String(date)) : "";
          }}
          formatter={(value) => [formatBRL(Number(value)), "Saldo"]}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#d3d3d8"
          strokeWidth={2}
          fill="url(#spark-fill)"
          dot={false}
          activeDot={{ r: 3.5, fill: RED, strokeWidth: 0 }}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
