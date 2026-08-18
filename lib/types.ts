// Shared shapes for data as it travels over JSON between the API routes
// (backed by Prisma/Postgres — see prisma/schema.prisma) and the client
// components. These mirror the DB models but with `date` as a string,
// since that's what actually comes back from `res.json()` — JSON has no
// native Date type, so Prisma's `DateTime` is serialized to an ISO string.

export type Transaction = {
  id: string;
  date: string; // ISO format, e.g. "2026-08-01T00:00:00.000Z"
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number; // always positive; `type` tells you the sign
};

export type CategoryBudget = {
  id: string;
  category: string;
  limit: number;
};
