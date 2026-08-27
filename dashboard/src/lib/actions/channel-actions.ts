"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncGoogleConnection } from "@/lib/google/sync";

export interface SyncActionState {
  error?: string;
  success?: string;
}

async function assertOwnedConnection(connectionId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Niet ingelogd.");
  }
  const connection = await prisma.platformConnection.findUnique({ where: { id: connectionId } });
  if (!connection || connection.companyId !== session.companyId) {
    throw new Error("Koppeling niet gevonden.");
  }
  return connection;
}

export async function syncChannelAction(
  _prevState: SyncActionState,
  formData: FormData
): Promise<SyncActionState> {
  const connectionId = formData.get("connectionId");
  if (typeof connectionId !== "string") {
    return { error: "Ongeldige koppeling." };
  }

  try {
    await assertOwnedConnection(connectionId);
    const result = await syncGoogleConnection(connectionId);
    revalidatePath("/kanalen");
    return {
      success: `${result.fetched} reviews opgehaald (${result.created} nieuw, ${result.updated} bijgewerkt).`,
    };
  } catch (err) {
    console.error("Handmatige sync mislukt:", err);
    return { error: err instanceof Error ? err.message : "Synchroniseren is mislukt." };
  }
}

export async function disconnectChannelAction(formData: FormData) {
  const connectionId = formData.get("connectionId");
  if (typeof connectionId !== "string") return;

  await assertOwnedConnection(connectionId);
  await prisma.platformConnection.delete({ where: { id: connectionId } });
  revalidatePath("/kanalen");
}
