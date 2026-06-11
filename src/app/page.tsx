import { getAppData } from "@/lib/data";
import SetupNotice from "@/components/SetupNotice";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { transactions, goals, setupNeeded } = await getAppData();
  if (setupNeeded) return <SetupNotice />;
  return <DashboardClient transactions={transactions} goals={goals} />;
}
