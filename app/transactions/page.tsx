"use client";
import type { Transaction } from "@/lib/mock-data";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const Transactions = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    fetch('/api/transactions')
    .then((res) => {
      if (res.status === 401) {
        router.push('/login');
        return null;
      }
      return res.json();
    })
    .then((data) => {
      if (data) setTransactions(data);
    })
  }, [router]);


  return (
    <div className="p-6">
      <h1 className="mb-4 text-4xl font-display">Transactions</h1>

      <div className="flex flex-col gap-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-zinc-500">
                {transaction.category} · {transaction.date}
              </p>
            </div>

            <p
              className={
                transaction.type === "income"
                  ? "font-semibold text-green-600"
                  : "font-semibold text-red-500"
              }
            >
              {transaction.type === "income" ? "+" : "-"}$
              {transaction.amount.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
