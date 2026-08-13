"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/lib/transactions-context";

const Inputs = () => {
  const { addTransaction } = useTransactions();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    const parsedAmount = Number(amount);
    const isValid =
      description.trim() &&
      category.trim() &&
      Number.isFinite(parsedAmount) &&
      parsedAmount > 0;

    if (!isValid) return; // simple guard, no error UI yet

    addTransaction({
      description,
      category,
      type,
      amount: parsedAmount,
      date: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
    });

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

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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

        <button
          type="submit"
          className="mt-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
        >
          Save transaction
        </button>
      </form>
    </div>
  );
};

export default Inputs;
