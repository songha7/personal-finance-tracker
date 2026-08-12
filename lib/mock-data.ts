export type Transaction = {
  id: string;
  date: string; // ISO format, e.g. "2026-08-01"
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number; // always positive; `type` tells you the sign
};

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-08-01",
    description: "Monthly salary",
    category: "Income",
    type: "income",
    amount: 3200,
  },
  {
    id: "2",
    date: "2026-08-02",
    description: "Grocery run",
    category: "Groceries",
    type: "expense",
    amount: 84.5,
  },
  {
    id: "3",
    date: "2026-08-04",
    description: "Electric bill",
    category: "Utilities",
    type: "expense",
    amount: 62.3,
  },
  {
    id: "4",
    date: "2026-08-06",
    description: "Coffee with a friend",
    category: "Dining",
    type: "expense",
    amount: 9.75,
  },
  {
    id: "5",
    date: "2026-08-09",
    description: "Freelance project",
    category: "Income",
    type: "income",
    amount: 450,
  },
  {
    id: "6",
    date: "2026-08-05",
    description: "Motor oil change",
    category: "Motor",
    type: "expense",
    amount: 45,
  },
  {
    id: "7",
    date: "2026-08-07",
    description: "Street food",
    category: "Eating",
    type: "expense",
    amount: 18.5,
  },
  {
    id: "8",
    date: "2026-08-08",
    description: "Brake pad replacement",
    category: "Repair",
    type: "expense",
    amount: 65,
  },
  {
    id: "9",
    date: "2026-08-10",
    description: "Phone case",
    category: "Accessory",
    type: "expense",
    amount: 22,
  },
];

// The limit each category is allowed to spend per month.
export const mockCategoryBudgets: { category: string; limit: number }[] = [
  { category: "Motor", limit: 100 },
  { category: "Eating", limit: 150 },
  { category: "Repair", limit: 80 },
  { category: "Accessory", limit: 50 },
];
