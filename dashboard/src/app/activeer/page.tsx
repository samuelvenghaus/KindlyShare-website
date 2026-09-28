import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompanyAccessStatus } from "@/lib/data/plan";
import { AuthShell } from "@/components/auth/AuthShell";
import { ActivateCodeForm } from "@/components/plan/ActivateCodeForm";
import { PLAN_LABELS } from "@/lib/dummy-data";
import type { Plan } from "@/lib/types";

export default async function ActiveerPage() {
  const session = await getSession();
  if (!session) return null;

  const company = await getCompanyAccessStatus(session.companyId);
  if (!company.plan) redirect("/kies-een-plan");
  if (company.planActivatedAt) redirect("/dashboard");

  return (
    <AuthShell
      title={`Activeer je ${PLAN_LABELS[company.plan as Plan]}-account`}
      subtitle="Vul de activatiecode in die je per e-mail hebt ontvangen om KindlyShare te ontgrendelen."
      footer="Geen code ontvangen? Controleer je spamfolder of neem contact met ons op."
    >
      <ActivateCodeForm />
    </AuthShell>
  );
}
