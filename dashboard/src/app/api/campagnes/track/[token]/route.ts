import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// 1x1 transparante GIF, gebruikt als "open"-tracking-pixel in campagnemails.
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const recipient = await prisma.campaignRecipient.findUnique({ where: { token } });
    if (recipient && !recipient.openedAt) {
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { openedAt: new Date() } });
    }
  } catch (err) {
    console.error("Campagne-tracking mislukt:", err);
  }

  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
