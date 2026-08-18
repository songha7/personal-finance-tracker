"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useCategoryBudgets, useTransactions } from "@/lib/hooks";
import { formatCurrency } from "@/lib/format";
import { AlertIcon, BellIcon, SearchIcon } from "./icons";

// Click-outside-to-close for the notification dropdown. A plain
// `useEffect` + `document.addEventListener("mousedown", ...)` — no extra
// dependency needed for something this small.
//
// `onOutside` is stashed in a ref and read from there inside the handler,
// rather than listed as an effect dependency, so the listener is attached
// once on mount and torn down once on unmount — not re-subscribed on every
// render just because the caller passed a fresh inline arrow function.
function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const onOutsideRef = useRef(onOutside);

  // Refs can't be written during render (only in effects/handlers), so the
  // "keep this ref pointed at the latest callback" sync runs here instead
  // of inline in the function body.
  useEffect(() => {
    onOutsideRef.current = onOutside;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutsideRef.current();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return ref;
}

function initialsFor(name: string | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Topbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: transactions } = useTransactions();
  const { data: budgets } = useCategoryBudgets();

  const [query, setQuery] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useClickOutside(() => setIsNotifOpen(false));

  // The notification bell isn't decorative — it's a live read of "which
  // budgets are currently blown", computed from the same two endpoints the
  // Budgets page uses.
  const overBudget = useMemo(() => {
    return budgets
      .map((budget) => {
        const spent = transactions
          .filter((t) => t.type === "expense" && t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...budget, spent, over: spent - budget.limit };
      })
      .filter((b) => b.over > 0)
      .sort((a, b) => b.over - a.over);
  }, [budgets, transactions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/transactions?q=${encodeURIComponent(trimmed)}` : "/transactions");
  };

  return (
    <header className="flex items-center gap-4 px-6 py-5">
      <h1 className="text-2xl font-semibold text-(--ink-primary)">
        Welcome{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
      </h1>

      <form onSubmit={handleSearch} className="mx-auto w-full max-w-md">
        <label className="flex items-center gap-2 rounded-full bg-(--surface-muted) px-4 py-2.5 text-sm text-(--ink-secondary) focus-within:ring-2 focus-within:ring-(--brand-500)">
          <SearchIcon size={16} className="shrink-0 text-(--ink-muted)" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your transactions"
            className="w-full bg-transparent outline-none placeholder:text-(--ink-muted)"
          />
        </label>
      </form>

      <div ref={notifRef} className="relative shrink-0">
        <button
          onClick={() => setIsNotifOpen((open) => !open)}
          aria-label="Budget notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-(--surface-muted) text-(--ink-secondary) transition-colors hover:bg-(--chart-grid)"
        >
          <BellIcon size={18} />
          {overBudget.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-(--status-critical)" />
          )}
        </button>

        {isNotifOpen && (
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-(--chart-grid) bg-(--surface-card) p-3 shadow-lg">
            <p className="mb-2 px-1 text-sm font-semibold text-(--ink-primary)">
              Budget alerts
            </p>
            {overBudget.length === 0 ? (
              <p className="px-1 py-2 text-sm text-(--ink-muted)">
                Nothing over budget — you&apos;re on track this month.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {overBudget.map((b) => (
                  <li
                    key={b.category}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-(--surface-muted)"
                  >
                    <AlertIcon
                      size={16}
                      className="mt-0.5 shrink-0 text-(--status-critical)"
                    />
                    <span className="text-sm text-(--ink-secondary)">
                      <span className="font-medium text-(--ink-primary)">
                        {b.category}
                      </span>{" "}
                      is over budget by {formatCurrency(b.over)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Link
        href="/settings"
        className="flex shrink-0 items-center gap-2 rounded-full"
        title="Account settings"
      >
        {session?.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: "var(--brand-gradient)" }}
          >
            {initialsFor(session?.user.name)}
          </span>
        )}
      </Link>
    </header>
  );
}
