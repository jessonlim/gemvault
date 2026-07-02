import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { ListingItem } from "@/components/marketplace/ListingItem";
import { CardImage } from "@/components/cards/CardImage";
import { GemLogo } from "@/components/ui/gem-logo";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchSaleListings } from "@/services/marketplace";
import { formatMyr, timeAgo } from "@/lib/utils";
import {
  Wallet,
  Library,
  Tag,
  Heart,
  Zap,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <>
      <Navbar />
      <main className="pb-24 sm:pb-0">
        {profile ? <AuthedHome profile={profile} /> : <AnonHome />}
      </main>
      <Footer />
      <MobileTabBar />
    </>
  );
}

// ============== Anonymous landing ==============

function AnonHome() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5 bg-vault-gradient">
        <Container className="relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-600/10 px-3 py-1 text-xs font-medium text-brand-300">
              <GemLogo size={12} /> Premium trading card vault
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Your Trading <br />
              <span className="bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 bg-clip-text text-transparent">
                Card Vault
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
              Manage your collection, track value, and discover collectors ready to buy or sell.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="xl">
                  <Plus size={18} /> Add Card
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="xl" variant="secondary">
                  Explore Market
                </Button>
              </Link>
            </div>
          </div>

          {/* Layered card mockup — pure decoration */}
          <div className="relative hidden h-[420px] items-center justify-center lg:flex">
            <div className="bg-red-glow absolute inset-0" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative h-72 w-52 rotate-[-12deg]">
                <div className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_20px_60px_-12px_rgba(193,18,31,0.5)]" />
              </div>
              <div className="absolute -top-2 left-12 h-72 w-52">
                <div className="absolute inset-0 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 shadow-[0_20px_60px_-12px_rgba(193,18,31,0.6)]" />
                <div className="absolute inset-3 flex items-center justify-center rounded-xl bg-slate-950/70">
                  <GemLogo size={80} />
                </div>
              </div>
              <div className="absolute -top-4 left-24 h-72 w-52 rotate-[14deg]">
                <div className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_60px_-12px_rgba(193,18,31,0.4)]" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Feature cards */}
      <Container className="py-12 sm:py-16">
        <SectionHeader title="Why GemVault" subtitle="Built for collectors who care about trust, value, and discovery." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<Library size={20} />} title="Track Collection" body="Catalog every One Piece & Pokémon card with condition, language and photos." />
          <FeatureCard icon={<Tag size={20} />} title="Sell or Stay Open" body="List at fixed price, or accept offers above your minimum." />
          <FeatureCard icon={<Heart size={20} />} title="Want List" body="Post what you want at the price you'll pay." />
          <FeatureCard icon={<Zap size={20} />} title="Smart Matching" body="Buyer demand meets seller supply automatically." />
        </div>
      </Container>
    </>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="card-lift">
      <CardContent className="p-5">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
          {icon}
        </div>
        <h3 className="text-base font-semibold tracking-tight text-slate-50">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
      </CardContent>
    </Card>
  );
}

// ============== Authed home (dashboard) ==============

async function AuthedHome({ profile }: { profile: { id: string; displayName: string | null; username: string } }) {
  const [
    collectionCount,
    listingsCount,
    offersCount,
    buyRequestsCount,
    listingValue,
    recentListings,
    recentActivity,
  ] = await Promise.all([
    db.userCard.count({ where: { ownerId: profile.id } }),
    db.saleListing.count({ where: { sellerId: profile.id, status: "ACTIVE" } }),
    db.sellPreference.count({ where: { ownerId: profile.id, isActive: true } }),
    db.buyRequest.count({ where: { buyerId: profile.id, status: "ACTIVE" } }),
    db.saleListing.aggregate({
      where: { sellerId: profile.id, status: "ACTIVE" },
      _sum: { priceMyr: true },
    }),
    searchSaleListings({ page: 1, pageSize: 6 }),
    db.message.findMany({
      where: { conversation: { OR: [{ buyerId: profile.id }, { sellerId: profile.id }] } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        conversation: {
          include: {
            buyer: { select: { username: true, displayName: true } },
            seller: { select: { username: true, displayName: true } },
            saleListing: { include: { userCard: { include: { card: { select: { name: true } } } } } },
          },
        },
      },
    }),
  ]);

  return (
    <>
      {/* Hero / welcome */}
      <section className="relative overflow-hidden border-b border-white/5 bg-vault-gradient">
        <Container className="py-8 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium text-brand-400">
                Welcome back, {profile.displayName ?? profile.username}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                Your Trading <br className="hidden sm:block" />
                <span className="bg-gradient-to-br from-brand-400 to-brand-700 bg-clip-text text-transparent">
                  Card Vault
                </span>
              </h1>
              <p className="mt-3 max-w-lg text-sm text-slate-300 sm:text-base">
                Manage your collection, track market value, and discover collectors ready to buy or sell.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                <Link href="/cards">
                  <Button size="lg">
                    <Plus size={16} /> Add Card
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="secondary">
                    Explore Market
                  </Button>
                </Link>
              </div>
            </div>

            {/* Decorative card stack on desktop */}
            <div className="relative hidden h-64 items-center justify-center lg:flex">
              <div className="bg-red-glow absolute inset-0" />
              <div className="absolute right-12 top-4 h-56 w-40 rotate-[-12deg] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_20px_60px_-12px_rgba(193,18,31,0.5)]" />
              <div className="absolute right-24 top-0 h-56 w-40 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 shadow-[0_20px_60px_-12px_rgba(193,18,31,0.6)]">
                <div className="absolute inset-2 flex items-center justify-center rounded-xl bg-slate-950/60">
                  <GemLogo size={56} />
                </div>
              </div>
              <div className="absolute right-36 top-4 h-56 w-40 rotate-[14deg] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_20px_60px_-12px_rgba(193,18,31,0.4)]" />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-6 sm:py-10">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="Collection Value"
            value={formatMyr(listingValue._sum.priceMyr ?? 0)}
            hint="From your active listings"
            icon={<Wallet size={18} />}
            accent
            href="/listings"
          />
          <StatCard
            label="Cards Owned"
            value={collectionCount}
            hint={`Across all sets`}
            icon={<Library size={18} />}
            href="/collection"
          />
          <StatCard
            label="Sell Listings"
            value={listingsCount}
            hint="Listed for sale"
            icon={<Tag size={18} />}
            href="/listings"
          />
          <StatCard
            label="Open Offers"
            value={offersCount}
            hint="Cards open to offers"
            icon={<Heart size={18} />}
            href="/offers"
          />
          <StatCard
            label="Want List"
            value={buyRequestsCount}
            hint="Cards you're hunting"
            icon={<Zap size={18} />}
            href="/buy-requests/mine"
          />
        </div>

        {/* Oripa promo banner */}
        <Link href="/oripa" className="mt-6 block">
          <div className="card-lift relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-r from-brand-800/60 via-slate-900 to-slate-900 p-5">
            <div className="bg-red-glow pointer-events-none absolute -right-10 -top-10 h-40 w-40" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gold-500">
                  ✨ Oripa Packs
                </p>
                <p className="mt-1 text-lg font-bold text-slate-50">
                  Try your luck — pick a pack, win real cards
                </p>
                <p className="mt-0.5 text-sm text-slate-400">
                  Fixed prize pools, transparent odds, last-one bonuses.
                </p>
              </div>
              <span className="hidden flex-shrink-0 text-sm font-semibold text-brand-400 sm:block">
                Browse series →
              </span>
            </div>
          </div>
        </Link>

        {/* Two-column layout below */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Recent market listings */}
          <section>
            <SectionHeader
              title="Fresh on the market"
              subtitle="Recently listed by other collectors"
              seeAllHref="/marketplace"
            />
            {recentListings.listings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-slate-400">
                  No listings yet — be the first to list a card.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recentListings.listings.slice(0, 6).map((l) => (
                  <ListingItem key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section>
            <SectionHeader title="Recent activity" seeAllHref="/messages" />
            <Card>
              <CardContent className="p-2">
                {recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No activity yet. Once buyers contact you about your cards, you'll see it here.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {recentActivity.map((m) => {
                      const isMine = m.senderId === profile.id;
                      const otherUser =
                        m.conversation.buyerId === profile.id
                          ? m.conversation.seller
                          : m.conversation.buyer;
                      return (
                        <li key={m.id}>
                          <Link
                            href={`/messages/${m.conversationId}`}
                            className="flex items-start gap-3 rounded-xl p-3 hover:bg-slate-800/40"
                          >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-xs font-semibold text-brand-300">
                              {(otherUser.displayName ?? otherUser.username).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-100">
                                {isMine ? "You replied to " : "New message from "}
                                <span className="text-brand-400">
                                  @{otherUser.username}
                                </span>
                              </p>
                              <p className="line-clamp-1 text-xs text-slate-400">{m.body}</p>
                              {m.conversation.saleListing && (
                                <p className="text-[11px] text-slate-500">
                                  Re: {m.conversation.saleListing.userCard.card.name}
                                </p>
                              )}
                            </div>
                            <span className="flex-shrink-0 text-[11px] text-slate-500">
                              {timeAgo(m.createdAt)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </Container>
    </>
  );
}
