import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Every brand-new user starts with these category limits. They're only a
// seed — once written, a user's rows live in the `category_budget` table
// and can diverge from this list without touching code.
const DEFAULT_CATEGORY_BUDGETS = [
  { category: "Motor", limit: 100 },
  { category: "Eating", limit: 150 },
  { category: "Repair", limit: 80 },
  { category: "Accessory", limit: 50 },
];

// GET /api/budgets — list the logged-in user's category budgets, seeding
// the defaults above the first time a user has none yet.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  let budgets = await prisma.categoryBudget.findMany({
    where: { userId: session.user.id },
    orderBy: { category: "asc" },
  });

  if (budgets.length === 0) {
    await prisma.categoryBudget.createMany({
      data: DEFAULT_CATEGORY_BUDGETS.map((b) => ({
        ...b,
        userId: session.user.id,
      })),
    });
    budgets = await prisma.categoryBudget.findMany({
      where: { userId: session.user.id },
      orderBy: { category: "asc" },
    });
  }

  return Response.json(budgets);
}

// POST /api/budgets — create or update the limit for one category, owned
// by whoever's logged in. Upsert on the (userId, category) unique pair, so
// posting the same category twice edits it instead of duplicating it.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const { category, limit } = body;

  const isValid =
    typeof category === "string" &&
    category.trim().length > 0 &&
    typeof limit === "number" &&
    Number.isFinite(limit) &&
    limit > 0;

  if (!isValid) {
    return Response.json({ error: "Invalid budget data" }, { status: 400 });
  }

  const budget = await prisma.categoryBudget.upsert({
    where: { userId_category: { userId: session.user.id, category } },
    update: { limit },
    create: { category, limit, userId: session.user.id },
  });

  return Response.json(budget, { status: 201 });
}
