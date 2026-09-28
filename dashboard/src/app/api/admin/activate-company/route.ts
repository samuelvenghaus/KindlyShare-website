import { randomInt } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendPlanActivationEmail } from "@/lib/notifications/email";
import { PLAN_LABELS } from "@/lib/dummy-data";
import type { Plan } from "@/lib/types";

// Intern endpoint waarmee de eigenaar van KindlyShare (nog handmatig, er is geen
// betaalintegratie) een plan toekent aan een bedrijf en de bijbehorende activatiecode
// per e-mail laat versturen. Aanroepen met header: Authorization: Bearer <ADMIN_SECRET>
// bv.: curl -X POST <APP_URL>/api/admin/activate-company \
//        -H "Authorization: Bearer $ADMIN_SECRET" -H "Content-Type: application/json" \
//        -d '{"email":"klant@bedrijf.nl","plan":"genius"}'

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // zonder 0/O/1/I, i.v.m. leesbaarheid

function generateActivationCode(): string {
  const raw = Array.from({ length: 8 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  plan: z.enum(["basic", "genius", "genius_plus"]),
});

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  const { email, plan } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { company: true } });
  if (!user) {
    return NextResponse.json({ error: "Geen account gevonden met dit e-mailadres." }, { status: 404 });
  }

  const activationCode = generateActivationCode();

  await prisma.company.update({
    where: { id: user.companyId },
    data: { plan: plan as Plan, activationCode, planActivatedAt: null },
  });

  let emailSent = false;
  if (isEmailConfigured()) {
    try {
      await sendPlanActivationEmail({
        to: user.email,
        companyName: user.company.name,
        planLabel: PLAN_LABELS[plan as Plan],
        activationCode,
        appUrl: process.env.APP_URL ?? "http://localhost:3000",
      });
      emailSent = true;
    } catch (err) {
      console.error(`Activatiemail versturen mislukt voor ${email}:`, err);
    }
  }

  return NextResponse.json({ success: true, code: activationCode, emailSent });
}
