"use client";

import { useState, useTransition } from "react";
import styled from "@emotion/styled";
import {
  Bike,
  Briefcase,
  Car,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  House,
  ImagePlus,
  PiggyBank,
  Plane,
  Smartphone,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { Goal } from "@/lib/types";
import {
  completeGoal,
  createGoal,
  deleteGoal,
  depositToGoal,
  updateGoal,
  uploadGoalPhoto,
} from "@/app/actions";
import { formatBRL, formatDateFull, parseDateOnly } from "@/lib/format";
import { useShell } from "../shell-context";
import {
  Badge,
  Button,
  ErrorText,
  Field,
  IconButton,
  Input,
  Label,
  Modal,
  MoneyInput,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  ProgressBar,
  Row,
  SplitMoney,
} from "../ui";
import {
  IconEdit,
  IconMinus,
  IconParty,
  IconPlus,
  IconTarget,
  IconTrash,
  IconWallet,
} from "../icons";

/* ---------- ícones disponíveis para metas ---------- */

const GOAL_ICONS: { key: string; Icon: LucideIcon }[] = [
  { key: "target", Icon: Target },
  { key: "piggy-bank", Icon: PiggyBank },
  { key: "plane", Icon: Plane },
  { key: "house", Icon: House },
  { key: "car", Icon: Car },
  { key: "gift", Icon: Gift },
  { key: "smartphone", Icon: Smartphone },
  { key: "heart", Icon: Heart },
  { key: "graduation-cap", Icon: GraduationCap },
  { key: "gem", Icon: Gem },
  { key: "bike", Icon: Bike },
  { key: "briefcase", Icon: Briefcase },
];

function goalIcon(key: string): LucideIcon {
  return GOAL_ICONS.find((i) => i.key === key)?.Icon ?? Target;
}

/* ---------- aviso de migração pendente ---------- */

const MigrationBanner = styled.div`
  background: var(--red-soft);
  border-radius: var(--r-lg);
  padding: 14px 16px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: var(--text);
  line-height: 1.5;
  animation: fade-up 0.4s ease both;

  strong {
    color: var(--red);
  }

  a {
    font-weight: 700;
    text-decoration: underline;
  }

  pre {
    margin-top: 8px;
    background: var(--text);
    color: #fff;
    border-radius: var(--r-md);
    padding: 10px 12px;
    font-size: 11px;
    line-height: 1.6;
    overflow-x: auto;
    user-select: all;
  }
`;

const MIGRATION_SQL = `alter table public.goals add column if not exists icon text not null default 'target';
alter table public.goals add column if not exists completed_at timestamptz;
alter table public.goals add column if not exists photo_url text;`;

/* ---------- banner do disponível ---------- */

const AvailableBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 16px 18px;
  margin-bottom: 20px;
  animation: fade-up 0.4s ease both;

  svg {
    color: var(--red);
    flex-shrink: 0;
  }
`;

const AvailableText = styled.div`
  flex: 1;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
`;

const ReservedPill = styled.div`
  text-align: right;
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

/* ---------- grid de metas ---------- */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 12px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const GoalCard = styled.div<{ delay?: number }>`
  background: var(--surface-2);
  border-radius: var(--r-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: fade-up 0.4s ease both;
  animation-delay: ${(p) => (p.delay ?? 0) * 55}ms;
  transition: transform 0.18s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const GoalTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const GoalIconBox = styled.div<{ color: string }>`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  box-shadow: var(--shadow-chip);
  color: ${(p) => p.color};
`;

const GoalInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const GoalName = styled.h3`
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.25;
`;

const GoalAmounts = styled.div`
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
`;

const GoalActions = styled.div`
  display: flex;
  gap: 1px;
`;

const PctRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const Pct = styled.span<{ done: boolean }>`
  font-family: var(--font-money), sans-serif;
  font-size: 19px;
  font-weight: 600;
  color: ${(p) => (p.done ? "var(--red)" : "var(--text)")};
  font-variant-numeric: tabular-nums;
`;

const NewGoalCard = styled.button`
  border: 2px dashed var(--border-strong);
  border-radius: var(--r-lg);
  background: transparent;
  min-height: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--text-muted);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: fade-up 0.4s ease both;

  &:hover {
    border-color: var(--text);
    color: var(--text);
    background: var(--surface-2);
    transform: translateY(-2px);
  }
`;

/* ---------- formulários ---------- */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const IconGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const IconOption = styled.button<{ active: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 13px;
  border: 1.5px solid ${(p) => (p.active ? "var(--text)" : "transparent")};
  background: ${(p) => (p.active ? "var(--text)" : "var(--surface-2)")};
  color: ${(p) => (p.active ? "#fff" : "var(--text-muted)")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.14s ease;

  &:hover {
    color: ${(p) => (p.active ? "#fff" : "var(--text)")};
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.94);
  }
`;

/* foto de desejo no formulário */
const PhotoPicker = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PhotoPreview = styled.div`
  position: relative;
  width: 86px;
  height: 64px;
  border-radius: var(--r-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  button {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 99px;
    border: none;
    background: rgba(20, 20, 21, 0.75);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
`;

const PhotoButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border-radius: var(--r-md);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }

  input {
    display: none;
  }
`;

/* foto de desejo no card */
const GoalPhoto = styled.div`
  position: relative;
  margin: -18px -18px 0;
  height: 116px;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 55%, rgba(20, 20, 21, 0.18));
  }
`;

const DoneThumb = styled.img`
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
  object-fit: cover;
  opacity: 0.85;
`;

const ColorRow = styled.div`
  display: flex;
  gap: 9px;
`;

const ColorOption = styled.button<{ color: string; active: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 99px;
  background: ${(p) => p.color};
  border: 3px solid ${(p) => (p.active ? "var(--text-soft)" : "transparent")};
  cursor: pointer;
  transition: transform 0.13s ease;

  &:hover {
    transform: scale(1.12);
  }
`;

const QuickPcts = styled.div`
  display: flex;
  gap: 7px;
`;

const QuickPct = styled.button`
  flex: 1;
  border: none;
  background: var(--surface-2);
  border-radius: 99px;
  padding: 7px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.14s ease;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }
`;

const GOAL_COLORS = [
  "#141415",
  "#ff2121",
  "#3d49b6",
  "#db2777",
  "#0891b2",
  "#f59e0b",
];

/* ---------- metas finalizadas (somente leitura) ---------- */

const SectionLabel = styled.h2`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 26px 0 12px;
`;

const DoneCard = styled.div<{ delay?: number }>`
  background: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-lg);
  padding: 15px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fade-up 0.4s ease both;
  animation-delay: ${(p) => (p.delay ?? 0) * 50}ms;
`;

const DoneInfo = styled.div`
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 14px;
    font-weight: 650;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 11.5px;
    color: var(--text-muted);
  }
`;

/* ---------- celebração ---------- */

const CongratsBody = styled.div`
  text-align: center;
  padding: 8px 4px 4px;

  .party {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 24px;
    background: var(--red-soft);
    color: var(--red);
    margin-bottom: 14px;
    animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  h3 {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    animation: fade-up 0.4s ease 0.1s both;
  }

  p {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 6px 0 18px;
    line-height: 1.5;
    animation: fade-up 0.4s ease 0.18s both;

    b {
      color: var(--text);
    }
  }
`;

function CongratsModal({
  goal,
  onClose,
}: {
  goal: Goal;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function finish() {
    startTransition(async () => {
      const result = await completeGoal(goal.id);
      if (!result.ok) {
        setError(result.error ?? "Algo deu errado.");
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Meta concluída" onClose={onClose}>
      <CongratsBody>
        <div className="party">
          <IconParty size={34} strokeWidth={1.8} />
        </div>
        <h3>Parabéns! 🎉</h3>
        <p>
          Você completou <b>“{goal.name}”</b> e guardou{" "}
          <b>{formatBRL(goal.saved_amount)}</b>. Ao finalizar, ela fica salva como
          concluída — apenas para visualização — e o valor volta para o seu
          disponível.
        </p>
        {error && <ErrorText style={{ marginBottom: 12 }}>{error}</ErrorText>}
        <Row style={{ justifyContent: "center", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>
            Agora não
          </Button>
          <Button variant="accent" onClick={finish} disabled={pending}>
            {pending ? "Finalizando…" : "Finalizar meta"}
          </Button>
        </Row>
      </CongratsBody>
    </Modal>
  );
}

/* ---------- form da meta ---------- */

function GoalFormModal({
  editing,
  onClose,
}: {
  editing?: Goal;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [target, setTarget] = useState<number | null>(editing?.target_amount ?? null);
  const [deadline, setDeadline] = useState(editing?.deadline ?? "");
  const [color, setColor] = useState(editing?.color ?? GOAL_COLORS[0]);
  const [icon, setIcon] = useState(editing?.icon ?? "target");
  const [photoUrl, setPhotoUrl] = useState<string | null>(editing?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("photo", file);
    const result = await uploadGoalPhoto(formData);
    setUploading(false);
    if (!result.ok || !result.url) {
      setError(result.error ?? "Não foi possível enviar a foto.");
      return;
    }
    setPhotoUrl(result.url);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (target === null || target <= 0) {
      setError("Informe o valor da meta.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        name,
        target_amount: target,
        deadline: deadline || null,
        color,
        icon,
        photo_url: photoUrl,
      };
      const result = editing
        ? await updateGoal(editing.id, payload)
        : await createGoal(payload);
      if (!result.ok) {
        setError(result.error ?? "Algo deu errado.");
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      title={editing ? "Editar meta" : "Nova meta"}
      subtitle={
        editing
          ? "Atualize os dados da sua meta"
          : "Defina um objetivo e acompanhe o progresso"
      }
      icon={<IconTarget size={18} />}
      onClose={onClose}
    >
      <Form onSubmit={submit}>
        <Field>
          <Label htmlFor="goal-name">Nome</Label>
          <Input
            id="goal-name"
            placeholder="Ex.: reserva de emergência"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </Field>
        <Field>
          <Label htmlFor="goal-target">Valor da meta</Label>
          <MoneyInput id="goal-target" value={target} onValueChange={setTarget} required />
        </Field>
        <Field>
          <Label>Foto de desejo (opcional)</Label>
          <PhotoPicker>
            {photoUrl && (
              <PhotoPreview>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Foto da meta" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  aria-label="Remover foto"
                >
                  <X size={12} />
                </button>
              </PhotoPreview>
            )}
            <PhotoButton>
              <ImagePlus size={16} />
              {uploading ? "Enviando…" : photoUrl ? "Trocar foto" : "Escolher foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={pickPhoto}
                disabled={uploading}
              />
            </PhotoButton>
          </PhotoPicker>
        </Field>
        <Field>
          <Label>Ícone {photoUrl ? "(usado quando não há foto)" : ""}</Label>
          <IconGrid>
            {GOAL_ICONS.map(({ key, Icon }) => (
              <IconOption
                key={key}
                type="button"
                active={icon === key}
                onClick={() => setIcon(key)}
                aria-label={`Ícone ${key}`}
              >
                <Icon size={18} />
              </IconOption>
            ))}
          </IconGrid>
        </Field>
        <Field>
          <Label>Cor</Label>
          <ColorRow>
            {GOAL_COLORS.map((c) => (
              <ColorOption
                key={c}
                type="button"
                color={c}
                active={color === c}
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
              />
            ))}
          </ColorRow>
        </Field>
        <Field>
          <Label htmlFor="goal-deadline">Prazo (opcional)</Label>
          <Input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Row style={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : editing ? "Salvar alterações" : "Criar meta"}
          </Button>
        </Row>
      </Form>
    </Modal>
  );
}

/* ---------- depositar / retirar ---------- */

function DepositModal({
  goal,
  mode,
  available,
  onClose,
  onCompleted,
}: {
  goal: Goal;
  mode: "deposit" | "withdraw";
  available: number;
  onClose: () => void;
  onCompleted: (goal: Goal) => void;
}) {
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const max = mode === "deposit" ? Math.max(0, available) : goal.saved_amount;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value === null || value <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (mode === "deposit" && value > max + 0.005) {
      setError(`Você só tem ${formatBRL(max)} disponível fora das metas.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await depositToGoal(goal.id, mode === "deposit" ? value : -value);
      if (!result.ok) {
        setError(result.error ?? "Algo deu errado.");
        return;
      }
      const newSaved = goal.saved_amount + (mode === "deposit" ? value : -value);
      onClose();
      if (mode === "deposit" && newSaved >= goal.target_amount) {
        onCompleted({ ...goal, saved_amount: newSaved });
      }
    });
  }

  return (
    <Modal
      title={mode === "deposit" ? `Guardar em “${goal.name}”` : `Retirar de “${goal.name}”`}
      subtitle={
        mode === "deposit"
          ? `Disponível fora das metas: ${formatBRL(max)}`
          : `Guardado nesta meta: ${formatBRL(goal.saved_amount)}`
      }
      icon={mode === "deposit" ? <IconPlus size={18} /> : <IconMinus size={18} />}
      iconTone={mode === "deposit" ? "ink" : "red"}
      onClose={onClose}
    >
      <Form onSubmit={submit}>
        <Field>
          <Label htmlFor="dep-value">Valor</Label>
          <MoneyInput
            id="dep-value"
            value={value}
            onValueChange={setValue}
            autoFocus
            required
          />
        </Field>
        {max > 0 && (
          <QuickPcts>
            {[25, 50, 100].map((pct) => (
              <QuickPct
                key={pct}
                type="button"
                onClick={() => setValue(Number(((max * pct) / 100).toFixed(2)))}
              >
                {pct === 100 ? "Tudo" : `${pct}%`}
              </QuickPct>
            ))}
          </QuickPcts>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        <Row style={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant={mode === "deposit" ? "primary" : "danger"} disabled={pending}>
            {pending ? "Salvando…" : mode === "deposit" ? "Guardar" : "Retirar"}
          </Button>
        </Row>
      </Form>
    </Modal>
  );
}

/* ---------- página ---------- */

export default function MetasClient({
  goals,
  migrationNeeded,
}: {
  goals: Goal[];
  migrationNeeded: boolean;
}) {
  const { summary, hidden } = useShell();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deposit, setDeposit] = useState<{ goal: Goal; mode: "deposit" | "withdraw" } | null>(null);
  const [celebrating, setCelebrating] = useState<Goal | null>(null);
  const [, startTransition] = useTransition();

  const finished = goals.filter((g) => g.completed_at);

  function remove(goal: Goal) {
    if (!confirm(`Excluir a meta "${goal.name}"? O valor guardado volta para o disponível.`))
      return;
    startTransition(async () => {
      await deleteGoal(goal.id);
    });
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Metas e objetivos</PageTitle>
          <PageSubtitle>
            O dinheiro guardado sai do seu disponível — proporcional ao que você tem
          </PageSubtitle>
        </div>
        <Button onClick={() => setCreating(true)}>
          <IconPlus size={15} /> Nova meta
        </Button>
      </PageHeader>

      {migrationNeeded && (
        <MigrationBanner>
          <strong>Falta 1 passo:</strong> para salvar ícone, foto e finalização das
          metas, cole o SQL abaixo no{" "}
          <a
            href="https://supabase.com/dashboard/project/lttpsqjvxhgrcpgyoedv/sql/new"
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor do Supabase
          </a>{" "}
          e clique em Run (o app funciona sem isso, mas não guarda esses campos).
          <pre>{MIGRATION_SQL}</pre>
        </MigrationBanner>
      )}

      <AvailableBanner>
        <IconWallet size={24} strokeWidth={1.7} />
        <AvailableText>
          Disponível para guardar
          <div>
            <SplitMoney
              value={Math.max(0, summary.available)}
              size="lg"
              hidden={hidden}
            />
          </div>
        </AvailableText>
        <ReservedPill>
          reservado em metas
          <SplitMoney value={summary.reserved} size="sm" hidden={hidden} />
        </ReservedPill>
      </AvailableBanner>

      <Grid>
        {goals.filter((g) => !g.completed_at).map((g, i) => {
          const pct = g.target_amount > 0 ? (g.saved_amount / g.target_amount) * 100 : 0;
          const done = pct >= 100;
          const overdue =
            !done && g.deadline ? parseDateOnly(g.deadline) < new Date() : false;
          const Icon = goalIcon(g.icon);
          return (
            <GoalCard key={g.id} delay={i}>
              {g.photo_url && (
                <GoalPhoto>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.photo_url} alt={`Foto da meta ${g.name}`} />
                </GoalPhoto>
              )}
              <GoalTop>
                {!g.photo_url && (
                  <GoalIconBox color={g.color}>
                    <Icon size={20} strokeWidth={1.9} />
                  </GoalIconBox>
                )}
                <GoalInfo>
                  <GoalName>{g.name}</GoalName>
                  <GoalAmounts>
                    {hidden
                      ? "R$ •••• guardados"
                      : `${formatBRL(g.saved_amount)} de ${formatBRL(g.target_amount)}`}
                  </GoalAmounts>
                </GoalInfo>
                <GoalActions>
                  <IconButton onClick={() => setEditing(g)} aria-label="Editar meta">
                    <IconEdit size={14} />
                  </IconButton>
                  <IconButton
                    data-tone="danger"
                    onClick={() => remove(g)}
                    aria-label="Excluir meta"
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </GoalActions>
              </GoalTop>

              <div>
                <PctRow>
                  <Pct done={done}>{Math.min(999, Math.round(pct))}%</Pct>
                  {done ? (
                    <Badge tone="negative">Concluída 🎉</Badge>
                  ) : g.deadline ? (
                    <Badge tone={overdue ? "negative" : "neutral"}>
                      {overdue ? "Prazo vencido · " : "Até "}
                      {formatDateFull(g.deadline)}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Sem prazo</Badge>
                  )}
                </PctRow>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar value={pct} color={g.color} />
                </div>
              </div>

              {done ? (
                <Button variant="accent" onClick={() => setCelebrating(g)}>
                  <IconParty size={15} /> Concluir meta
                </Button>
              ) : (
                <Row style={{ justifyContent: "flex-end", gap: 7 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeposit({ goal: g, mode: "withdraw" })}
                    disabled={g.saved_amount <= 0}
                  >
                    <IconMinus size={13} /> Retirar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setDeposit({ goal: g, mode: "deposit" })}
                    disabled={summary.available <= 0}
                  >
                    <IconPlus size={13} /> Guardar
                  </Button>
                </Row>
              )}
            </GoalCard>
          );
        })}

        <NewGoalCard onClick={() => setCreating(true)}>
          <IconTarget size={24} strokeWidth={1.6} />
          {goals.length === 0 ? "Criar minha primeira meta" : "Nova meta"}
        </NewGoalCard>
      </Grid>

      {finished.length > 0 && (
        <>
          <SectionLabel>Finalizadas 🏁</SectionLabel>
          <Grid>
            {finished.map((g, i) => {
              const Icon = goalIcon(g.icon);
              return (
                <DoneCard key={g.id} delay={i}>
                  {g.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <DoneThumb src={g.photo_url} alt="" />
                  ) : (
                    <GoalIconBox color={g.color} style={{ opacity: 0.7 }}>
                      <Icon size={19} strokeWidth={1.9} />
                    </GoalIconBox>
                  )}
                  <DoneInfo>
                    <h3>{g.name}</h3>
                    <small>
                      {hidden ? "R$ ••••" : formatBRL(g.saved_amount)} guardados
                      {g.completed_at &&
                        ` · em ${formatDateFull(g.completed_at.slice(0, 10))}`}
                    </small>
                  </DoneInfo>
                  <Badge tone="positive">✓ Concluída</Badge>
                  <IconButton
                    data-tone="danger"
                    onClick={() => remove(g)}
                    aria-label="Excluir meta finalizada"
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </DoneCard>
              );
            })}
          </Grid>
        </>
      )}

      {creating && <GoalFormModal onClose={() => setCreating(false)} />}
      {editing && <GoalFormModal editing={editing} onClose={() => setEditing(null)} />}
      {deposit && (
        <DepositModal
          goal={deposit.goal}
          mode={deposit.mode}
          available={summary.available}
          onClose={() => setDeposit(null)}
          onCompleted={(g) => setCelebrating(g)}
        />
      )}
      {celebrating && (
        <CongratsModal goal={celebrating} onClose={() => setCelebrating(null)} />
      )}
    </Page>
  );
}
