"use client";

import { useState, useTransition } from "react";
import styled from "@emotion/styled";
import {
  addTransaction,
  updateTransaction,
  setSubtotal,
  createSource,
  deleteSource,
} from "@/app/actions";
import { formatBRL, sourceColor, todayISO } from "@/lib/format";
import { Transaction, TransactionType } from "@/lib/types";
import { useShell } from "./shell-context";
import {
  Button,
  ErrorText,
  Field,
  Input,
  Label,
  Modal,
  MoneyInput,
  Row,
} from "./ui";
import {
  IconArrowDown,
  IconArrowUp,
  IconPlus,
  IconScale,
  IconTag,
  IconX,
} from "./icons";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 17px;
`;

const TypeToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const TypeOption = styled.button<{ active: boolean; tone: "in" | "out" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--r-md);
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
  border: 1.5px solid
    ${(p) =>
      p.active ? (p.tone === "in" ? "var(--text)" : "var(--red)") : "var(--border-strong)"};
  background: ${(p) =>
    p.active ? (p.tone === "in" ? "var(--surface-2)" : "var(--red-soft)") : "var(--surface)"};
  color: ${(p) =>
    p.active ? (p.tone === "in" ? "var(--text)" : "var(--red)") : "var(--text-muted)"};

  &:active {
    transform: scale(0.98);
  }
`;

/* ---------- Fontes (chips selecionáveis) ---------- */

const SourceChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const SourceChip = styled.button<{ active: boolean; dot: string }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 99px;
  padding: 7px 13px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid ${(p) => (p.active ? "var(--primary)" : "var(--border-strong)")};
  background: ${(p) => (p.active ? "var(--primary)" : "var(--surface)")};
  color: ${(p) => (p.active ? "#fff" : "var(--text-muted)")};
  transition: all 0.15s ease;

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: ${(p) => p.dot};
  }

  &:active {
    transform: scale(0.96);
  }

  .chip-x {
    display: inline-flex;
    opacity: 0.55;
    margin-right: -4px;

    &:hover {
      opacity: 1;
    }
  }
`;

const AddSourceChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 99px;
  padding: 7px 13px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px dashed var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-soft);
  }
`;

const InlineNewSource = styled.div`
  display: flex;
  gap: 8px;

  input {
    flex: 1;
  }
`;

function SourcePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { sources } = useShell();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitNew() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createSource(newName);
      if (!result.ok) {
        setError(result.error ?? "Erro ao criar fonte.");
        return;
      }
      setError(null);
      setNewName("");
      setAdding(false);
      if (result.id) onChange(result.id);
    });
  }

  function removeSource(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Remover esta fonte? Os lançamentos existentes ficam sem fonte.")) return;
    startTransition(async () => {
      await deleteSource(id);
      if (value === id) onChange(null);
    });
  }

  return (
    <Field>
      <Label>Fonte (opcional)</Label>
      <SourceChips>
        {sources.map((s) => {
          const active = value === s.id;
          return (
            <SourceChip
              key={s.id}
              type="button"
              active={active}
              dot={sourceColor(s.name)}
              onClick={() => onChange(active ? null : s.id)}
            >
              {s.name}
              {active && (
                <span
                  className="chip-x"
                  role="button"
                  aria-label={`Excluir fonte ${s.name}`}
                  onClick={(e) => removeSource(e, s.id)}
                >
                  <IconX size={12} />
                </span>
              )}
            </SourceChip>
          );
        })}
        {!adding && (
          <AddSourceChip type="button" onClick={() => setAdding(true)}>
            <IconPlus size={13} /> Nova fonte
          </AddSourceChip>
        )}
      </SourceChips>
      {adding && (
        <InlineNewSource>
          <Input
            placeholder="Ex.: indicação, venda, salário…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNew();
              }
            }}
            autoFocus
          />
          <Button type="button" size="sm" onClick={submitNew} disabled={pending}>
            Criar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setError(null);
            }}
          >
            <IconX size={14} />
          </Button>
        </InlineNewSource>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </Field>
  );
}

/* ---------- Lançamento (criar/editar) ---------- */

export function TransactionModal({
  editing,
  defaultType = "income",
  onClose,
}: {
  editing?: Transaction;
  defaultType?: TransactionType;
  onClose: () => void;
}) {
  const [type, setType] = useState<TransactionType>(editing?.type ?? defaultType);
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState<number | null>(
    editing ? Math.abs(editing.amount) : null
  );
  const [date, setDate] = useState(editing?.occurred_on ?? todayISO());
  const [sourceId, setSourceId] = useState<string | null>(editing?.source_id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAdjustment = editing?.type === "adjustment";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount === null || amount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        type,
        description,
        amount: isAdjustment ? (editing!.amount < 0 ? -amount : amount) : amount,
        occurred_on: date,
        source_id: sourceId,
      };
      const result = editing
        ? await updateTransaction(editing.id, payload)
        : await addTransaction(payload);
      if (!result.ok) {
        setError(result.error ?? "Algo deu errado.");
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      title={
        editing
          ? "Editar lançamento"
          : type === "income"
            ? "Nova entrada"
            : "Nova saída"
      }
      subtitle={
        editing
          ? "Atualize os dados deste lançamento"
          : type === "income"
            ? "Dinheiro que entrou na conta"
            : "Dinheiro que saiu da conta"
      }
      icon={
        type === "income" ? (
          <IconArrowUp size={19} />
        ) : type === "expense" ? (
          <IconArrowDown size={19} />
        ) : (
          <IconScale size={19} />
        )
      }
      iconTone={type === "income" ? "green" : type === "expense" ? "red" : "ink"}
      onClose={onClose}
    >
      <Form onSubmit={submit}>
        {!isAdjustment && (
          <TypeToggle>
            <TypeOption
              type="button"
              tone="in"
              active={type === "income"}
              onClick={() => setType("income")}
            >
              <IconArrowUp size={15} /> Entrada
            </TypeOption>
            <TypeOption
              type="button"
              tone="out"
              active={type === "expense"}
              onClick={() => setType("expense")}
            >
              <IconArrowDown size={15} /> Saída
            </TypeOption>
          </TypeToggle>
        )}

        <Field>
          <Label htmlFor="tx-amount">Valor</Label>
          <MoneyInput
            id="tx-amount"
            value={amount}
            onValueChange={setAmount}
            autoFocus
            required
          />
        </Field>

        {type === "income" && !isAdjustment && (
          <SourcePicker value={sourceId} onChange={setSourceId} />
        )}

        <Field>
          <Label htmlFor="tx-desc">Descrição (opcional)</Label>
          <Input
            id="tx-desc"
            placeholder={
              type === "income" ? "Ex.: vendas do dia" : "Ex.: compra de insumos"
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field>
          <Label htmlFor="tx-date">Data</Label>
          <Input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>

        {error && <ErrorText>{error}</ErrorText>}

        <Row style={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : editing ? "Salvar alterações" : "Adicionar"}
          </Button>
        </Row>
      </Form>
    </Modal>
  );
}

/* ---------- Ajuste de saldo ---------- */

export function AdjustBalanceModal({
  currentBalance,
  onClose,
}: {
  currentBalance: number;
  onClose: () => void;
}) {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value === null) {
      setError("Informe o novo saldo.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setSubtotal(value);
      if (!result.ok) {
        setError(result.error ?? "Algo deu errado.");
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      title="Ajustar saldo"
      subtitle={`Saldo atual: ${formatBRL(currentBalance)}`}
      icon={<IconScale size={19} />}
      iconTone="ink"
      onClose={onClose}
    >
      <Form onSubmit={submit}>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Informe o novo saldo total — a diferença é registrada automaticamente como
          um ajuste.
        </p>
        <Field>
          <Label htmlFor="adj-value">Novo saldo</Label>
          <MoneyInput
            id="adj-value"
            value={value}
            onValueChange={setValue}
            autoFocus
            required
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Row style={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Ajustando…" : "Ajustar saldo"}
          </Button>
        </Row>
      </Form>
    </Modal>
  );
}
