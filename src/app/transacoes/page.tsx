import { getAppData } from "@/lib/data";
import SetupNotice from "@/components/SetupNotice";
import TransacoesClient from "@/components/transacoes/TransacoesClient";

export const dynamic = "force-dynamic";

export default async function TransacoesPage() {
  const { transactions, setupNeeded } = await getAppData();
  if (setupNeeded) return <SetupNotice />;
  return <TransacoesClient transactions={transactions} />;
}
