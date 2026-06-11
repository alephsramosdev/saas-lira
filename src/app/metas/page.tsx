import { getAppData } from "@/lib/data";
import SetupNotice from "@/components/SetupNotice";
import MetasClient from "@/components/metas/MetasClient";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const { goals, setupNeeded, goalsMigrationNeeded } = await getAppData();
  if (setupNeeded) return <SetupNotice />;
  return <MetasClient goals={goals} migrationNeeded={goalsMigrationNeeded} />;
}
