import Link from "next/link";
import type { BuyRequest, Card as DbCard, CardSet, Profile } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMyr, CONDITION_LABELS, timeAgo } from "@/lib/utils";
import { ShieldCheck, MapPin } from "lucide-react";

type BuyRequestFull = BuyRequest & {
  buyer: Pick<Profile, "id" | "username" | "displayName" | "city" | "state" | "verificationStatus">;
  card: DbCard & { set: Pick<CardSet, "code" | "name"> };
};

export function MatchingBuyRequests({ requests }: { requests: BuyRequestFull[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-100">Buyers wanting this card</h2>
      <p className="text-sm text-slate-400">
        Active buy requests that match this card&apos;s condition, language, and your price.
      </p>

      {requests.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
          No matching buy requests yet.
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {requests.map((r) => (
            <Link key={r.id} href={`/buy-requests/${r.id}`}>
              <Card className="transition hover:border-slate-700">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-300">
                      Up to {formatMyr(r.maxPriceMyr)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Min cond: {CONDITION_LABELS[r.minCondition]}
                      {r.quantity > 1 && ` · ×${r.quantity}`}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span>@{r.buyer.username}</span>
                      {r.buyer.verificationStatus === "VERIFIED" && (
                        <ShieldCheck size={12} className="text-emerald-400" />
                      )}
                      {(r.preferredCity || r.buyer.city) && (
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin size={12} /> {r.preferredCity ?? r.buyer.city}
                        </span>
                      )}
                      <span>· {timeAgo(r.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant="outline">View →</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
