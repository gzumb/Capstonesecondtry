import { Router, type IRouter } from "express";
import { db, usersTable, listingsTable, transactionsTable } from "@workspace/db";
import { eq, or, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [listingCountResult] = await db
    .select({ count: count() })
    .from(listingsTable)
    .where(eq(listingsTable.sellerId, id));

  const [txnCountResult] = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(or(eq(transactionsTable.buyerId, id), eq(transactionsTable.sellerId, id)));

  res.json({
    id: user.id,
    name: user.name,
    school: user.school,
    listingCount: Number(listingCountResult?.count ?? 0),
    transactionCount: Number(txnCountResult?.count ?? 0),
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
