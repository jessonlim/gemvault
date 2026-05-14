import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { listMySales } from "@/services/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardImage } from "@/components/cards/CardImage";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { ConfirmSaleControls } from "@/components/sales/ConfirmSaleControls";
import { RatingDialog } from "@/components/sales/RatingDialog";
import { formatMyr, formatDate, timeAgo } from "@/lib/utils";
import type { Sale, SaleRating, Card as DbCard, CardSet } from "@prisma/client";
import { CheckCircle2, Clock, AlertTriangle, ShoppingBag, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

type SaleFull = Sale & {
  seller: { username: string; displayName: string | null; avatarUrl: string | null };
  buyer: { username: string; displayName: string | null; avatarUrl: string | null };
  card: DbCard & { set: Pick<CardSet, "code" | "name"> };
  ratings: SaleRating[];
};

export default async function SalesPage() {
  const profile = await requireProfile();
  const sales = (await listMySales(profile.id)) as unknown as SaleFull[];

  const pending = sales.filter((s) => s.status === "PENDING_BUYER_CONFIRM");
  const confirmed = sales.filter((s) => s.status === "CONFIRMED");
  const disputed = sales.filter((s) => s.status === "DISPUTED");
  const cancelled = sales.filter((s) => s.status === "CANCELLED");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          <Receipt size={22} className="-mt-1 mr-1 inline text-brand-400" />
          Sales
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Track your completed deals and confirm pending sales.
        </p>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title="No sales yet"
          description="When you mark a listing as sold, it'll appear here for the buyer to confirm."
          action={
            <Link href="/listings">
              <Button>Go to my listings</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <SaleSection
              title="Awaiting confirmation"
              hint="Action needed — confirm or dispute the sale"
              icon={<Clock size={18} className="text-amber-400" />}
              sales={pending}
              profileId={profile.id}
            />
          )}
          {disputed.length > 0 && (
            <SaleSection
              title="Disputed"
              hint="Under review"
              icon={<AlertTriangle size={18} className="text-red-400" />}
              sales={disputed}
              profileId={profile.id}
            />
          )}
          {confirmed.length > 0 && (
            <SaleSection
              title="Completed"
              hint="Confirmed sales"
              icon={<CheckCircle2 size={18} className="text-success-500" />}
              sales={confirmed}
              profileId={profile.id}
            />
          )}
          {cancelled.length > 0 && (
            <SaleSection
              title="Cancelled"
              sales={cancelled}
              profileId={profile.id}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SaleSection({
  title,
  hint,
  icon,
  sales,
  profileId,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  sales: SaleFull[];
  profileId: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <SectionHeader title={title} subtitle={hint} className="mb-0 flex-1" />
      </div>
      <div className="space-y-3">
        {sales.map((sale) => (
          <SaleCard key={sale.id} sale={sale} profileId={profileId} />
        ))}
      </div>
    </section>
  );
}

function SaleCard({ sale, profileId }: { sale: SaleFull; profileId: string }) {
  const iAmSeller = sale.sellerId === profileId;
  const counterparty = iAmSeller ? sale.buyer : sale.seller;
  const myRating = sale.ratings.find((r) => r.raterId === profileId);
  const showRateAction = sale.status === "CONFIRMED" && !myRating;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-16 flex-shrink-0 sm:w-20">
            <CardImage src={sale.card.imageUrl} alt={sale.card.name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {sale.card.cardCode} · {sale.card.set.code}
                </p>
                <p className="line-clamp-1 mt-0.5 text-sm font-semibold text-slate-100">
                  {sale.card.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <ConditionBadge condition={sale.condition} />
                  <Badge variant={iAmSeller ? "gold" : "brand"}>
                    {iAmSeller ? "You sold" : "You bought"}
                  </Badge>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-50">
                {formatMyr(sale.finalPriceMyr)}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-xs text-slate-400">
              <span>
                {iAmSeller ? "To " : "From "}
                <Link
                  href={`/profile/${counterparty.username}`}
                  className="font-medium text-brand-400 hover:underline"
                >
                  @{counterparty.username}
                </Link>
              </span>
              <span>
                {sale.status === "PENDING_BUYER_CONFIRM" && `Pending · ${timeAgo(sale.sellerMarkedAt)}`}
                {sale.status === "CONFIRMED" && `Confirmed ${formatDate(sale.buyerConfirmedAt!)}`}
                {sale.status === "DISPUTED" && `Disputed ${timeAgo(sale.disputedAt!)}`}
                {sale.status === "CANCELLED" && `Cancelled ${timeAgo(sale.cancelledAt!)}`}
              </span>
            </div>

            {sale.sellerNote && (
              <p className="mt-2 rounded-lg bg-slate-800/50 p-2 text-xs text-slate-300">
                <span className="font-medium text-slate-200">Seller note:</span> {sale.sellerNote}
              </p>
            )}
            {sale.buyerDisputeNote && (
              <p className="mt-2 rounded-lg border border-red-500/30 bg-red-900/10 p-2 text-xs text-red-300">
                <span className="font-medium">Buyer dispute:</span> {sale.buyerDisputeNote}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {sale.status === "PENDING_BUYER_CONFIRM" && (
          <div className="mt-3 border-t border-white/5 pt-3">
            <ConfirmSaleControls saleId={sale.id} isBuyer={!iAmSeller} />
          </div>
        )}
        {showRateAction && (
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <p className="text-xs text-slate-400">Rate your experience</p>
            <RatingDialog saleId={sale.id} otherUsername={counterparty.username} />
          </div>
        )}
        {sale.status === "CONFIRMED" && myRating && (
          <div className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-500">
            ✓ You rated @{counterparty.username} {myRating.stars}/5
          </div>
        )}
      </CardContent>
    </Card>
  );
}
