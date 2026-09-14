"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendTeamInviteEmail } from "@/lib/notifications/email";

export interface TeamActionState {
  error?: string;
  success?: string;
  inviteUrl?: string;
}

const INVITE_DURATION_DAYS = 7;

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
});

export async function inviteTeamMemberAction(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const parsed = inviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Vul een geldig e-mailadres in." };
  }
  const { email } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Er bestaat al een account met dit e-mailadres." };
  }

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });
  const expiresAt = new Date(Date.now() + INVITE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Al een openstaande uitnodiging voor dit e-mailadres bij dit bedrijf? Vervang 'm dan
  // (nieuwe token/vervaldatum) in plaats van een dubbele aan te maken.
  const existingInvite = await prisma.invite.findFirst({
    where: { companyId: session.companyId, email, acceptedAt: null },
  });

  const token = randomBytes(24).toString("base64url");
  if (existingInvite) {
    await prisma.invite.update({
      where: { id: existingInvite.id },
      data: { token, expiresAt, invitedBy: session.name },
    });
  } else {
    await prisma.invite.create({
      data: { companyId: session.companyId, email, token, expiresAt, invitedBy: session.name },
    });
  }

  const inviteUrl = `${getAppUrl()}/uitnodiging/${token}`;

  try {
    await sendTeamInviteEmail({ to: email, companyName: company.name, invitedBy: session.name, inviteUrl });
  } catch (err) {
    console.error(`Uitnodigingsmail versturen mislukt voor ${email}:`, err);
  }

  revalidatePath("/instellingen");
  return { success: `Uitnodiging verstuurd naar ${email}.`, inviteUrl };
}

export async function cancelInviteAction(
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const inviteId = formData.get("inviteId");
  if (typeof inviteId !== "string") return { error: "Ongeldige uitnodiging." };

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.companyId !== session.companyId) {
    return { error: "Uitnodiging niet gevonden." };
  }

  await prisma.invite.delete({ where: { id: inviteId } });

  revalidatePath("/instellingen");
  return { success: "Uitnodiging ingetrokken." };
}
