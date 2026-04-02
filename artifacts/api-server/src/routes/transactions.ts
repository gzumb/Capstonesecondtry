import { Router, type IRouter } from "express";
import { db, transactionsTable, usersTable, listingsTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";
import { CreateTransactionBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const txns = await db
    .select()
    .from(transactionsTable)
    .where(or(eq(transactionsTable.buyerId, userId), eq(transactionsTable.sellerId, userId)))
    .orderBy(desc(transactionsTable.createdAt));

  const result = await Promise.all(
    txns.map(async (t) => {
      const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, t.buyerId));
      const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, t.sellerId));
      return {
        id: t.id,
        listingId: t.listingId,
        buyerId: t.buyerId,
        buyerName: buyer?.name ?? "Unknown",
        sellerId: t.sellerId,
        sellerName: seller?.name ?? "Unknown",
        pointsAmount: t.pointsAmount,
        totalPrice: parseFloat(t.totalPrice),
        role: t.buyerId === userId ? "buyer" : "seller",
        createdAt: t.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/transactions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { listingId, buyerId } = parsed.data;

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (listing.sellerId !== req.userId) {
    res.status(403).json({ error: "Only the seller can confirm a transaction" });
    return;
  }

  const totalPrice = Math.round(listing.pointsAmount * parseFloat(listing.pricePerPoint) * 100) / 100;

  const [txn] = await db
    .insert(transactionsTable)
    .values({
      listingId,
      buyerId,
      sellerId: listing.sellerId,
      pointsAmount: listing.pointsAmount,
      totalPrice: String(totalPrice),
    })
    .returning();

  await db.update(listingsTable).set({ status: "sold" }).where(eq(listingsTable.id, listingId));

  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, buyerId));
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, listing.sellerId));

  res.status(201).json({
    id: txn.id,
    listingId: txn.listingId,
    buyerId: txn.buyerId,
    buyerName: buyer?.name ?? "Unknown",
    sellerId: txn.sellerId,
    sellerName: seller?.name ?? "Unknown",
    pointsAmount: txn.pointsAmount,
    totalPrice: parseFloat(txn.totalPrice),
    role: "seller",
    createdAt: txn.createdAt.toISOString(),
  });
});

export default router;
