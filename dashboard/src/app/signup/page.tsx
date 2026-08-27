"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/lib/actions/auth-actions";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { SubmitButton } from "@/components/auth/SubmitButton";

const initialState: AuthFormState = {};

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <AuthShell
      title="Maak een account aan"
      subtitle="Start gratis met het verzamelen van al je klantfeedback op één plek."
      footer={
        <>
          Heb je al een account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <AuthField label="Bedrijfsnaam" name="companyName" placeholder="Jouw Bedrijf B.V." />
        <AuthField label="Je naam" name="name" autoComplete="name" placeholder="Voor- en achternaam" />
        <AuthField label="E-mailadres" name="email" type="email" autoComplete="email" placeholder="jij@bedrijf.nl" />
        <AuthField
          label="Wachtwoord"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minstens 8 tekens"
        />

        {state.error && <p className="text-sm text-negative">{state.error}</p>}

        <SubmitButton>Account aanmaken</SubmitButton>
      </form>
    </AuthShell>
  );
}
