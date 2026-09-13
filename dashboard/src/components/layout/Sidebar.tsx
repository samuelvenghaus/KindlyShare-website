"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Bell,
  FileText,
  Radio,
  Settings,
  Sparkles,
  ArrowRight,
  Mail,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/analyse", label: "Analyse", icon: BarChart3 },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/campagnes", label: "Campagnes", icon: Mail },
  { href: "/rapporten", label: "Rapporten", icon: FileText },
  { href: "/kanalen", label: "Kanalen", icon: Radio },
  { href: "/instellingen", label: "Instellingen", icon: Settings },
];

function SidebarContent({ onNavigate, alertCount = 0 }: { onNavigate?: () => void; alertCount?: number }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center px-6 py-6">
        <Link href="/dashboard" onClick={onNavigate}>
          <Image src="/logo.png" alt="KindlyShare" width={140} height={26} priority className="brand-logo h-6 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge = item.href === "/alerts" && alertCount > 0 ? alertCount : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border border-border bg-surface-elevated text-foreground"
                  : "text-muted hover:bg-surface-elevated/60 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-negative px-1 text-[11px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <Sparkles size={16} />
          </div>
          <p className="text-sm font-medium text-foreground">Upgrade je plan</p>
          <p className="mt-1 text-xs text-muted">Ontgrendel meer inzichten en hogere limieten.</p>
          <Link
            href="/instellingen"
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            Meer info <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-background md:block">
      <div className="sticky top-0 h-screen">
        <SidebarContent alertCount={alertCount} />
      </div>
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
  alertCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  alertCount?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-background">
        <button
          onClick={onClose}
          className="absolute right-3 top-6 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground"
          aria-label="Sluit menu"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavigate={onClose} alertCount={alertCount} />
      </div>
    </div>
  );
}
