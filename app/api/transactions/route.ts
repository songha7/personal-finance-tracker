import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/transactions — list the logged-in user's transactions, newest first.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return Response.json(transactions);
}

// POST /api/transactions — create one transaction, owned by whoever's logged in.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const { description, category, type, amount, date } = body;

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
    data: {
      description,
      category,
      type,
      amount,
      // `date` is optional from the client — falls back to "now" via the
      // schema's @default(now()) if not provided.
      ...(date ? { date: new Date(date) } : {}),
      userId: session.user.id,
    },
  });

  return Response.json(transaction, { status: 201 });
}
