import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable, usersTable, listingsTable } from "@workspace/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { SendMessageBody, StartConversationBody, GetMessagesParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/messages", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const convs = await db
    .select({
      id: conversationsTable.id,
      listingId: conversationsTable.listingId,
      buyerId: conversationsTable.buyerId,
      sellerId: conversationsTable.sellerId,
      createdAt: conversationsTable.createdAt,
    })
    .from(conversationsTable)
    .where(or(eq(conversationsTable.buyerId, userId), eq(conversationsTable.sellerId, userId)))
    .orderBy(desc(conversationsTable.createdAt));

  const result = await Promise.all(
    convs.map(async (conv) => {
      const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, conv.buyerId));
      const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, conv.sellerId));
      const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, conv.listingId));
      const lastMsg = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      const [unreadCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conv.id),
            sql`${messagesTable.senderId} != ${userId}`,
            sql`${messagesTable.readAt} is null`
          )
        );
      return {
        id: conv.id,
        listingId: conv.listingId,
        listingPointsAmount: listing?.pointsAmount ?? 0,
        listingTotalPrice: listing
          ? Math.round(listing.pointsAmount * parseFloat(listing.pricePerPoint) * 100) / 100
          : 0,
        listingStatus: listing?.status ?? "unknown",
        buyerId: conv.buyerId,
        buyerName: buyer?.name ?? "Unknown",
        sellerId: conv.sellerId,
        sellerName: seller?.name ?? "Unknown",
        lastMessage: lastMsg[0]?.content ?? null,
        lastMessageAt: lastMsg[0]?.createdAt?.toISOString() ?? null,
        unreadCount: Number(unreadCountResult?.count ?? 0),
        createdAt: conv.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.post("/messages/start", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = StartConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { listingId, initialMessage } = parsed.data;
  const buyerId = req.userId!;

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (listing.sellerId === buyerId) {
    res.status(400).json({ error: "Cannot start conversation with yourself" });
    return;
  }

  const existingConvs = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.listingId, listingId), eq(conversationsTable.buyerId, buyerId)));

  let conv = existingConvs[0];
  if (!conv) {
    const [newConv] = await db
      .insert(conversationsTable)
      .values({ listingId, buyerId, sellerId: listing.sellerId })
      .returning();
    conv = newConv;
  }

  await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderId: buyerId,
    content: initialMessage,
  });

  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, buyerId));
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, listing.sellerId));

  res.status(201).json({
    id: conv.id,
    listingId: conv.listingId,
    listingPointsAmount: listing.pointsAmount,
    listingTotalPrice: Math.round(listing.pointsAmount * parseFloat(listing.pricePerPoint) * 100) / 100,
    listingStatus: listing.status,
    buyerId: conv.buyerId,
    buyerName: buyer?.name ?? "Unknown",
    sellerId: conv.sellerId,
    sellerName: seller?.name ?? "Unknown",
    lastMessage: initialMessage,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/messages/:conversationId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
  const conversationId = parseInt(rawId, 10);
  if (isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conv.buyerId !== req.userId && conv.sellerId !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db
    .update(messagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messagesTable.conversationId, conversationId),
        sql`${messagesTable.senderId} != ${req.userId}`,
        sql`${messagesTable.readAt} is null`
      )
    );

  const msgs = await db
    .select({
      id: messagesTable.id,
      conversationId: messagesTable.conversationId,
      senderId: messagesTable.senderId,
      content: messagesTable.content,
      readAt: messagesTable.readAt,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt);

  const senderIds = [...new Set(msgs.map((m) => m.senderId))];
  const senders = await Promise.all(
    senderIds.map((id) => db.select().from(usersTable).where(eq(usersTable.id, id)).then(([u]) => u))
  );
  const senderMap = Object.fromEntries(senders.filter(Boolean).map((u) => [u!.id, u!.name]));

  res.json(
    msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: senderMap[m.senderId] ?? "Unknown",
      content: m.content,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/messages/:conversationId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
  const conversationId = parseInt(rawId, 10);
  if (isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conv.buyerId !== req.userId && conv.sellerId !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ conversationId, senderId: req.userId!, content: parsed.data.content })
    .returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: sender?.name ?? "Unknown",
    content: msg.content,
    readAt: msg.readAt?.toISOString() ?? null,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
