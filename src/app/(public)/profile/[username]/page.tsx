import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingItem } from "@/components/marketplace/ListingItem";
import { OfferItem } from "@/components/marketplace/OfferItem";
import { ContactButton } from "@/components/messaging/ContactButton";
import { CardImage } from "@/components/cards/CardImage";
import { getPublicProfileByUsername } from "@/services/profiles";
import { getCurrentProfile } from "@/lib/auth";
import { formatMyr, formatDate, CONDITION_LABELS, timeAgo } from "@/lib/utils";
import { ShieldCheck, MapPin, Calendar, Star, Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const [data, viewer] = await Promise.all([
    getPublicProfileByUsername(params.username),
    getCurrentProfile(),
  ]);
  if (!data) notFound();
  const { profile, activeListings, activeOffers, activeBuyRequests } = data;
  const isOwner = viewer?.id === profile.id;

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const initials = (profile.displayName ?? profile.username).slice(0, 2).toUpperCase();

  return (
    <Container className="py-6 pb-24 sm:py-10 sm:pb-10">
      {/* Profile header */}
      <Card className="surface-glass relative overflow-hidden">
        <div className="bg-red-glow pointer-events-none absolute -right-20 -top-20 h-40 w-40" />
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar avatarUrl={profile.avatarUrl} initials={initials} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-50">
                  {profile.displayName ?? profile.username}
                </h1>
                {profile.verificationStatus === "VERIFIED" && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck size={12} /> Verified
                  </Badge>
                )}
                {profile.role === "ADMIN" && <Badge variant="brand">Admin</Badge>}
                {profile.role === "MODERATOR" && <Badge variant="brand">Moderator</Badge>}
              </div>
              <p className="text-sm text-slate-400">@{profile.username}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> Joined {formatDate(profile.createdAt)}
                </span>
                {profile.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star size={12} className="text-amber-400" /> {profile.rating.toFixed(1)}
                  </span>
                )}
                <span>{profile.totalSales} sales</span>
                <span>{profile.totalPurchases} purchases</span>
              </div>

              {profile.bio && (
                <p className="mt-3 max-w-2xl whitespace-pre-line text-sm text-slate-300">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="flex flex-shrink-0 gap-2">
              {isOwner ? (
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <SettingsIcon size={14} /> Edit profile
                  </Button>
                </Link>
              ) : (
                <ContactButton
                  recipientUsername={profile.username}
                  isAuthed={!!viewer}
                  variant="outline"
                  label="Message"
                  defaultMessage={`Hi @${profile.username}!`}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Listings" value={activeListings.length} />
        <Stat label="Open to offers" value={activeOffers.length} />
        <Stat label="Buy requests" value={activeBuyRequests.length} />
      </div>

      {/* Active listings */}
      <Section
        title="Active listings"
        empty={`${profile.displayName ?? profile.username} has no fixed-price listings right now.`}
        items={activeListings}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeListings.map((l) => <ListingItem key={l.id} listing={l} />)}
        </div>
      </Section>

      {/* Open to offers */}
      <Section
        title="Open to offers"
        empty={`No cards open to offers right now.`}
        items={activeOffers}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeOffers.map((o) => <OfferItem key={o.id} offer={o} />)}
        </div>
      </Section>

      {/* Buy requests */}
      <Section
        title="Wanted (buy requests)"
        empty={`Not looking for anything specific right now.`}
        items={activeBuyRequests}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeBuyRequests.map((r) => (
            <Link key={r.id} href={`/buy-requests/${r.id}`}>
              <Card className="h-full transition hover:border-slate-700">
                <CardContent className="flex gap-3 p-3">
                  <div className="w-20 flex-shrink-0">
                    <CardImage src={r.card.imageUrl} alt={r.card.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">{r.card.cardCode} · {r.card.set.code}</p>
                    <p className="line-clamp-1 text-sm font-medium text-slate-100">{r.card.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline">Min {CONDITION_LABELS[r.minCondition]}</Badge>
                      {r.quantity > 1 && <Badge>×{r.quantity}</Badge>}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-emerald-300">
                      Up to {formatMyr(r.maxPriceMyr)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{timeAgo(r.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </Container>
  );
}

function Avatar({ avatarUrl, initials }: { avatarUrl: string | null; initials: string }) {
  if (avatarUrl) {
    return (
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-800">
        <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
      {initials}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center sm:p-4">
        <p className="text-2xl font-bold text-slate-50 sm:text-3xl">{value}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  empty,
  items,
  children,
}: {
  title: string;
  empty: string;
  items: unknown[];
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {items.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
          {empty}
        </div>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </section>
  );
}
