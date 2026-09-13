import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/auth/AuthShell";
import { FeedbackForm } from "@/components/campagnes/FeedbackForm";

export default async function FeedbackFormulierPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { token },
    include: { campaign: { include: { company: true } } },
  });

  if (!recipient) {
    return (
      <AuthShell title="Ongeldige link" subtitle="Deze feedbacklink is niet (meer) geldig." footer={null}>
        <p className="text-sm text-muted">Neem contact op met het bedrijf als je denkt dat dit niet klopt.</p>
      </AuthShell>
    );
  }

  if (recipient.status === "unsubscribed") {
    return (
      <AuthShell title="Link niet meer actief" subtitle="Je hebt je afgemeld voor dit soort verzoeken." footer={null}>
        <p className="text-sm text-muted">Je ontvangt geen verdere feedbackverzoeken van dit bedrijf.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Jouw ervaring bij ${recipient.campaign.company.name}`}
      subtitle="We zijn benieuwd naar je mening - het kost je maar een minuutje."
      footer={null}
    >
      <FeedbackForm token={token} />
    </AuthShell>
  );
}
