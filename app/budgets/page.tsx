"use client";

import { useState } from "react";
import { useCategoryBudgets, useTransactions } from "@/lib/hooks";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/types";

const DEFAULT_LIMIT = 1000;

function spentOnCategory(transactions: Transaction[], category: string) {
  return transactions
    .filter((t) => t.type === "expense" && t.category === category)
    .reduce((total, t) => total + t.amount, 0);
}

const Budgets = () => {
  // --- The logged-in user's real transactions and category limits, both
  //     fetched (and cached/redirected-on-401) through the shared hooks. ---
  const { data: transactions } = useTransactions();
  const { data: categoryBudgets } = useCategoryBudgets();

  // --- Overall monthly limit (editable, but only in this browser tab for
  //     now — there's no `overall_limit` column yet, unlike the per-
  //     category limits below which live in the category_budget table). ---
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLimit, setDraftLimit] = useState(String(DEFAULT_LIMIT));

  const spent = transactions
    .filter((t) => t.type === "expense")
    .reduce((total, t) => total + t.amount, 0);

  const isOverBudget = spent > limit;

  const handleSave = () => {
    const parsed = Number(draftLimit);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraftLimit(String(limit));
      setIsEditing(false);
      return;
    }
    setLimit(parsed);
    setIsEditing(false);
  };

  // --- Derived data for the analytics + in/out panels ---
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + t.amount, 0);

  const totalExpense = spent;

  const expenseCategories = Array.from(
    new Set(
      transactions.filter((t) => t.type === "expense").map((t) => t.category)
    )
  );
  const categorySpend = expenseCategories.map((category) => ({
    category,
    amount: spentOnCategory(transactions, category),
  }));
  const maxCategorySpend = Math.max(...categorySpend.map((c) => c.amount), 1);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-(--ink-primary)">Budgets</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* 1: overall monthly limit — spans 2 columns */}
        <div className="col-span-1 rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-4 sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-(--ink-muted)">Monthly spend</p>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  autoFocus
                  value={draftLimit}
                  onChange={(e) => setDraftLimit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-16 rounded-md border border-(--chart-grid) px-1 py-0.5 text-right text-xs"
                />
                <button
                  onClick={handleSave}
                  className="rounded-md bg-(--brand-600) px-2 py-0.5 text-xs font-medium text-white hover:bg-(--brand-700)"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDraftLimit(String(limit));
                  setIsEditing(true);
                }}
                className="text-xs font-medium text-(--ink-muted) underline decoration-dotted underline-offset-4"
              >
                Edit
              </button>
            )}
          </div>
          <p className="text-2xl font-semibold text-(--ink-primary)">
            {formatCurrency(spent)}{" "}
            <span className="text-sm font-normal text-(--ink-muted)">
              / {formatCurrency(limit)}
            </span>
          </p>
          <p
            className={`mt-1 text-xs ${
              isOverBudget ? "text-(--status-critical)" : "text-(--ink-muted)"
            }`}
          >
            {isOverBudget
              ? `Over by ${formatCurrency(spent - limit)}`
              : `${formatCurrency(limit - spent)} left`}
          </p>
        </div>

        {/* 2, 6, 3, 7: per-category mini cards — one grid cell each */}
        {categoryBudgets.map(({ category, limit: categoryLimit }) => {
          const categorySpent = spentOnCategory(transactions, category);
          const over = categorySpent > categoryLimit;
          return (
            <div
              key={category}
              className="rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-4"
            >
              <p className="text-sm font-medium text-(--ink-muted)">{category}</p>
              <p className="mt-1 text-lg font-semibold text-(--ink-primary)">
                {formatCurrency(categorySpent)}
              </p>
              <p
                className={`text-xs ${
                  over ? "text-(--status-critical)" : "text-(--ink-muted)"
                }`}
              >
                of {formatCurrency(categoryLimit)}
              </p>
            </div>
          );
        })}

        {/* 4: analytics — spans 4 columns, 2 rows */}
        <div className="col-span-1 rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-4 sm:col-span-2 lg:col-span-4 lg:row-span-2">
          <p className="mb-3 text-sm font-medium text-(--ink-muted)">Spend by category</p>
          <div className="flex flex-col gap-3">
            {categorySpend.length === 0 && (
              <p className="text-sm text-(--ink-muted)">No expenses recorded yet.</p>
            )}
            {categorySpend.map(({ category, amount }) => (
              <div key={category} className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm text-(--ink-secondary)">{category}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--surface-muted)">
                  <div
                    className="h-full rounded-full bg-(--data-blue)"
                    style={{ width: `${(amount / maxCategorySpend) * 100}%` }}
                  />
                </div>
                <p className="w-20 shrink-0 text-right text-sm text-(--ink-primary)">
                  {formatCurrency(amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5: in/out — spans 2 columns, 2 rows */}
        <div className="col-span-1 rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-4 sm:col-span-2 lg:row-span-2">
          <p className="mb-3 text-sm font-medium text-(--ink-muted)">In / Out</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-(--ink-muted)">Income</p>
              <p className="text-xl font-semibold text-(--status-good)">
                +{formatCurrency(totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-xs text-(--ink-muted)">Expense</p>
              <p className="text-xl font-semibold text-(--status-critical)">
                -{formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="border-t border-(--chart-grid) pt-2">
              <p className="text-xs text-(--ink-muted)">Net</p>
              <p className="text-xl font-semibold text-(--ink-primary)">
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
