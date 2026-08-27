"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function resolveAlertAction(formData: FormData) {
  const alertId = formData.get("alertId");
  if (typeof alertId !== "string") return;

  const session = await getSession();
  if (!session) return;

  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.companyId !== session.companyId) return;

  await prisma.alert.update({ where: { id: alertId }, data: { resolved: true } });
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}
