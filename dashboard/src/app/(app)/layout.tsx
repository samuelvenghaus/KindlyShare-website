import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth";
import { CurrentUserProvider } from "@/lib/current-user-context";
import { getUnresolvedAlertCount } from "@/lib/data/alerts";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const alertCount = await getUnresolvedAlertCount(session.companyId);

  return (
    <CurrentUserProvider
      user={{
        name: session.name,
        email: session.email,
        role: session.role === "owner" ? "owner" : "member",
      }}
    >
      <AppShell alertCount={alertCount}>{children}</AppShell>
    </CurrentUserProvider>
  );
}
