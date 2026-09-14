"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function resolveAssigneeId(formData: FormData, session: { companyId: string }): Promise<string | null | undefined> {
  const userIdRaw = formData.get("userId");
  const userId = typeof userIdRaw === "string" && userIdRaw ? userIdRaw : null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.companyId !== session.companyId) return undefined;
  return userId;
}

export async function assignReviewAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const reviewId = formData.get("reviewId");
  if (typeof reviewId !== "string") return;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.companyId !== session.companyId) return;

  const assigneeId = await resolveAssigneeId(formData, session);
  if (assigneeId === undefined) return;

  await prisma.review.update({ where: { id: reviewId }, data: { assignedToId: assigneeId } });
  revalidatePath("/feedback");
}

export async function assignAlertAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const alertId = formData.get("alertId");
  if (typeof alertId !== "string") return;

  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.companyId !== session.companyId) return;

  const assigneeId = await resolveAssigneeId(formData, session);
  if (assigneeId === undefined) return;

  await prisma.alert.update({ where: { id: alertId }, data: { assignedToId: assigneeId } });
  revalidatePath("/alerts");
}
