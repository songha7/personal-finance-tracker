"use client";

// The dashboard. Every number on this page is computed client-side from
// the same `/api/transactions` data the Transactions and Budgets pages
// already use — nothing here is mocked. See the helper functions below
// the component for how each metric/chart series is derived.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTransactions } from "@/lib/hooks";
import { formatCurrency, relativeTime } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { StatCard } from "./components/stat-card";
import { AreaChart, type AreaChartPoint } from "./components/charts/area-chart";
import { DonutChart, type DonutSegment } from "./components/charts/donut-chart";
import { AddIcon, TrashIcon } from "./components/icons";

const RANGE_OPTIONS = [
  { key: "7D", label: "7D", days: 7 },
  { key: "1M", label: "1M", days: 30 },
  { key: "3M", label: "3M", days: 90 },
  { key: "6M", label: "6M", days: 180 },
  { key: "1Y", label: "1Y", days: 365 },
  { key: "ALL", label: "Max", days: null as number | null },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

const cardClass = "rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-5";

export default function Dashboard() {
  const { data: transactions, isLoading, refetch } = useTransactions();
  const [range, setRange] = useState<RangeKey>("1M");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const rangeDays = useMemo(() => {
    const option = RANGE_OPTIONS.find((r) => r.key === range)!;
    if (option.days !== null) return option.days;
    // "Max" — span from the earliest transaction to today (min 1 day so
    // a single-transaction account still renders a chart).
    if (transactions.length === 0) return 30;
    const earliest = transactions.reduce(
      (min, t) => (t.date < min ? t.date : min),
      transactions[0].date
    );
    const days = Math.ceil(
      (Date.now() - new Date(earliest).getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.max(days + 1, 1);
  }, [range, transactions]);

  const balanceSeries = useMemo(
    () => buildBalanceSeries(transactions, rangeDays),
    [transactions, rangeDays]
  );

  const metrics = useMemo(() => computeMetrics(transactions), [transactions]);
  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(transactions),
    [transactions]
  );

  const recentActivity = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions]
  );
  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [transactions]
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    refetch();
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      {!isLoading && transactions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-(--brand-500)/40 bg-(--surface-muted) px-5 py-4 text-sm text-(--ink-secondary)">
          You haven&apos;t logged any transactions yet.{" "}
          <Link href="/inputs" className="font-semibold text-(--brand-600) underline">
            Add your first one
          </Link>{" "}
          to see your dashboard come to life.
        </div>
      )}

      {/* --- Stat tiles -------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total balance"
          value={formatCurrency(metrics.totalBalance)}
          deltaLabel={metrics.balanceDelta.label}
          deltaDirection={metrics.balanceDelta.direction}
          sparkline={balanceSeriesTail(transactions)}
          accent="var(--brand-gradient)"
        />
        <StatCard
          label="Income this month"
          value={formatCurrency(metrics.thisMonthIncome)}
          deltaLabel={metrics.incomeDelta.label}
          deltaDirection={metrics.incomeDelta.direction}
          isUpGood
          sparkline={buildDailyAmountSeries(transactions, 7, "income").map((p) => p.value)}
          accent="var(--status-good)"
        />
        <StatCard
          label="Expenses this month"
          value={formatCurrency(metrics.thisMonthExpense)}
          deltaLabel={metrics.expenseDelta.label}
          deltaDirection={metrics.expenseDelta.direction}
          isUpGood={false}
          sparkline={buildDailyAmountSeries(transactions, 7, "expense").map((p) => p.value)}
          accent="var(--status-critical)"
        />
        <StatCard
          label="Savings rate"
          value={`${metrics.savingsRate.toFixed(0)}%`}
          deltaLabel={metrics.savingsDelta.label}
          deltaDirection={metrics.savingsDelta.direction}
          isUpGood
          sparkline={buildDailyAmountSeries(transactions, 7, "net").map((p) => p.value)}
          accent="var(--data-orange)"
        />
      </div>

      {/* --- Wallet analytics + category breakdown ------------------------ */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`${cardClass} xl:col-span-2`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-(--ink-primary)">Wallet analytics</p>
              <p className="text-xs text-(--ink-muted)">Running balance from every recorded transaction</p>
            </div>
            <div className="flex gap-1 rounded-full bg-(--surface-muted) p-1 text-xs font-medium">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setRange(option.key)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    range === option.key
                      ? "bg-(--brand-600) text-white"
                      : "text-(--ink-secondary) hover:bg-(--chart-grid)"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <AreaChart
            data={balanceSeries}
            color="var(--data-blue)"
            valueFormatter={(v) => formatCurrency(v)}
          />
        </div>

        <div className={cardClass}>
          <p className="mb-1 font-semibold text-(--ink-primary)">Spending breakdown</p>
          <p className="mb-4 text-xs text-(--ink-muted)">Expenses by category, this month</p>
          <DonutChart segments={categoryBreakdown} valueFormatter={(v) => formatCurrency(v)} />
        </div>
      </div>

      {/* --- Recent activity + recent transactions ------------------------ */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className={`${cardClass} xl:col-span-2`}>
          <p className="mb-3 font-semibold text-(--ink-primary)">Recent activity</p>
          <ul className="flex flex-col gap-3">
            {recentActivity.length === 0 && (
              <li className="text-sm text-(--ink-muted)">Nothing yet.</li>
            )}
            {recentActivity.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    t.type === "income"
                      ? "bg-(--status-good)/15 text-(--status-good)"
                      : "bg-(--status-critical)/15 text-(--status-critical)"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-(--ink-primary)">
                    {t.description}
                  </p>
                  <p className="text-xs text-(--ink-muted)">{relativeTime(t.date)}</p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    t.type === "income" ? "text-(--status-good)" : "text-(--status-critical)"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${cardClass} xl:col-span-3`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-(--ink-primary)">Recent transactions</p>
              <p className="text-xs text-(--ink-muted)">Overview of the latest activity</p>
            </div>
            <Link
              href="/inputs"
              className="flex items-center gap-1.5 rounded-full bg-(--brand-600) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--brand-700)"
            >
              <AddIcon size={14} />
              Add
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-(--ink-muted)">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-(--ink-muted)">
                      No transactions yet.
                    </td>
                  </tr>
                )}
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="border-t border-(--chart-grid)">
                    <td className="py-2.5 pr-2 font-medium text-(--ink-primary)">
                      {t.description}
                    </td>
                    <td className="py-2.5 pr-2 text-(--ink-secondary)">{t.category}</td>
                    <td className="py-2.5 pr-2 text-(--ink-primary)">
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-2.5 pr-2">
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
                    <td className="py-2.5 text-right">
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

          <Link
            href="/transactions"
            className="mt-3 inline-block text-xs font-semibold text-(--brand-600) hover:underline"
          >
            View all transactions →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Derived data helpers
//
// None of these touch the DOM or React — they're pure functions over the
// `Transaction[]` the API returns, which makes them easy to reason about
// (and to unit test later, if this app grows a test suite).
// ---------------------------------------------------------------------------

function toDateKey(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function todayAt(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/**
 * Cumulative running balance (all income minus all expense, in date
 * order), windowed to the last `days` calendar days ending today. A day
 * with no transactions carries forward the previous day's balance instead
 * of dropping to zero — the line shows what your balance actually was,
 * not just what happened that specific day.
 */
function buildBalanceSeries(transactions: Transaction[], days: number): AreaChartPoint[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  const balanceByDay = new Map<string, number>();
  let running = 0;
  for (const t of sorted) {
    running += t.type === "income" ? t.amount : -t.amount;
    balanceByDay.set(toDateKey(t.date), running);
  }
  const sortedDayKeys = [...balanceByDay.keys()].sort();

  const points: AreaChartPoint[] = [];
  let carry = 0;
  let cursor = 0;

  for (let i = days - 1; i >= 0; i--) {
    const day = todayAt(i);
    const key = day.toISOString().slice(0, 10);

    while (cursor < sortedDayKeys.length && sortedDayKeys[cursor] <= key) {
      carry = balanceByDay.get(sortedDayKeys[cursor])!;
      cursor++;
    }

    points.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: carry,
    });
  }

  return points;
}

/** Just the last 7 points of the full-history balance trend — used for the
 *  "Total balance" stat tile's sparkline regardless of the main chart's
 *  selected range. */
function balanceSeriesTail(transactions: Transaction[]): number[] {
  return buildBalanceSeries(transactions, 7).map((p) => p.value);
}

/**
 * Per-day totals (not cumulative) for the last `days` days — income only,
 * expense only, or net (income minus expense). Used for the smaller stat
 * tile sparklines, where a short-term trend reads better than a running
 * total.
 */
function buildDailyAmountSeries(
  transactions: Transaction[],
  days: number,
  type: "income" | "expense" | "net"
): AreaChartPoint[] {
  const sumsByDay = new Map<string, number>();
  for (const t of transactions) {
    const key = toDateKey(t.date);
    const amount =
      type === "net"
        ? t.type === "income"
          ? t.amount
          : -t.amount
        : t.type === type
          ? t.amount
          : 0;
    if (amount === 0) continue;
    sumsByDay.set(key, (sumsByDay.get(key) ?? 0) + amount);
  }

  const points: AreaChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = todayAt(i);
    const key = day.toISOString().slice(0, 10);
    points.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: sumsByDay.get(key) ?? 0,
    });
  }
  return points;
}

type Delta = { label: string; direction: "up" | "down" | "flat" };

/** "+18% vs last month", with a sensible fallback when last month was $0
 *  (a percentage change from zero is undefined, not "+∞%"). */
function percentDelta(current: number, previous: number): Delta {
  if (previous === 0 && current === 0) return { label: "No activity yet", direction: "flat" };
  if (previous === 0) return { label: "New this month", direction: "up" };

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const direction = change > 0.5 ? "up" : change < -0.5 ? "down" : "flat";
  return { label: `${change > 0 ? "+" : ""}${change.toFixed(0)}% vs last month`, direction };
}

/** Percentage-*point* difference — used for the savings-rate tile, where a
 *  relative "% change of a %" would be confusing (28% -> 35% is "+7pp",
 *  not "+25%"). */
function pointDelta(current: number, previous: number): Delta {
  const diff = current - previous;
  const direction = diff > 0.5 ? "up" : diff < -0.5 ? "down" : "flat";
  return { label: `${diff > 0 ? "+" : ""}${diff.toFixed(0)}pp vs last month`, direction };
}

function computeMetrics(transactions: Transaction[]) {
  const now = new Date();
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const sumBy = (list: Transaction[], type: Transaction["type"]) =>
    list.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);

  const thisMonthTx = transactions.filter((t) => toDateKey(t.date).slice(0, 7) === thisKey);
  const lastMonthTx = transactions.filter((t) => toDateKey(t.date).slice(0, 7) === lastKey);

  const thisMonthIncome = sumBy(thisMonthTx, "income");
  const thisMonthExpense = sumBy(thisMonthTx, "expense");
  const lastMonthIncome = sumBy(lastMonthTx, "income");
  const lastMonthExpense = sumBy(lastMonthTx, "expense");

  const totalBalance = sumBy(transactions, "income") - sumBy(transactions, "expense");
  const netThisMonth = thisMonthIncome - thisMonthExpense;

  const savingsRate = thisMonthIncome > 0 ? (netThisMonth / thisMonthIncome) * 100 : 0;
  const lastSavingsRate =
    lastMonthIncome > 0 ? ((lastMonthIncome - lastMonthExpense) / lastMonthIncome) * 100 : 0;

  const balanceDirection = netThisMonth > 0.5 ? "up" : netThisMonth < -0.5 ? "down" : "flat";

  return {
    totalBalance,
    thisMonthIncome,
    thisMonthExpense,
    savingsRate,
    balanceDelta: {
      label: `${netThisMonth >= 0 ? "+" : "-"}${formatCurrency(Math.abs(netThisMonth))} this month`,
      direction: balanceDirection as Delta["direction"],
    },
    incomeDelta: percentDelta(thisMonthIncome, lastMonthIncome),
    expenseDelta: percentDelta(thisMonthExpense, lastMonthExpense),
    savingsDelta: pointDelta(savingsRate, lastSavingsRate),
  };
}

/** Top 3 expense categories this month, by amount, folded into a fourth
 *  "Other" slice — matches the dataviz rule that a categorical palette
 *  only validates its first three slots together; a 4th+ series folds
 *  into Other rather than adding another hue. */
function buildCategoryBreakdown(transactions: Transaction[]): DonutSegment[] {
  const now = new Date();
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (toDateKey(t.date).slice(0, 7) !== thisKey) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3);
  const restTotal = sorted.slice(3).reduce((sum, [, value]) => sum + value, 0);

  const palette = ["var(--data-blue)", "var(--data-orange)", "var(--data-aqua)"];
  const segments: DonutSegment[] = top.map(([label, value], i) => ({
    label,
    value,
    color: palette[i],
  }));

  if (restTotal > 0) {
    segments.push({ label: "Other", value: restTotal, color: "var(--chart-axis)" });
  }

  return segments;
}
