"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { mockTransactions, type Transaction } from "./mock-data";

// A new transaction has everything except `id` — we generate that ourselves
// when it's added, so the caller never has to worry about uniqueness.
type NewTransaction = Omit<Transaction, "id">;

type TransactionsContextValue = {
  transactions: Transaction[];
  addTransaction: (transaction: NewTransaction) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(
  null
);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  // Seeded with the mock data so existing pages keep working as before;
  // everything added after this just lives in memory on top of it.
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const addTransaction = (transaction: NewTransaction) => {
    const withId: Transaction = { ...transaction, id: crypto.randomUUID() };
    // Prepend so the newest transaction shows up first.
    setTransactions((prev) => [withId, ...prev]);
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionsContext.Provider>
  );
}

// A small wrapper hook instead of exporting useContext(TransactionsContext)
// directly — it throws a clear error if you forget to render the provider,
// instead of every page having to null-check the context by hand.
export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error(
      "useTransactions must be used inside a <TransactionsProvider>"
    );
  }
  return context;
}
