"use client";

import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "./icons";

/* ---------- Layout ---------- */

export const Page = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: 28px 32px 64px;

  @media (max-width: 720px) {
    padding: 18px 16px 104px;
  }
`;

export const PageHeader = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  animation: fade-up 0.35s ease both;
`;

export const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.2;

  em {
    font-style: normal;
  }
`;

export const PageSubtitle = styled.p`
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 2px;

  &::first-letter {
    text-transform: uppercase;
  }
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

/* ---------- Card (cinza, sem borda — estilo iOS) ---------- */

export const Card = styled.section`
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 18px;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

export const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--text);
  letter-spacing: -0.01em;

  svg {
    color: var(--text-soft);
  }
`;

/* ---------- Buttons (pílulas pretas, estilo ZEN) ---------- */

export const Button = styled.button<{
  variant?: "primary" | "accent" | "danger" | "ghost" | "outline" | "light";
  size?: "sm" | "md";
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 99px;
  font-weight: 600;
  font-size: ${(p) => (p.size === "sm" ? "12.5px" : "13.5px")};
  padding: ${(p) => (p.size === "sm" ? "7px 13px" : "10px 17px")};
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease,
    box-shadow 0.15s ease;
  white-space: nowrap;

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${(p) => {
    switch (p.variant) {
      case "accent":
        return `
          background: var(--red);
          color: #fff;
          &:hover:not(:disabled) { background: var(--red-strong); }
        `;
      case "danger":
        return `
          background: var(--red-soft);
          color: var(--red);
          &:hover:not(:disabled) { background: #ffdfdf; }
        `;
      case "ghost":
        return `
          background: transparent;
          color: var(--text-muted);
          &:hover:not(:disabled) { background: var(--surface-2); color: var(--text); }
        `;
      case "outline":
        return `
          background: var(--surface-2);
          color: var(--text);
          &:hover:not(:disabled) { background: var(--surface-3); }
        `;
      case "light":
        return `
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
          &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.26); }
        `;
      default:
        return `
          background: var(--primary);
          color: #fff;
          &:hover:not(:disabled) { background: var(--primary-strong); }
        `;
    }
  }}
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;

  &:active {
    transform: scale(0.92);
  }

  &:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &[data-tone="danger"]:hover:not(:disabled) {
    background: var(--red-soft);
    color: var(--red);
  }
`;

/* ---------- Forms ---------- */

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
`;

export const Input = styled.input`
  border: 1.5px solid transparent;
  border-radius: var(--r-md);
  padding: 10px 13px;
  font-size: 15px;
  background: var(--surface-2);
  color: var(--text);
  outline: none;
  width: 100%;
  transition: border-color 0.15s ease, background 0.15s ease;

  @media (hover: none) and (pointer: coarse) {
    font-size: 16px;
  }

  &:hover {
    background: var(--surface-3);
  }

  &:focus {
    background: var(--surface);
    border-color: var(--text);
  }

  &::placeholder {
    color: var(--text-soft);
  }
`;

export const ErrorText = styled.p`
  color: var(--red);
  font-size: 12.5px;
  font-weight: 500;
`;

/* ---------- Money input (máscara estilo banco) ---------- */

const MoneyWrap = styled.div`
  position: relative;

  span {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-muted);
    background: var(--surface);
    border-radius: 8px;
    padding: 4px 8px;
    box-shadow: var(--shadow-chip);
    pointer-events: none;
    transition: color 0.15s ease;
  }

  input {
    padding: 12px 14px 12px 50px;
    font-family: var(--font-money), var(--font-body), sans-serif;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    font-size: 20px;
    letter-spacing: -0.01em;
  }

  input:focus + span,
  input:focus ~ span {
    color: var(--text);
  }
`;

/**
 * Input monetário mascarado: digitar dígitos desloca os centavos
 * ("1" → 0,01 · "123" → 1,23), como em apps de banco.
 */
export function MoneyInput({
  value,
  onValueChange,
  ...rest
}: {
  value: number | null;
  onValueChange: (value: number | null) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const display =
    value === null
      ? ""
      : value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    onValueChange(digits ? parseInt(digits, 10) / 100 : null);
  }

  return (
    <MoneyWrap>
      <span>R$</span>
      <Input
        inputMode="numeric"
        placeholder="0,00"
        value={display}
        onChange={handleChange}
        {...rest}
      />
    </MoneyWrap>
  );
}

/* ---------- Chips de filtro (ativo: branco + texto vermelho) ---------- */

export const Segmented = styled.div`
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const SegmentButton = styled.button<{ active?: boolean }>`
  border: none;
  border-radius: 99px;
  padding: 7px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease,
    transform 0.12s ease;
  background: ${(p) => (p.active ? "var(--surface)" : "var(--surface-2)")};
  color: ${(p) => (p.active ? "var(--red)" : "var(--text-muted)")};
  box-shadow: ${(p) => (p.active ? "var(--shadow-chip)" : "none")};

  &:active {
    transform: scale(0.95);
  }

  &:hover {
    color: ${(p) => (p.active ? "var(--red)" : "var(--text)")};
  }
`;

/* ---------- Progress bar ---------- */

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 99px;
  background: var(--surface-3);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ color?: string }>`
  height: 100%;
  border-radius: 99px;
  background: ${(p) => p.color ?? "var(--text)"};
  transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
`;

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <ProgressTrack
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <ProgressFill color={color} style={{ width: `${width}%` }} />
    </ProgressTrack>
  );
}

/* ---------- Badges ---------- */

export const Badge = styled.span<{ tone?: "positive" | "negative" | "neutral" | "brand" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 650;
  padding: 3.5px 9px;
  border-radius: 99px;
  white-space: nowrap;
  ${(p) => {
    switch (p.tone) {
      case "positive":
        return "background: var(--surface-2); color: var(--text);";
      case "negative":
        return "background: var(--red-soft); color: var(--red);";
      case "brand":
        return "background: var(--peri); color: var(--peri-ink);";
      default:
        return "background: var(--surface-2); color: var(--text-muted);";
    }
  }}
`;

/** Variação percentual com seta, estilo "▲ 12% vs. mês anterior" */
export function DeltaBadge({
  value,
  suffix,
}: {
  value: number;
  suffix?: string;
}) {
  const up = value >= 0;
  return (
    <Badge tone={up ? "positive" : "negative"}>
      <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
        {up ? <path d="M5 1l4 6H1z" /> : <path d="M5 9L1 3h8z" />}
      </svg>
      {Math.abs(value).toFixed(0)}%{suffix ? ` ${suffix}` : ""}
    </Badge>
  );
}

/* ---------- Empty state ---------- */

export const EmptyState = styled.div`
  text-align: center;
  padding: 30px 18px;
  color: var(--text-muted);
  font-size: 13px;

  strong {
    display: block;
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 3px;
  }
`;

/* ---------- Modal (via portal — imune a transforms dos ancestrais) ---------- */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 21, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
  animation: fade-in 0.18s ease both;
`;

const Dialog = styled.div`
  background: var(--surface);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-pop);
  width: 100%;
  max-width: 420px;
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: pop-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 20px 14px;
`;

const DialogIcon = styled.div<{ tone?: "green" | "red" | "ink" }>`
  width: 38px;
  height: 38px;
  border-radius: 13px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(p) => {
    switch (p.tone) {
      case "red":
        return "background: var(--red-soft); color: var(--red);";
      case "ink":
        return "background: var(--primary); color: #fff;";
      default:
        return "background: var(--surface-2); color: var(--text);";
    }
  }}
`;

const DialogHeading = styled.div`
  flex: 1;
  min-width: 0;

  h2 {
    font-size: 16px;
    font-weight: 650;
    letter-spacing: -0.015em;
    line-height: 1.2;
  }

  p {
    font-size: 12.5px;
    color: var(--text-muted);
    margin-top: 2px;
  }
`;

const DialogBody = styled.div`
  padding: 8px 20px 20px;
  overflow-y: auto;
`;

export function Modal({
  title,
  subtitle,
  icon,
  iconTone,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconTone?: "green" | "red" | "ink";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <Overlay onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Dialog role="dialog" aria-modal="true" aria-label={title}>
        <DialogHeader>
          {icon && <DialogIcon tone={iconTone}>{icon}</DialogIcon>}
          <DialogHeading>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </DialogHeading>
          <IconButton onClick={onClose} aria-label="Fechar">
            <IconX size={16} />
          </IconButton>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </Dialog>
    </Overlay>,
    document.body
  );
}

/* ---------- Money display ---------- */

export const Money = styled.span<{ tone?: "positive" | "negative" | "neutral" }>`
  font-family: var(--font-money), var(--font-body), sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${(p) => (p.tone === "negative" ? "var(--red)" : "var(--text)")};
`;

/* ---------- SplitMoney: "R$" pequeno + inteiro forte + centavos cinza ---------- */

interface SplitSize {
  int: number;
  cur: number;
  frac: number;
  weight: number;
}

const SPLIT_SIZES: Record<"hero" | "xl" | "lg" | "md" | "sm", SplitSize> = {
  hero: { int: 48, cur: 20, frac: 24, weight: 700 },
  xl: { int: 40, cur: 16, frac: 21, weight: 600 },
  lg: { int: 21, cur: 11.5, frac: 13, weight: 600 },
  md: { int: 15, cur: 10.5, frac: 11.5, weight: 600 },
  sm: { int: 13.5, cur: 10, frac: 10.5, weight: 600 },
};

const SplitWrap = styled.span<{ s: SplitSize }>`
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-family: var(--font-money), var(--font-body), sans-serif;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  .cur {
    font-size: ${(p) => p.s.cur}px;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0;
  }

  .int {
    font-size: ${(p) => p.s.int}px;
    font-weight: ${(p) => p.s.weight};
    line-height: 1.05;
  }

  .frac {
    font-size: ${(p) => p.s.frac}px;
    font-weight: 500;
    color: var(--text-muted);
  }
`;

function splitParts(
  value: number,
  group: string
): { sign: string; int: string; frac: string } {
  const parts = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(Math.abs(value));
  const int = parts
    .filter((p) => p.type === 'integer' || p.type === 'group')
    .map((p) => (p.type === 'group' ? group : p.value))
    .join('');
  const frac = parts.find((p) => p.type === 'fraction')?.value ?? '00';
  return { sign: value < 0 ? '−' : '', int, frac };
}

/**
 * Número monetário com hierarquia tipográfica (assinatura do design):
 * "R$" pequeno, inteiro em destaque, centavos esmaecidos.
 */
export function SplitMoney({
  value,
  size = "md",
  sign,
  hidden,
  color,
  dotGroups,
  hideCurrency,
}: {
  value: number;
  size?: keyof typeof SPLIT_SIZES;
  /** força um prefixo: "+" | "−" (o sinal negativo do próprio valor já é automático) */
  sign?: string;
  hidden?: boolean;
  color?: string;
  /** milhar com ponto ("12.329") em vez de espaço fino */
  dotGroups?: boolean;
  /** omite o "R$" (quando já há um chip de moeda ao lado) */
  hideCurrency?: boolean;
}) {
  const s = SPLIT_SIZES[size];
  if (hidden) {
    return (
      <SplitWrap s={s} style={color ? { color } : undefined}>
        {!hideCurrency && <span className="cur">R$</span>}
        <span className="int">••••</span>
      </SplitWrap>
    );
  }
  const { sign: autoSign, int, frac } = splitParts(value, dotGroups ? "." : " ");
  return (
    <SplitWrap s={s} style={color ? { color } : undefined}>
      {!hideCurrency && <span className="cur">R$</span>}
      <span className="int">
        {sign ?? autoSign}
        {int}
      </span>
      <span className="frac">,{frac}</span>
    </SplitWrap>
  );
}

/** Número grande de destaque */
export const BigNumber = styled.div`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`;
