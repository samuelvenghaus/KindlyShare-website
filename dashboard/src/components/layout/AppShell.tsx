"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Sidebar, MobileSidebar } from "./Sidebar";

export function AppShell({ children, alertCount = 0 }: { children: ReactNode; alertCount?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar alertCount={alertCount} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} alertCount={alertCount} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <Image src="/logo.png" alt="KindlyShare" width={120} height={22} className="h-5 w-auto" />
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
