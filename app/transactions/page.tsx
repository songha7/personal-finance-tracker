"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransactions } from "@/lib/hooks";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { AddIcon, DownloadIcon, SearchIcon, TrashIcon } from "../components/icons";

const PAGE_SIZE = 8;

type TypeFilter = "all" | "income" | "expense";

// `useSearchParams` needs a Suspense boundary around whatever reads it (see
// the Next.js docs on prerendering) — everything above the search bar can
// still be sent as static HTML, only this part becomes client-rendered.
export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-(--ink-muted)">Loading…</div>}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const { data: transactions, isLoading, refetch } = useTransactions();

  // Seeded from `?q=` — that's how the topbar's search bar hands off to
  // this page — but editable afterwards like any other filter.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter(
        (t) =>
          needle === "" ||
          t.description.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, query, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Any filter change invalidates the current page number (e.g. page 3 of
  // a 1-page result makes no sense) — reset to page 1 rather than showing
  // an empty page.
  const handleFilterChange = (updater: () => void) => {
    updater();
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    refetch();
    setDeletingId(null);
  };

  const handleExport = () => {
    downloadCSV(filtered);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-(--ink-primary)">Transactions</h1>
        <Link
          href="/inputs"
          className="flex items-center gap-1.5 rounded-full bg-(--brand-600) px-4 py-2 text-sm font-semibold text-white hover:bg-(--brand-700)"
        >
          <AddIcon size={16} />
          Add transaction
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-3">
        <label className="flex min-w-56 flex-1 items-center gap-2 rounded-full bg-(--surface-muted) px-3 py-2 text-sm">
          <SearchIcon size={16} className="text-(--ink-muted)" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleFilterChange(() => setQuery(e.target.value))}
            placeholder="Search by description or category"
            className="w-full bg-transparent outline-none placeholder:text-(--ink-muted)"
          />
        </label>

        <div className="flex gap-1 rounded-full bg-(--surface-muted) p-1 text-xs font-medium">
          {(["all", "income", "expense"] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleFilterChange(() => setTypeFilter(option))}
              className={`rounded-full px-3 py-1.5 capitalize transition-colors ${
                typeFilter === option
                  ? "bg-(--brand-600) text-white"
                  : "text-(--ink-secondary) hover:bg-(--chart-grid)"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 rounded-full border border-(--chart-grid) px-3 py-2 text-xs font-semibold text-(--ink-secondary) hover:bg-(--surface-muted) disabled:opacity-50"
        >
          <DownloadIcon size={14} />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-(--chart-grid) bg-(--surface-card)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-(--chart-grid) text-xs text-(--ink-muted)">
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Only show the loading row on the very first fetch — a
                  refetch (e.g. right after a delete) keeps showing the
                  previous rows underneath instead of flashing a loading
                  state over data that's still perfectly valid. */}
              {isLoading && transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-(--ink-muted)">
                    Loading transactions…
                  </td>
                </tr>
              )}
              {!isLoading && pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-(--ink-muted)">
                    {transactions.length === 0
                      ? "No transactions yet — add your first one."
                      : "No transactions match your filters."}
                  </td>
                </tr>
              )}
              {pageItems.map((t) => (
                <tr key={t.id} className="border-b border-(--chart-grid) last:border-0">
                  <td className="px-4 py-3 font-medium text-(--ink-primary)">
                    {t.description}
                  </td>
                  <td className="px-4 py-3 text-(--ink-secondary)">{t.category}</td>
                  <td className="px-4 py-3 text-(--ink-secondary)">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-(--ink-primary)">
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        t.type === "income"
                          ? "bg-(--status-good)/15 text-(--status-good)"
                          : "bg-(--status-critical)/15 text-(--status-critical)"
                      }`}
                    >
                      {t.type === "income" ? "Income" : "Expense"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      aria-label={`Delete ${t.description}`}
                      className="rounded-md p-1.5 text-(--ink-muted) transition-colors hover:bg-(--status-critical)/10 hover:text-(--status-critical) disabled:opacity-50"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-(--chart-grid) px-4 py-3 text-xs text-(--ink-muted)">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md px-2.5 py-1 font-medium hover:bg-(--surface-muted) disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-6 w-6 rounded-full font-semibold ${
                    p === currentPage
                      ? "bg-(--brand-600) text-white"
                      : "hover:bg-(--surface-muted)"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="rounded-md px-2.5 py-1 font-medium hover:bg-(--surface-muted) disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Quotes a CSV field only when it needs it (contains a comma, quote, or
 *  newline) — keeps plain fields readable and avoids over-escaping. */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCSV(transactions: Transaction[]) {
  const header = ["Date", "Description", "Category", "Type", "Amount"];
  const rows = transactions.map((t) => [
    t.date.slice(0, 10),
    t.description,
    t.category,
    t.type,
    t.amount.toFixed(2),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
