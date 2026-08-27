"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/lib/actions/auth-actions";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <AuthShell
      title="Welkom terug"
      subtitle="Log in om je feedback-dashboard te bekijken."
      footer={
        <>
          Nog geen account?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Maak een account aan
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <AuthField label="E-mailadres" name="email" type="email" autoComplete="email" placeholder="jij@bedrijf.nl" />
        <AuthField label="Wachtwoord" name="password" type="password" autoComplete="current-password" placeholder="••••••••" />

        {state.error && <p className="text-sm text-negative">{state.error}</p>}

        <SubmitButton>Inloggen</SubmitButton>
      </form>
    </AuthShell>
  );
}
