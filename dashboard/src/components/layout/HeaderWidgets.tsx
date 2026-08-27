"use client";

import { useState } from "react";
import { Calendar, ChevronDown, SlidersHorizontal, Bell, LogOut, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentUser } from "@/lib/current-user-context";
import { logout } from "@/lib/actions/auth-actions";

const ROLE_LABELS = { owner: "Eigenaar", member: "Teamlid" } as const;

export function DateRangeButton({ label = "12 mei - 12 jun 2024" }: { label?: string }) {
  return (
    <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground hover:bg-surface-elevated">
      <Calendar size={16} className="text-muted" />
      {label}
      <ChevronDown size={14} className="text-muted" />
    </button>
  );
}

export function FiltersButton() {
  return (
    <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground hover:bg-surface-elevated">
      <SlidersHorizontal size={16} className="text-muted" />
      Filters
    </button>
  );
}

export function NotificationBell({ count = 2 }: { count?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-foreground"
        aria-label="Notificaties"
      >
        <Bell size={17} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-surface-elevated p-2 shadow-xl">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted">Notificaties</p>
            <div className="rounded-lg px-2 py-2 text-sm hover:bg-surface">
              <p className="font-medium text-negative">Probleem gedetecteerd</p>
              <p className="text-xs text-muted">Lange wachttijden · 47% toename in 3 dagen</p>
            </div>
            <div className="rounded-lg px-2 py-2 text-sm hover:bg-surface">
              <p className="font-medium text-foreground">Wekelijks rapport klaar</p>
              <p className="text-xs text-muted">Je overzicht van 5 - 12 jun staat klaar</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function UserMenu() {
  const { name, role } = useCurrentUser();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-elevated">
        <Avatar name={name} size={36} />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-foreground">{name}</span>
          <span className="block text-xs leading-tight text-muted">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown size={14} className="hidden text-muted sm:block" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-xl">
            <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground hover:bg-surface">
              <User size={15} className="text-muted" /> Mijn profiel
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-negative hover:bg-surface"
              >
                <LogOut size={15} /> Uitloggen
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
        {breadcrumb ? <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">{breadcrumb}</div> : null}
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
