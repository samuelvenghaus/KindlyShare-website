"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionCookie } from "@/lib/auth";

export interface AcceptInviteFormState {
  error?: string;
}

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2, "Vul je naam in."),
  password: z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten."),
});

/** Publieke server action (geen sessie/login) aangeroepen vanaf de uitnodigingspagina. */
export async function acceptInviteAction(
  _prevState: AcceptInviteFormState,
  formData: FormData
): Promise<AcceptInviteFormState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }
  const { token, name, password } = parsed.data;

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return { error: "Ongeldige of verlopen uitnodiging." };
  if (invite.acceptedAt) return { error: "Deze uitnodiging is al geaccepteerd." };
  if (invite.expiresAt < new Date()) return { error: "Deze uitnodiging is verlopen. Vraag een nieuwe aan." };

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    return { error: "Er bestaat al een account met dit e-mailadres." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        companyId: invite.companyId,
        email: invite.email,
        passwordHash,
        name,
        role: "member",
      },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return user;
  });

  await createSessionCookie({
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/dashboard");
}
