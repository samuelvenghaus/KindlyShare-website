"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { runSyncPipeline } from "@/lib/pipeline";

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
    const { sync, classification, newAlerts } = await runSyncPipeline(connectionId);
    revalidatePath("/kanalen");
    revalidatePath("/dashboard");
    revalidatePath("/alerts");

    let success = `${sync.fetched} reviews opgehaald (${sync.created} nieuw, ${sync.updated} bijgewerkt).`;
    if (classification) {
      success += ` ${classification.classified} geclassificeerd door AI.`;
    }
    if (newAlerts.length > 0) {
      success += ` ${newAlerts.length} nieuwe alert${newAlerts.length === 1 ? "" : "s"}.`;
    }
    return { success };
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

const appleConnectSchema = z.object({
  appId: z.string().trim().min(1, "Vul de App Store-app ID in."),
  issuerId: z.string().trim().min(1, "Vul de Issuer ID in."),
  keyId: z.string().trim().min(1, "Vul de Key ID in."),
  privateKey: z.string().trim().min(1, "Plak de inhoud van je .p8-bestand."),
});

export async function connectAppleAction(
  _prevState: SyncActionState,
  formData: FormData
): Promise<SyncActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "Niet ingelogd." };
  }

  const parsed = appleConnectSchema.safeParse({
    appId: formData.get("appId"),
    issuerId: formData.get("issuerId"),
    keyId: formData.get("keyId"),
    privateKey: formData.get("privateKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevulde gegevens." };
  }

  const { appId, issuerId, keyId, privateKey } = parsed.data;

  try {
    await prisma.platformConnection.upsert({
      where: {
        companyId_platform_externalAccountId: {
          companyId: session.companyId,
          platform: "app_store",
          externalAccountId: appId,
        },
      },
      create: {
        companyId: session.companyId,
        platform: "app_store",
        externalAccountId: appId,
        accessToken: encryptSecret(privateKey),
        appleIssuerId: issuerId,
        appleKeyId: keyId,
        status: "active",
      },
      update: {
        accessToken: encryptSecret(privateKey),
        appleIssuerId: issuerId,
        appleKeyId: keyId,
        status: "active",
      },
    });

    revalidatePath("/kanalen");
    return { success: "App Store Connect gekoppeld. Klik op 'Nu synchroniseren' om reviews op te halen." };
  } catch (err) {
    console.error("App Store-koppeling mislukt:", err);
    return { error: "Koppelen is mislukt. Controleer je Issuer ID, Key ID en private key." };
  }
}
