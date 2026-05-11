import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getProfileMatches, type ProfileMatch } from "@/services/matching";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardImage } from "@/components/cards/CardImage";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMyr } from "@/lib/utils";
import { ShieldCheck, MapPin, Zap, ArrowRightLeft, Sparkles } from "lucide-react";
import type { CardCondition } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const profile = await requireProfile();
  const matches = await getProfileMatches(profile.id);

  const perfect = matches.filter((m) => m.tier === "perfect");
  const near = matches.filter((m) => m.tier === "near");
  const potential = matches.filter((m) => m.tier === "potential");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          <Zap size={22} className="-mt-1 mr-1 inline text-brand-400" />
          Matches
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Where your prices line up with other collectors&apos;.{" "}
          <span className="text-slate-300">{matches.length}</span>{" "}
          opportunit{matches.length === 1 ? "y" : "ies"} found.
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No matches yet"
          description="Once you have active sale listings or buy requests, we'll match you up here."
          action={
            <div className="flex gap-2">
              <Link href="/cards">
                <Button>Add a card</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="secondary">Explore market</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <>
          {perfect.length > 0 && (
            <MatchSection
              title="Perfect Matches"
              hint="The deal works at full price."
              accent="brand"
              matches={perfect}
            />
          )}
          {near.length > 0 && (
            <MatchSection
              title="Near Matches"
              hint="Very close — small negotiation away."
              accent="gold"
              matches={near}
            />
          )}
          {potential.length > 0 && (
            <MatchSection
              title="Potential Deals"
              hint="Slight gap — worth a message."
              accent="default"
              matches={potential}
            />
          )}
        </>
      )}
    </div>
  );
}

function MatchSection({
  title,
  hint,
  matches,
  accent,
}: {
  title: string;
  hint: string;
  matches: ProfileMatch[];
  accent: "brand" | "gold" | "default";
}) {
  return (
    <section className="mb-8">
      <SectionHeader title={title} subtitle={hint} />
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} accent={accent} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match, accent }: { match: ProfileMatch; accent: "brand" | "gold" | "default" }) {
  const accentColor = {
    brand: "from-brand-500/20 via-brand-600/10 to-transparent border-brand-500/40",
    gold: "from-gold-500/15 via-gold-500/5 to-transparent border-gold-500/30",
    default: "from-slate-700/30 to-transparent border-white/8",
  }[accent];

  const scoreColor = {
    brand: "text-brand-400",
    gold: "text-gold-500",
    default: "text-slate-400",
  }[accent];

  const diff = match.sellerAsk - match.buyerMax;

  return (
    <Link href={match.href}>
      <Card
        className={`card-lift relative overflow-hidden bg-gradient-to-br ${accentColor} border`}
      >
        <CardContent className="flex gap-3 p-4">
          <div className="relative w-20 flex-shrink-0">
            <CardImage src={match.card.imageUrl} alt={match.card.name} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <span
                className={`inline-flex items-center rounded-full bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold ${scoreColor} backdrop-blur`}
              >
                {match.score}%
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {match.card.cardCode} · {match.card.setCode}
            </p>
            <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">
              {match.card.name}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {match.condition && <ConditionBadge condition={match.condition as CardCondition} />}
              <Badge variant={match.direction === "buying" ? "brand" : "gold"}>
                {match.direction === "buying" ? "You're buying" : "You're selling"}
              </Badge>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div>
                <p className="text-[10px] text-slate-500">Seller asks</p>
                <p className="font-semibold text-slate-100">{formatMyr(match.sellerAsk)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Buyer max</p>
                <p className="font-semibold text-success-500">{formatMyr(match.buyerMax)}</p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
              <span className="text-[11px] text-slate-400">
                @{match.counterparty.username}
                {match.counterparty.city && (
                  <>
                    {" · "}
                    <MapPin size={10} className="-mt-0.5 inline" /> {match.counterparty.city}
                  </>
                )}
              </span>
              <span className={`text-[11px] font-medium ${scoreColor}`}>
                {diff === 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <ArrowRightLeft size={10} /> Exact
                  </span>
                ) : diff < 0 ? (
                  <>Save {formatMyr(Math.abs(diff))}</>
                ) : (
                  <>{formatMyr(diff)} gap</>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
