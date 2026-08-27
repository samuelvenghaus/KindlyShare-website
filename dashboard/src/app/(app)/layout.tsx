import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth";
import { CurrentUserProvider } from "@/lib/current-user-context";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <CurrentUserProvider
      user={{
        name: session.name,
        email: session.email,
        role: session.role === "owner" ? "owner" : "member",
      }}
    >
      <AppShell>{children}</AppShell>
    </CurrentUserProvider>
  );
}
