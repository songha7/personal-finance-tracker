"use client";

import { useState } from "react";
import { mockTransactions, mockCategoryBudgets } from "@/lib/mock-data";

const DEFAULT_LIMIT = 1000;

function spentOnCategory(category: string) {
  return mockTransactions
    .filter((t) => t.type === "expense" && t.category === category)
    .reduce((total, t) => total + t.amount, 0);
}

const Budgets = () => {
  // --- Overall monthly limit (editable) ---
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLimit, setDraftLimit] = useState(String(DEFAULT_LIMIT));

  const spent = mockTransactions
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
  const totalIncome = mockTransactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + t.amount, 0);

  const totalExpense = spent;

  const expenseCategories = Array.from(
    new Set(
      mockTransactions
        .filter((t) => t.type === "expense")
        .map((t) => t.category)
    )
  );
  const categorySpend = expenseCategories.map((category) => ({
    category,
    amount: spentOnCategory(category),
  }));
  const maxCategorySpend = Math.max(...categorySpend.map((c) => c.amount), 1);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-4xl font-display">Budgets</h1>

      <div className="grid grid-cols-6 gap-4">
        {/* 1: overall monthly limit — spans 2 columns */}
        <div className="col-span-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500">
              Monthly spend
            </p>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  autoFocus
                  value={draftLimit}
                  onChange={(e) => setDraftLimit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="w-16 rounded-md border border-zinc-300 px-1 py-0.5 text-right text-xs dark:border-zinc-700 dark:bg-black"
                />
                <button
                  onClick={handleSave}
                  className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
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
                className="text-xs font-medium text-zinc-500 underline decoration-dotted underline-offset-4"
              >
                Edit
              </button>
            )}
          </div>
          <p className="text-2xl font-semibold">
            ${spent.toFixed(2)}{" "}
            <span className="text-sm font-normal text-zinc-500">
              / ${limit.toFixed(2)}
            </span>
          </p>
          <p
            className={`mt-1 text-xs ${
              isOverBudget ? "text-red-500" : "text-zinc-500"
            }`}
          >
            {isOverBudget
              ? `Over by $${(spent - limit).toFixed(2)}`
              : `$${(limit - spent).toFixed(2)} left`}
          </p>
        </div>

        {/* 2, 6, 3, 7: per-category mini cards — one grid cell each */}
        {mockCategoryBudgets.map(({ category, limit: categoryLimit }) => {
          const categorySpent = spentOnCategory(category);
          const over = categorySpent > categoryLimit;
          return (
            <div
              key={category}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="text-sm font-medium text-zinc-500">{category}</p>
              <p className="mt-1 text-lg font-semibold">
                ${categorySpent.toFixed(2)}
              </p>
              <p className={`text-xs ${over ? "text-red-500" : "text-zinc-500"}`}>
                of ${categoryLimit.toFixed(2)}
              </p>
            </div>
          );
        })}

        {/* 4: analytics — spans 4 columns, 2 rows */}
        <div className="col-span-4 row-span-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-3 text-sm font-medium text-zinc-500">
            Spend by category
          </p>
          <div className="flex flex-col gap-3">
            {categorySpend.map(({ category, amount }) => (
              <div key={category} className="flex items-center gap-3">
                <p className="w-24 shrink-0 text-sm">{category}</p>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(amount / maxCategorySpend) * 100}%` }}
                  />
                </div>
                <p className="w-16 shrink-0 text-right text-sm">
                  ${amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5: in/out — spans 2 columns, 2 rows */}
        <div className="col-span-2 row-span-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-3 text-sm font-medium text-zinc-500">In / Out</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-zinc-500">Income</p>
              <p className="text-xl font-semibold text-emerald-500">
                +${totalIncome.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Expense</p>
              <p className="text-xl font-semibold text-red-500">
                -${totalExpense.toFixed(2)}
              </p>
            </div>
            <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Net</p>
              <p className="text-xl font-semibold">
                ${(totalIncome - totalExpense).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets;
