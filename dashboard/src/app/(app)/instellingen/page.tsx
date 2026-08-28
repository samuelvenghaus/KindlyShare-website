import { PageHeader, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { CompanyNameForm } from "@/components/instellingen/CompanyNameForm";
import { NotificationSettingsForm } from "@/components/instellingen/NotificationSettingsForm";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/notifications/email";

const ROLE_LABELS = { owner: "Eigenaar", member: "Teamlid" } as const;

export default async function InstellingenPage() {
  const session = await getSession();
  if (!session) return null;

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: session.companyId },
    include: { users: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <>
      <PageHeader
        title="Instellingen"
        subtitle="Bedrijfsgegevens, gebruikers en notificaties beheer je hier."
        actions={<UserMenu />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Bedrijfsgegevens" />
          <CompanyNameForm currentName={company.name} />
        </Card>

        <Card>
          <CardHeader title="Gebruikers" subtitle={`${company.users.length} account${company.users.length === 1 ? "" : "s"}`} />
          <ul className="space-y-3">
            {company.users.map((user) => (
              <li key={user.id} className="flex items-center gap-3">
                <Avatar name={user.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-muted">
                  {ROLE_LABELS[user.role]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Teamleden uitnodigen komt in een latere fase beschikbaar.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Notificaties"
            subtitle="Ontvang een e-mail en/of Slack-bericht zodra er een nieuwe probleemmelding is."
          />
          <NotificationSettingsForm
            alertEmailEnabled={company.alertEmailEnabled}
            hasSlackWebhook={Boolean(company.alertSlackWebhookUrl)}
            emailConfigured={isEmailConfigured()}
            userEmails={company.users.map((u) => u.email)}
          />
        </Card>
      </div>
    </>
  );
}
