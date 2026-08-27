"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth";

export interface AuthFormState {
  error?: string;
}

const signupSchema = z.object({
  companyName: z.string().trim().min(2, "Vul een bedrijfsnaam in."),
  name: z.string().trim().min(2, "Vul je naam in."),
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
  password: z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten."),
});

export async function signup(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }

  const { companyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Er bestaat al een account met dit e-mailadres." };
  }

  const passwordHash = await hashPassword(password);

  const { user, company } = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: companyName } });
    const user = await tx.user.create({
      data: {
        companyId: company.id,
        email,
        passwordHash,
        name,
        role: "owner",
      },
    });
    return { user, company };
  });

  await createSessionCookie({
    userId: user.id,
    companyId: company.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "E-mailadres of wachtwoord is onjuist." };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "E-mailadres of wachtwoord is onjuist." };
  }

  await createSessionCookie({
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/dashboard");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
