"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export interface NoteActionState {
  error?: string;
}

const noteSchema = z.object({
  text: z.string().trim().min(1, "Vul een notitie in.").max(2000),
});

export async function addReviewNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const reviewId = formData.get("reviewId");
  if (typeof reviewId !== "string") return { error: "Ongeldige review." };

  const parsed = noteSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Vul een notitie in." };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.companyId !== session.companyId) return { error: "Review niet gevonden." };

  await prisma.note.create({
    data: { companyId: session.companyId, reviewId, authorId: session.userId, text: parsed.data.text },
  });

  revalidatePath("/feedback");
  return {};
}

export async function addAlertNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const session = await getSession();
  if (!session) return { error: "Niet ingelogd." };

  const alertId = formData.get("alertId");
  if (typeof alertId !== "string") return { error: "Ongeldige melding." };

  const parsed = noteSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Vul een notitie in." };

  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.companyId !== session.companyId) return { error: "Melding niet gevonden." };

  await prisma.note.create({
    data: { companyId: session.companyId, alertId, authorId: session.userId, text: parsed.data.text },
  });

  revalidatePath("/alerts");
  return {};
}
