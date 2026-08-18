"use client";

// Monthly income/expense/net summary — grouped straight from the same
// transaction list every other page uses. This used to be a one-line
// placeholder; there wasn't a mock-data equivalent to fall back on, so
// this is a genuinely new feature rather than a restyle of an old one.

import { useMemo } from "react";
import { useTransactions } from "@/lib/hooks";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import type { Transaction } from "@/lib/types";

type MonthlySummary = {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

function summarizeByMonth(transactions: Transaction[]): MonthlySummary[] {
  const totals = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const key = monthKey(t.date);
    const entry = totals.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") entry.income += t.amount;
    else entry.expense += t.amount;
    totals.set(key, entry);
  }

  return [...totals.entries()]
    .map(([key, { income, expense }]) => ({
      key,
      label: monthLabel(key),
      income,
      expense,
      net: income - expense,
    }))
    .sort((a, b) => b.key.localeCompare(a.key)); // most recent month first
}

const ReportsPage = () => {
  const { data: transactions, isLoading } = useTransactions();
  const summaries = useMemo(() => summarizeByMonth(transactions), [transactions]);
  const maxMagnitude = Math.max(...summaries.map((s) => Math.max(s.income, s.expense)), 1);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--ink-primary)">Reports</h1>
        <p className="text-sm text-(--ink-muted)">Income, expenses, and net by month</p>
      </div>

      {isLoading && <p className="text-sm text-(--ink-muted)">Loading…</p>}

      {!isLoading && summaries.length === 0 && (
        <p className="text-sm text-(--ink-muted)">
          No transactions yet — reports will build up as you add them.
        </p>
      )}

      {summaries.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-(--chart-grid) bg-(--surface-card)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-(--chart-grid) text-xs text-(--ink-muted)">
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium">Income vs. expense</th>
                  <th className="px-4 py-3 font-medium">Income</th>
                  <th className="px-4 py-3 font-medium">Expense</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.key} className="border-b border-(--chart-grid) last:border-0">
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-(--ink-primary)">
                      {s.label}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex w-40 flex-col gap-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--surface-muted)">
                          <div
                            className="h-full rounded-full bg-(--status-good)"
                            style={{ width: `${(s.income / maxMagnitude) * 100}%` }}
                          />
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-(--surface-muted)">
                          <div
                            className="h-full rounded-full bg-(--status-critical)"
                            style={{ width: `${(s.expense / maxMagnitude) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-(--status-good)">
                      +{formatCurrency(s.income)}
                    </td>
                    <td className="px-4 py-3 text-(--status-critical)">
                      -{formatCurrency(s.expense)}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        s.net >= 0 ? "text-(--ink-primary)" : "text-(--status-critical)"
                      }`}
                    >
                      {formatCurrency(s.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
