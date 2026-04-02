import { Router, type IRouter } from "express";
import { db, listingsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, desc, asc, ilike, or, sql } from "drizzle-orm";
import {
  CreateListingBody,
  UpdateListingBody,
  GetListingParams,
  UpdateListingParams,
  DeleteListingParams,
  GetListingsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function formatListing(listing: {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerSchool: string;
  pointsAmount: number;
  pricePerPoint: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const pricePerPoint = parseFloat(listing.pricePerPoint);
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    sellerSchool: listing.sellerSchool,
    pointsAmount: listing.pointsAmount,
    pricePerPoint,
    totalPrice: Math.round(listing.pointsAmount * pricePerPoint * 100) / 100,
    description: listing.description,
    status: listing.status,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };
}

router.get("/listings/stats", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalActiveListings: sql<number>`count(*) filter (where ${listingsTable.status} = 'active')`,
      totalPointsAvailable: sql<number>`coalesce(sum(${listingsTable.pointsAmount}) filter (where ${listingsTable.status} = 'active'), 0)`,
      avgPricePerPoint: sql<number>`coalesce(avg(${listingsTable.pricePerPoint}) filter (where ${listingsTable.status} = 'active'), 0)`,
      totalTransactions: sql<number>`count(*) filter (where ${listingsTable.status} = 'sold')`,
    })
    .from(listingsTable);

  const schoolCount = await db.selectDistinct({ school: usersTable.school }).from(usersTable);

  res.json({
    totalActiveListings: Number(stats.totalActiveListings),
    totalPointsAvailable: Number(stats.totalPointsAvailable),
    avgPricePerPoint: Math.round(Number(stats.avgPricePerPoint) * 1000) / 1000,
    totalTransactions: Number(stats.totalTransactions),
    totalSchools: schoolCount.length,
  });
});

router.get("/listings/my", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db
    .select({
      id: listingsTable.id,
      sellerId: listingsTable.sellerId,
      sellerName: usersTable.name,
      sellerSchool: usersTable.school,
      pointsAmount: listingsTable.pointsAmount,
      pricePerPoint: listingsTable.pricePerPoint,
      description: listingsTable.description,
      status: listingsTable.status,
      createdAt: listingsTable.createdAt,
      updatedAt: listingsTable.updatedAt,
    })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(eq(listingsTable.sellerId, req.userId!))
    .orderBy(desc(listingsTable.createdAt));

  res.json(rows.map(formatListing));
});

router.get("/listings", async (req, res): Promise<void> => {
  const qParams = GetListingsQueryParams.safeParse(req.query);
  const params = qParams.success ? qParams.data : {};

  const conditions = [eq(listingsTable.status, "active")];

  if (params.minPrice != null) {
    conditions.push(gte(sql`(${listingsTable.pricePerPoint})::numeric`, params.minPrice));
  }
  if (params.maxPrice != null) {
    conditions.push(lte(sql`(${listingsTable.pricePerPoint})::numeric`, params.maxPrice));
  }
  if (params.search) {
    conditions.push(
      or(
        ilike(usersTable.name, `%${params.search}%`),
        ilike(usersTable.school, `%${params.search}%`),
        ilike(listingsTable.description, `%${params.search}%`)
      )!
    );
  }

  let orderBy;
  switch (params.sortBy) {
    case "price_asc":
      orderBy = asc(listingsTable.pricePerPoint);
      break;
    case "price_desc":
      orderBy = desc(listingsTable.pricePerPoint);
      break;
    case "points_asc":
      orderBy = asc(listingsTable.pointsAmount);
      break;
    case "points_desc":
      orderBy = desc(listingsTable.pointsAmount);
      break;
    default:
      orderBy = desc(listingsTable.createdAt);
  }

  const rows = await db
    .select({
      id: listingsTable.id,
      sellerId: listingsTable.sellerId,
      sellerName: usersTable.name,
      sellerSchool: usersTable.school,
      pointsAmount: listingsTable.pointsAmount,
      pricePerPoint: listingsTable.pricePerPoint,
      description: listingsTable.description,
      status: listingsTable.status,
      createdAt: listingsTable.createdAt,
      updatedAt: listingsTable.updatedAt,
    })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(and(...conditions))
    .orderBy(orderBy);

  res.json(rows.map(formatListing));
});

router.post("/listings", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [listing] = await db
    .insert(listingsTable)
    .values({
      sellerId: req.userId!,
      pointsAmount: parsed.data.pointsAmount,
      pricePerPoint: String(parsed.data.pricePerPoint),
      description: parsed.data.description ?? null,
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  res.status(201).json(formatListing({ ...listing, sellerName: user.name, sellerSchool: user.school }));
});

router.get("/listings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [row] = await db
    .select({
      id: listingsTable.id,
      sellerId: listingsTable.sellerId,
      sellerName: usersTable.name,
      sellerSchool: usersTable.school,
      pointsAmount: listingsTable.pointsAmount,
      pricePerPoint: listingsTable.pricePerPoint,
      description: listingsTable.description,
      status: listingsTable.status,
      createdAt: listingsTable.createdAt,
      updatedAt: listingsTable.updatedAt,
    })
    .from(listingsTable)
    .innerJoin(usersTable, eq(listingsTable.sellerId, usersTable.id))
    .where(eq(listingsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json(formatListing(row));
});

router.patch("/listings/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (existing.sellerId !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.pointsAmount != null) updateData.pointsAmount = parsed.data.pointsAmount;
  if (parsed.data.pricePerPoint != null) updateData.pricePerPoint = String(parsed.data.pricePerPoint);
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.status != null) updateData.status = parsed.data.status;

  const [updated] = await db
    .update(listingsTable)
    .set(updateData)
    .where(eq(listingsTable.id, id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.sellerId));
  res.json(formatListing({ ...updated, sellerName: user.name, sellerSchool: user.school }));
});

router.delete("/listings/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (existing.sellerId !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ success: true });
});

export default router;
