# GemVault

Mobile-first web app for the One Piece TCG community.
Track your collection, sell at fixed prices or accept offers, and post buy requests for cards you want.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Validation | zod |
| Deploy | Vercel |

## What's done in this phase

- ✅ Project scaffold + Tailwind v4 setup
- ✅ Full Prisma schema (users, cards, collection, listings, offers, buy requests, messaging, moderation)
- ✅ Supabase auth: register, login, logout, callback, session middleware
- ✅ Mobile-first layout with sticky navbar + bottom tab bar
- ✅ Card catalog: search, filters (set / rarity / type / color), pagination
- ✅ Card detail page with active listings + buy requests preview
- ✅ Dashboard layout with sidebar
- ✅ Collection management: add, list, view, edit, delete, **switch sell mode**
- ✅ Three sell modes wired up: Collection only / Open to offers / Listed for sale
- ✅ "My listings" and "Open to offers" pages
- ✅ **Public marketplace** — browse fixed-price listings + open-to-offers, with full filters (set, rarity, type, color, condition, language, price, city)
- ✅ **Listing detail page** with seller card and contact button
- ✅ **Buy requests** — create, browse public, view detail, cancel
- ✅ **Matching engine** — buy requests see matching listings & offers; sellers see matching buy requests on their listings/offers/collection cards
- ✅ **Messaging** — contact buttons on listings/offers/buy requests, conversation list, thread view, unread indicators
- ⏳ Admin layer → Phase 10

---

## Setup steps for Jesson

> If anything below feels confusing, just say so and I'll walk you through whichever step is sticky.

### 1) Install Node.js dependencies

Open a terminal in the `Gemvault` folder and run:

```bash
npm install
```

This pulls down Next.js, Prisma, Tailwind, etc. (Takes ~1 minute the first time.)

### 2) Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier is fine).
2. Pick a region close to Malaysia (Singapore is good).
3. Save the database password somewhere safe — you'll need it next.

### 3) Copy the env file

In the `Gemvault` folder, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in the values from your Supabase project:

- **`NEXT_PUBLIC_SUPABASE_URL`** — Supabase dashboard → Project Settings → API → "Project URL"
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — same page → "anon public" key
- **`SUPABASE_SERVICE_ROLE_KEY`** — same page → "service_role" key (keep this secret!)
- **`DATABASE_URL`** — Supabase dashboard → Project Settings → Database → "Connection pooling" → "Transaction" mode → copy the URI. Replace `[YOUR-PASSWORD]` with the password you saved in step 2.
- **`DIRECT_URL`** — same page → "Direct connection" → copy the URI, replace `[YOUR-PASSWORD]`.

### 4) Push the schema to Supabase

This creates all the tables in your Supabase database:

```bash
npm run db:push
```

You should see Prisma confirm a bunch of tables created.

### 5) Seed some sample cards

```bash
npm run db:seed
```

This adds a few One Piece sets and 5 sample cards so the catalog isn't empty.

### 6) Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7) Disable email confirmation (for development)

In Supabase dashboard:
- Authentication → Providers → Email
- **Turn OFF** "Confirm email" while developing.
- (Turn it back on before going live.)

This way you can sign up and log in instantly without checking your inbox.

---

## Useful scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server on `localhost:3000` |
| `npm run build` | Production build |
| `npm run db:push` | Push the Prisma schema to Supabase (no migration files) |
| `npm run db:migrate` | Create + apply a proper migration (use this once we have real users) |
| `npm run db:studio` | Open Prisma Studio to browse data in your browser |
| `npm run db:seed` | Re-run the seed script (5 sample cards — only useful for fresh installs) |
| `npm run db:import` | Import the full One Piece TCG catalog (~4,200 cards across 50+ sets) from the [Punk Records](https://github.com/buhbbl/punk-records) community dataset. Safe to re-run any time — it'll pull new cards as the dataset is updated. |

## Folder layout

```
src/
├── app/
│   ├── (public)/         # Anyone can see — home, cards, marketplace
│   ├── (auth)/           # Login, register
│   ├── (dashboard)/      # Logged-in only — collection, listings, offers, messages
│   ├── auth/callback/    # Supabase OAuth callback
│   └── api/              # Future API routes
├── components/
│   ├── ui/               # Button, Input, Card, Badge — base primitives
│   ├── layout/           # Navbar, sidebar, container
│   └── cards/            # Card-specific UI
├── services/             # Business logic (cards, collection, etc.) — UI-free
├── lib/                  # db, supabase clients, auth helpers, utils
└── middleware.ts         # Refreshes Supabase session, gates protected routes
```

## What's next (in order)

1. **Phase 5 — Marketplace browse** — public listing search/filter UI, listing detail page.
2. **Phase 6 — Open-to-offers discovery** — make `OPEN_TO_OFFERS` cards searchable from the public side.
3. **Phase 7 — Buy requests** — create / manage / browse buy requests.
4. **Phase 8 — Matching engine** — `services/matching.ts` to surface supply for a buy request and demand for a listing.
5. **Phase 9 — Messaging** — buyer ↔ seller threads.
6. **Phase 10 — Admin** — `/admin` dashboard, user/listing/card management, reports queue.

## Future-ready hooks already built in

- `Profile.kycProvider` / `kycReference` / `kycVerifiedAt` — KYC integration
- `Card.marketPriceMyr` / `marketPriceUpdatedAt` — pricing source adapter
- `Profile.rating` / `totalSales` — seller rating system
- `Profile.role` (USER / MODERATOR / ADMIN) — admin layer
- `Report` table with `targetType` enum — moderation
- Services layer keeps business logic out of pages — easy to add pricing adapters, escrow, etc. later.
