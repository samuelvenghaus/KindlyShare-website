import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth";
import { CurrentUserProvider } from "@/lib/current-user-context";
import { getUnresolvedAlertCount } from "@/lib/data/alerts";
import { getCompanyAccessStatus } from "@/lib/data/plan";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Zonder actief plan mag niemand de rest van de software zien: nog geen plan gekozen ->
  // /kies-een-plan, wel gekozen maar de activatiecode nog niet ingevoerd -> /activeer.
  const access = await getCompanyAccessStatus(session.companyId);
  if (!access.plan) {
    redirect("/kies-een-plan");
  }
  if (!access.planActivatedAt) {
    redirect("/activeer");
  }

  const alertCount = await getUnresolvedAlertCount(session.companyId);
  const role = session.role === "owner" ? "owner" : "member";

  return (
    <CurrentUserProvider
      user={{
        name: session.name,
        email: session.email,
        role,
      }}
    >
      <AppShell alertCount={alertCount} role={role}>
        {children}
      </AppShell>
    </CurrentUserProvider>
  );
}
