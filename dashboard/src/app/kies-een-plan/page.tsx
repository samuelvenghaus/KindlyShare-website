import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getCompanyAccessStatus } from "@/lib/data/plan";
import { logout } from "@/lib/actions/auth-actions";
import { DummyCtaButton } from "@/components/plan/DummyCtaButton";
import { PLAN_LABELS, PLAN_PRICES } from "@/lib/dummy-data";
import type { Plan } from "@/lib/types";

const PLAN_FEATURES: Record<Plan, string[]> = {
  basic: ["2 kanalen naar keuze", "1 gebruiker", "Dashboard, Feedback, Alerts en Rapporten"],
  genius: [
    "Alle kanalen",
    "Tot 5 teamleden",
    "Feedbackcampagnes",
    "AI-oplossingssuggesties en reply-concepten",
    "Feedbackwidget voor je website",
  ],
  genius_plus: [
    "Alles uit Genius",
    "Onbeperkt teamleden",
    "Onbeperkte campagnes",
    "Voorrang bij support",
  ],
};

const PLAN_ORDER: Plan[] = ["basic", "genius", "genius_plus"];

export default async function KiesEenPlanPage() {
  const session = await getSession();
  if (!session) return null;

  const company = await getCompanyAccessStatus(session.companyId);
  if (company.plan) {
    redirect(company.planActivatedAt ? "/dashboard" : "/activeer");
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center text-center">
        <Link href="/">
          <Image src="/logo.png" alt="KindlyShare" width={160} height={30} priority className="brand-logo h-7 w-auto" />
        </Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Kies het plan dat bij je past
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Je hebt nog geen actief plan. Kies hieronder een plan om KindlyShare te activeren.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {PLAN_ORDER.map((plan) => (
          <div
            key={plan}
            className="flex flex-col rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">{PLAN_LABELS[plan]}</h2>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                €{PLAN_PRICES[plan]}
              </span>
              <span className="text-sm text-muted">/maand</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {PLAN_FEATURES[plan].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <DummyCtaButton
                label={`Kies ${PLAN_LABELS[plan]}`}
                confirmMessage="Bedankt! Binnenkort kun je hier direct betalen."
                variant={plan === "genius" ? "primary" : "secondary"}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-6 text-center">
        <h3 className="text-base font-semibold text-foreground">Niet zeker welk plan bij je past?</h3>
        <p className="max-w-sm text-sm text-muted">
          Plan een gratis demo van 15 minuten en we helpen je de juiste keuze te maken.
        </p>
        <div className="w-full max-w-xs">
          <DummyCtaButton
            label="Plan een demo"
            confirmMessage="Bedankt! We nemen binnenkort contact met je op."
            variant="secondary"
          />
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-4xl text-center">
        <form action={logout}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Uitloggen
          </button>
        </form>
      </div>
    </div>
  );
}
