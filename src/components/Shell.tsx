"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BalanceSummary, Source } from "@/lib/types";
import { ShellContext } from "./shell-context";
import { SplitMoney } from "./ui";
import {
  IconArrowDown,
  IconDashboard,
  IconEye,
  IconEyeOff,
  IconList,
  IconMoon,
  IconPlus,
  IconSun,
  IconTarget,
} from "./icons";
import { TransactionModal, AdjustBalanceModal } from "./TransactionModal";
import type { ThemeMode } from "./shell-context";

const Frame = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: 212px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 20px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  position: sticky;
  top: 0;
  height: 100vh;
  animation: slide-in-left 0.35s ease both;

  @media (max-width: 720px) {
    display: none;
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 8px;
  min-width: 0;
`;

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const BrandMark = styled.div`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);

  img {
    width: 26px;
    height: 26px;
  }

  a:hover & {
    transform: rotate(60deg);
  }
`;

const BrandName = styled.div`
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.02em;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const NavItem = styled(Link) <{ "data-active": boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--r-md);
  font-size: 13.5px;
  font-weight: 600;
  color: ${(p) => (p["data-active"] ? "var(--text)" : "var(--text-muted)")};
  background: ${(p) => (p["data-active"] ? "var(--surface-2)" : "transparent")};
  transition: background 0.16s ease, color 0.16s ease, transform 0.12s ease;

  svg {
    color: ${(p) => (p["data-active"] ? "var(--red)" : "currentColor")};
    transition: color 0.16s ease;
  }

  &:hover {
    color: var(--text);
    background: var(--surface-2);
  }

  &:active {
    transform: scale(0.98);
  }
`;

/* Saldo na sidebar (rola junto, nada fixo no topo) */
const SideBalance = styled.div`
  margin-top: auto;
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SideBalanceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const SideBalanceLabel = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

const SideAvailable = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11.5px;
  color: var(--text-muted);
  padding-top: 8px;
  margin-top: 2px;
  border-top: 1px solid var(--border-strong);
`;

const EyeButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const ThemeButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  box-shadow: var(--shadow-chip);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.12s ease,
    color 0.18s ease;

  &:hover {
    background: var(--surface-3);
    border-color: var(--border-strong);
  }

  &:active {
    transform: scale(0.94);
  }
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
`;

const RouteStage = styled.div`
  min-height: 100vh;
  animation: fade-up 0.32s ease both;
  will-change: opacity, transform;
`;

/* ---------- Mobile: tab bar inferior (estilo iOS) ---------- */

const BottomNav = styled.nav`
  display: none;

  @media (max-width: 720px) {
    display: flex;
    align-items: center;
    justify-content: space-around;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 60;
    background: var(--glass-nav);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-top: 1px solid var(--border);
    padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  }
`;

const MobileThemeButton = styled(ThemeButton)`
  position: fixed;
  right: 16px;
  bottom: calc(74px + env(safe-area-inset-bottom));
  z-index: 65;
  display: none;

  @media (max-width: 720px) {
    display: inline-flex;
  }
`;

const BottomItem = styled(Link) <{ "data-active": boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 12px;
  color: ${(p) => (p["data-active"] ? "var(--text)" : "var(--text-soft)")};
  transition: color 0.18s ease, transform 0.15s ease;

  svg {
    color: ${(p) => (p["data-active"] ? "var(--red)" : "currentColor")};
  }

  &:active {
    transform: scale(0.9);
  }
`;

const BottomAction = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  cursor: pointer;
  transition: color 0.18s ease, transform 0.15s ease;

  &:active {
    transform: scale(0.9);
  }
`;

const Fab = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 99px;
  border: none;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: -24px;
  box-shadow: 0 8px 22px rgba(20, 20, 21, 0.3);
  transition: transform 0.16s ease, background 0.16s ease;

  &:active {
    transform: scale(0.88);
  }
`;

const NAV = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/transacoes", label: "Controle", icon: IconList },
  { href: "/metas", label: "Metas", icon: IconTarget },
];

export default function Shell({
  summary,
  sources,
  children,
}: {
  summary: BalanceSummary;
  sources: Source[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [modal, setModal] = useState<"income" | "expense" | "adjust" | null>(null);
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    setHidden(localStorage.getItem("lira:hidden") === "1");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const savedTheme = localStorage.getItem("lira:theme") as ThemeMode | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme ?? systemTheme;

    root.dataset.theme = initialTheme;
    if (meta) meta.setAttribute("content", initialTheme === "dark" ? "#111112" : "#ffffff");
    setTheme(initialTheme);
  }, []);

  const toggleHidden = useCallback(() => {
    setHidden((h) => {
      localStorage.setItem("lira:hidden", h ? "0" : "1");
      return !h;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem("lira:theme", nextTheme);

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", nextTheme === "dark" ? "#111112" : "#ffffff");

      return nextTheme;
    });
  }, []);

  const openTransaction = useCallback(
    (type: "income" | "expense") => setModal(type),
    []
  );
  const openAdjust = useCallback(() => setModal("adjust"), []);

  const ctx = useMemo(
    () => ({ summary, sources, hidden, toggleHidden, openTransaction, openAdjust, theme, toggleTheme }),
    [summary, sources, hidden, toggleHidden, openTransaction, openAdjust, theme, toggleTheme]
  );

  const Eye = hidden ? IconEyeOff : IconEye;
  const ThemeIcon = theme === "dark" ? IconSun : IconMoon;
  const themeLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <ShellContext.Provider value={ctx}>
      <Frame>
        <Sidebar>
          <SidebarTop>
            <Brand href="/">
              <BrandMark>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="Lira" />
              </BrandMark>
              <BrandName>Lira</BrandName>
            </Brand>
            <ThemeButton onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
              <ThemeIcon size={16} />
            </ThemeButton>
          </SidebarTop>
          <Nav>
            {NAV.map(({ href, label, icon: Icon }) => (
              <NavItem key={href} href={href} data-active={pathname === href}>
                <Icon size={17} />
                {label}
              </NavItem>
            ))}
          </Nav>
          <SideBalance>
            <SideBalanceRow>
              <SideBalanceLabel>Saldo total</SideBalanceLabel>
              <EyeButton onClick={toggleHidden} aria-label="Mostrar/ocultar valores">
                <Eye size={14} />
              </EyeButton>
            </SideBalanceRow>
            <SplitMoney value={summary.balance} size="lg" hidden={hidden} />
            <SideAvailable>
              Disponível
              <SplitMoney value={summary.available} size="sm" hidden={hidden} />
            </SideAvailable>
          </SideBalance>
        </Sidebar>

        <Main>
          <RouteStage key={pathname}>{children}</RouteStage>
        </Main>
      </Frame>

      <MobileThemeButton
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
      >
        <ThemeIcon size={16} />
      </MobileThemeButton>

      <BottomNav>
        <BottomItem href="/" data-active={pathname === "/"}>
          <IconDashboard size={19} />
          Início
        </BottomItem>
        <BottomItem href="/transacoes" data-active={pathname === "/transacoes"}>
          <IconList size={19} />
          Controle
        </BottomItem>
        <Fab onClick={() => setModal("income")} aria-label="Nova entrada">
          <IconPlus size={22} strokeWidth={2.4} />
        </Fab>
        <BottomItem href="/metas" data-active={pathname === "/metas"}>
          <IconTarget size={19} />
          Metas
        </BottomItem>
        <BottomAction onClick={() => setModal("expense")} aria-label="Nova saída">
          <IconArrowDown size={19} />
          Saída
        </BottomAction>
      </BottomNav>

      {(modal === "income" || modal === "expense") && (
        <TransactionModal defaultType={modal} onClose={() => setModal(null)} />
      )}
      {modal === "adjust" && (
        <AdjustBalanceModal
          currentBalance={summary.balance}
          onClose={() => setModal(null)}
        />
      )}
    </ShellContext.Provider>
  );
}
