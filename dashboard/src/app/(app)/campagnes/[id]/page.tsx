import { notFound } from "next/navigation";
import { PageHeader, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { SendCampaignForm, SendReminderForm } from "@/components/campagnes/CampaignActions";
import { getSession } from "@/lib/auth";
import { getCampaign } from "@/lib/data/campaigns";
import { formatTimeAgo, minutesSince } from "@/lib/dummy-data";

const STATUS_LABELS = {
  pending: "Nog te versturen",
  sent: "Verstuurd",
  responded: "Gereageerd",
  bounced: "Mislukt",
  unsubscribed: "Afgemeld",
} as const;
const STATUS_STYLES = {
  pending: "bg-neutral-bg text-neutral",
  sent: "bg-interest-bg text-interest",
  responded: "bg-positive-bg text-positive",
  bounced: "bg-negative-bg text-negative",
  unsubscribed: "bg-neutral-bg text-neutral",
} as const;

export default async function CampagneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const campaign = await getCampaign(session.companyId, id);
  if (!campaign) notFound();

  const respondedCount = campaign.recipients.filter((r) => r.status === "responded").length;
  const openedCount = campaign.recipients.filter((r) => r.openedAt !== null).length;

  return (
    <>
      <PageHeader
        title={campaign.name}
        subtitle={`${campaign.recipients.length} ontvangers`}
        actions={<UserMenu />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="E-mailvoorbeeld" subtitle={campaign.subject} />
          <div className="rounded-xl border border-border bg-surface-elevated p-4 text-sm text-foreground">
            <p className="mb-3 text-xs text-muted">
              Van: {campaign.senderName} · Antwoordadres: {campaign.replyToEmail}
            </p>
            {campaign.bodyHtml.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className="mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Voortgang" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Ontvangers</span>
              <span className="font-medium text-foreground">{campaign.recipients.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Geopend</span>
              <span className="font-medium text-foreground">{openedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Gereageerd</span>
              <span className="font-medium text-positive">{respondedCount}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {campaign.status === "draft" && <SendCampaignForm campaignId={campaign.id} />}
            {campaign.status === "sent" && <SendReminderForm campaignId={campaign.id} />}
            {campaign.status === "sending" && <p className="text-sm text-muted">Bezig met versturen...</p>}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="Ontvangers" />
          <div className="space-y-2">
            {campaign.recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{recipient.name ?? recipient.email}</p>
                  {recipient.name && <p className="truncate text-xs text-muted">{recipient.email}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {recipient.sentAt && (
                    <span className="text-xs text-muted">{formatTimeAgo(minutesSince(recipient.sentAt))}</span>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[recipient.status]}`}>
                    {STATUS_LABELS[recipient.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
