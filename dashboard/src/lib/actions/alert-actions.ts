"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { AlertStatus } from "@/lib/types";

const VALID_STATUSES: AlertStatus[] = ["open", "in_progress", "resolved"];

export async function updateAlertStatusAction(formData: FormData) {
  const alertId = formData.get("alertId");
  const status = formData.get("status");
  if (typeof alertId !== "string" || typeof status !== "string") return;
  if (!VALID_STATUSES.includes(status as AlertStatus)) return;

  const session = await getSession();
  if (!session) return;

  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.companyId !== session.companyId) return;

  await prisma.alert.update({ where: { id: alertId }, data: { status: status as AlertStatus } });
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}
