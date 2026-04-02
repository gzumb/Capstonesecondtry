# Workspace

## Overview

**Meal Market** — A peer-to-peer web marketplace where students buy and sell unused cafeteria meal points. Blue and white color scheme with yellow accents. Deployable with Supabase + GitHub (standard PostgreSQL, no Replit-specific dependencies).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth**: JWT (jsonwebtoken + bcryptjs) stored in localStorage

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, listings, messages, transactions, users)
│   └── meal-market/        # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── ...
```

## Database Schema

- `users` — id, email, password_hash, name, school, created_at
- `listings` — id, seller_id, points_amount, price_per_point, description, status, created_at, updated_at
- `conversations` — id, listing_id, buyer_id, seller_id, created_at
- `messages` — id, conversation_id, sender_id, content, read_at, created_at
- `transactions` — id, listing_id, buyer_id, seller_id, points_amount, total_price, created_at

## API Routes

- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login (returns JWT)
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — current user (auth required)
- `GET /api/listings` — browse listings (search, filter, sort)
- `GET /api/listings/stats` — marketplace stats
- `GET /api/listings/my` — seller's own listings (auth required)
- `POST /api/listings` — create listing (auth required)
- `GET /api/listings/:id` — listing detail
- `PATCH /api/listings/:id` — update listing (owner only)
- `DELETE /api/listings/:id` — delete listing (owner only)
- `GET /api/messages` — list conversations (auth required)
- `POST /api/messages/start` — start conversation about listing (auth required)
- `GET /api/messages/:conversationId` — get messages in conversation (auth required)
- `POST /api/messages/:conversationId` — send message (auth required)
- `GET /api/transactions` — transaction history (auth required)
- `POST /api/transactions` — confirm transaction/sale (seller only, auth required)
- `GET /api/users/:id` — public user profile

## Frontend Pages

- `/` — Home (hero + listings browse + stats)
- `/login` — Login
- `/register` — Register
- `/listings` — Browse listings with search/filter
- `/listings/:id` — Listing detail + contact seller
- `/listings/new` — Create listing (protected)
- `/my-listings` — Manage own listings (protected)
- `/messages` — Conversations list (protected)
- `/messages/:id` — Chat thread (protected)
- `/transactions` — Transaction history (protected)
- `/profile/:id` — Public user profile

## Deployment (Supabase + GitHub)

This app uses standard PostgreSQL — compatible with Supabase. To deploy:
1. Create a Supabase project and get the `DATABASE_URL` connection string
2. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
3. Run `pnpm --filter @workspace/db run push` to apply schema
4. Build the API: `pnpm --filter @workspace/api-server run build`
5. Build the frontend: `pnpm --filter @workspace/meal-market run build`
6. Serve the API with `node dist/index.mjs` and the frontend as static files

## Self-hosting Notes

- No Replit-specific dependencies in the production code
- Auth uses JWT (not session cookies) stored in localStorage
- Custom fetch in `lib/api-client-react/src/custom-fetch.ts` adds JWT header automatically
- The `@replit/vite-plugin-*` packages are dev-only and only load in Replit environment (`REPL_ID` check in vite.config.ts)
