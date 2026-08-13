import { prisma } from "@/lib/prisma";

// GET /api/transactions — list every transaction, newest first.
export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });

  return Response.json(transactions);
}

// POST /api/transactions — create one transaction from a JSON body.
export async function POST(request: Request) {
  const body = await request.json();
  const { description, category, type, amount } = body;

  const isValid =
    typeof description === "string" &&
    description.trim().length > 0 &&
    typeof category === "string" &&
    category.trim().length > 0 &&
    (type === "income" || type === "expense") &&
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount > 0;

  if (!isValid) {
    return Response.json({ error: "Invalid transaction data" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: { description, category, type, amount },
  });

  return Response.json(transaction, { status: 201 });
}
