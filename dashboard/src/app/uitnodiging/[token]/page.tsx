import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/auth/AuthShell";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";

export default async function UitnodigingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({ where: { token }, include: { company: true } });

  if (!invite) {
    return (
      <AuthShell title="Ongeldige link" subtitle="Deze uitnodiging is niet (meer) geldig." footer={null}>
        <p className="text-sm text-muted">Vraag een nieuwe uitnodiging aan bij je collega.</p>
      </AuthShell>
    );
  }

  if (invite.acceptedAt) {
    return (
      <AuthShell title="Al geaccepteerd" subtitle="Deze uitnodiging is al gebruikt." footer={null}>
        <p className="text-sm text-muted">Je kunt gewoon inloggen met je account.</p>
      </AuthShell>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <AuthShell title="Verlopen" subtitle="Deze uitnodiging is niet meer geldig." footer={null}>
        <p className="text-sm text-muted">Vraag een nieuwe uitnodiging aan bij je collega.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Doe mee met ${invite.company.name}`}
      subtitle={invite.invitedBy ? `${invite.invitedBy} heeft je uitgenodigd voor KindlyShare.` : "Je bent uitgenodigd voor KindlyShare."}
      footer={null}
    >
      <AcceptInviteForm token={token} email={invite.email} />
    </AuthShell>
  );
}
