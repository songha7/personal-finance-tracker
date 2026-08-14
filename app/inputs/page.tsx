"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { mockCategoryBudgets } from "@/lib/mock-data";

const Inputs = () => {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(mockCategoryBudgets[0].category);
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
      category.trim() &&
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
        category,
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
    <div className="flex min-h-screen items-start justify-center bg-amber-200 p-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-white p-6 shadow"
      >
        <h1 className="mb-2 text-2xl font-display">Add transaction</h1>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {mockCategoryBudgets.map(({ category: name }) => (
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
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={type === "expense"}
              onChange={() => setType("expense")}
            />
            Expense
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={type === "income"}
              onChange={() => setType("income")}
            />
            Income
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save transaction"}
        </button>
      </form>
    </div>
  );
};

export default Inputs;
