"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useCategoryBudgets } from "@/lib/hooks";

const Inputs = () => {
  const router = useRouter();

  // Categories used to come from a hardcoded mockCategoryBudgets array.
  // Now they're per-user rows in the category_budget table, fetched
  // through the same shared hook the Budgets and Topbar components use.
  const { data: categoryBudgets } = useCategoryBudgets();

  const [description, setDescription] = useState("");
  // "" means "no explicit choice yet" — falls back to the first fetched
  // category below. Derived at render time rather than synced via a
  // separate effect, so there's no extra render just to catch up.
  const [category, setCategory] = useState("");
  const selectedCategory = category || categoryBudgets[0]?.category || "";
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  // Defaults to today, but is now a real editable field like every other
  // column on the Transaction table — not silently hardcoded anymore.
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    const isValid =
      description.trim() &&
      selectedCategory.trim() &&
      date.trim() &&
      Number.isFinite(parsedAmount) &&
      parsedAmount > 0;

    if (!isValid) return; // simple guard, no error UI yet

    setIsSubmitting(true);

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        category: selectedCategory,
        type,
        amount: parsedAmount,
        date,
      }),
    });

    setIsSubmitting(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError("Couldn't save that transaction. Try again.");
      return;
    }

    router.push("/transactions");
  };

  return (
    <div className="flex min-h-full items-start justify-center bg-(--surface-muted) p-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-(--chart-grid) bg-(--surface-card) p-6 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-semibold text-(--ink-primary)">
          Add transaction
        </h1>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-(--chart-grid) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-500)"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-(--chart-grid) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-500)"
        >
          {categoryBudgets.map(({ category: name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-md border border-(--chart-grid) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-500)"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-(--chart-grid) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-500)"
        />

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={type === "expense"}
              onChange={() => setType("expense")}
              className="accent-(--brand-600)"
            />
            Expense
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={type === "income"}
              onChange={() => setType("income")}
              className="accent-(--brand-600)"
            />
            Income
          </label>
        </div>

        {error && <p className="text-sm text-(--status-critical)">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-(--brand-600) px-3 py-2 text-sm font-medium text-white hover:bg-(--brand-700) disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save transaction"}
        </button>
      </form>
    </div>
  );
};

export default Inputs;
