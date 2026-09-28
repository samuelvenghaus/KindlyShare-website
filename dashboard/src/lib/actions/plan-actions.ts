"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export interface PlanActionState {
  error?: string;
}

const activateSchema = z.object({
  code: z.string().trim().min(1, "Vul de activatiecode in."),
});

export async function activatePlanAction(
  _prevState: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const parsed = activateSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Vul de activatiecode in." };
  }

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });

  if (!company.plan) {
    redirect("/kies-een-plan");
  }
  if (company.planActivatedAt) {
    redirect("/dashboard");
  }

  const normalize = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");
  if (!company.activationCode || normalize(parsed.data.code) !== normalize(company.activationCode)) {
    return { error: "Ongeldige activatiecode. Controleer je e-mail of neem contact op." };
  }

  await prisma.company.update({
    where: { id: session.companyId },
    data: { planActivatedAt: new Date() },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
