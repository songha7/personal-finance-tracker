"use client";

// Shared data-fetching hooks.
//
// Every page that needs the logged-in user's transactions or category
// budgets used to repeat the same four lines: fetch, redirect to /login on
// 401, otherwise setState with the JSON body. Centralizing that here means
// there's exactly one place that knows how "fetch my data" behaves — add a
// loading spinner or change the redirect once, and every page that uses
// these hooks picks it up.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoryBudget, Transaction } from "./types";

type FetchState<T> = {
  data: T;
  isLoading: boolean;
  /** Re-runs the fetch — handy right after a mutation (add/delete) so the
   *  list reflects the change without a full page reload. */
  refetch: () => void;
};

// The one bit of behavior every one of these hooks shares: GET the URL,
// bounce to /login on 401, otherwise hand back the parsed JSON.
function useAuthedFetch<T>(url: string, fallback: T): FetchState<T> {
  const router = useRouter();
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [refetchCount, setRefetchCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((body) => {
        if (!cancelled && body) setData(body);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `refetchCount` is the deliberate re-run trigger `refetch()` bumps.
  }, [url, refetchCount, router]);

  // `isLoading` flips back to true here (an event handler, not inside the
  // effect body) so a manual refetch shows a loading state too, not just
  // the initial mount.
  const refetch = useCallback(() => {
    setIsLoading(true);
    setRefetchCount((n) => n + 1);
  }, []);

  return { data, isLoading, refetch };
}

export function useTransactions(): FetchState<Transaction[]> {
  return useAuthedFetch<Transaction[]>("/api/transactions", []);
}

export function useCategoryBudgets(): FetchState<CategoryBudget[]> {
  return useAuthedFetch<CategoryBudget[]>("/api/budgets", []);
}
