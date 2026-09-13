import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function AfmeldenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const recipient = await prisma.campaignRecipient.findUnique({ where: { token } });

  if (!recipient) {
    return (
      <AuthShell title="Ongeldige link" subtitle="Deze afmeldlink is niet (meer) geldig." footer={null}>
        <p className="text-sm text-muted">Er is niets aangepast.</p>
      </AuthShell>
    );
  }

  if (recipient.status !== "unsubscribed") {
    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: { status: "unsubscribed", unsubscribedAt: new Date() },
    });
  }

  return (
    <AuthShell title="Je bent afgemeld" subtitle="Je ontvangt geen verdere feedbackverzoeken van dit bedrijf." footer={null}>
      <p className="text-sm text-muted">Deze wijziging is direct doorgevoerd.</p>
    </AuthShell>
  );
}
