"use client";

import { useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, LayoutGrid, List, Search } from "lucide-react";
import clsx from "clsx";

const selectClassName =
  "rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none";

export function FeedbackFilterBar({ categoryOptions }: { categoryOptions: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get("q") ?? "";
  const sentiment = searchParams.get("sentiment") ?? "all";
  const score = searchParams.get("score") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const view = searchParams.get("view") === "grid" ? "grid" : "list";

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (!("page" in updates)) params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value || null }), 400);
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          defaultValue={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Zoek in feedback..."
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
        />
      </div>

      <select value={sentiment} onChange={(e) => navigate({ sentiment: e.target.value })} className={selectClassName}>
        <option value="all">Sentiment</option>
        <option value="positive">Positief</option>
        <option value="negative">Negatief</option>
        <option value="neutral">Neutraal</option>
      </select>

      <select value={score} onChange={(e) => navigate({ score: e.target.value })} className={selectClassName}>
        <option value="all">Score</option>
        {[5, 4, 3, 2, 1].map((s) => (
          <option key={s} value={s}>
            {s} sterren
          </option>
        ))}
      </select>

      <select value={category} onChange={(e) => navigate({ category: e.target.value })} className={selectClassName}>
        <option value="all">Categorie</option>
        {categoryOptions.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </select>

      <button
        onClick={() => navigate({ sort: sort === "newest" ? "oldest" : "newest" })}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground hover:bg-surface-elevated"
      >
        <ArrowUpDown size={15} className="text-muted" />
        {sort === "newest" ? "Nieuwste eerst" : "Oudste eerst"}
      </button>

      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => navigate({ view: "list" })}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            view === "list" ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
          )}
          aria-label="Lijstweergave"
        >
          <List size={15} />
        </button>
        <button
          onClick={() => navigate({ view: "grid" })}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            view === "grid" ? "bg-brand text-[#0a0a0a]" : "text-muted hover:text-foreground"
          )}
          aria-label="Rasterweergave"
        >
          <LayoutGrid size={15} />
        </button>
      </div>
    </div>
  );
}
