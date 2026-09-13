import { PageHeader, UserMenu } from "@/components/layout/HeaderWidgets";
import { Card, CardHeader } from "@/components/ui/Card";
import { CampaignForm } from "@/components/campagnes/CampaignForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NieuweCampagnePage() {
  const session = await getSession();
  if (!session) return null;

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });

  return (
    <>
      <PageHeader
        title="Nieuwe campagne"
        subtitle="Vraag klanten actief om feedback via e-mail."
        actions={<UserMenu />}
      />

      <Card>
        <CardHeader title="Campagne opzetten" />
        <CampaignForm
          defaultSenderName={company.campaignSenderName ?? company.name}
          defaultReplyToEmail={company.campaignReplyToEmail ?? session.email}
        />
      </Card>
    </>
  );
}
