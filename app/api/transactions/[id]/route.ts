import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/transactions/[id] — remove one transaction, but only the
// caller's own. `params` is a Promise in this Next.js version (route
// params are resolved async, same as `headers()` below), so it has to be
// awaited before the id is usable.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;

  // `deleteMany` (not `delete`) lets the ownership check ride along in the
  // same `where` as the id, as one atomic query — if the id exists but
  // belongs to someone else, this deletes zero rows instead of leaking
  // whether it exists via a Prisma "record not found" throw.
  const { count } = await prisma.transaction.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return Response.json({ error: "Transaction not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
