"use client";

import { createContext, useContext } from "react";
import { BalanceSummary, Source } from "@/lib/types";

export type ThemeMode = "light" | "dark";

export interface ShellState {
  summary: BalanceSummary;
  sources: Source[];
  /** saldo oculto (modo privacidade, estilo app de banco) */
  hidden: boolean;
  toggleHidden: () => void;
  openTransaction: (type: "income" | "expense") => void;
  openAdjust: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const ShellContext = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell precisa estar dentro do <Shell>.");
  return ctx;
}

/** Exibe valor monetário respeitando o modo privacidade. */
export function maskValue(formatted: string, hidden: boolean): string {
  return hidden ? "R$ ••••" : formatted;
}
