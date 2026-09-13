"use client";

import { Sun, Moon } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/lib/theme";

export function ThemeSettingsForm() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex rounded-xl border border-border bg-surface p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
          theme === "light" ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
        )}
      >
        <Sun size={15} /> Licht
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
          theme === "dark" ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
        )}
      >
        <Moon size={15} /> Donker
      </button>
    </div>
  );
}
