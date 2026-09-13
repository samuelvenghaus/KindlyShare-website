import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import { PageHeader, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { getSession } from "@/lib/auth";
import { listCampaigns } from "@/lib/data/campaigns";

const STATUS_LABELS = { draft: "Concept", sending: "Bezig met versturen...", sent: "Verstuurd" } as const;
const STATUS_STYLES = {
  draft: "bg-neutral-bg text-neutral",
  sending: "bg-interest-bg text-interest",
  sent: "bg-positive-bg text-positive",
} as const;

export default async function CampagnesPage() {
  const session = await getSession();
  const campaigns = session ? await listCampaigns(session.companyId) : [];

  return (
    <>
      <PageHeader
        title="Campagnes"
        subtitle="Vraag actief om feedback via e-mail om meer data te verzamelen."
        actions={
          <>
            <Link
              href="/campagnes/nieuw"
              className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
            >
              <Plus size={16} /> Nieuwe campagne
            </Link>
            <UserMenu />
          </>
        }
      />

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-interest-bg text-interest">
            <Mail size={22} />
          </div>
          <p className="text-base font-semibold text-foreground">Nog geen campagnes</p>
          <p className="max-w-sm text-sm text-muted">
            Start een campagne om je klanten actief om feedback te vragen via e-mail.
          </p>
          <Link
            href="/campagnes/nieuw"
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-95"
          >
            <Plus size={16} /> Nieuwe campagne
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campagnes/${campaign.id}`}>
              <Card className="transition-colors hover:bg-surface-elevated">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardHeader title={campaign.name} subtitle={campaign.subject} />
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[campaign.status]}`}>
                    {STATUS_LABELS[campaign.status]}
                  </span>
                </div>
                {campaign.totalRecipients > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                    <span>{campaign.totalRecipients} ontvangers</span>
                    <span>{campaign.sentCount} verstuurd</span>
                    <span>{campaign.openedCount} geopend</span>
                    <span className="font-medium text-foreground">{campaign.respondedCount} gereageerd</span>
                    {campaign.unsubscribedCount > 0 && <span>{campaign.unsubscribedCount} afgemeld</span>}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
