import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { Gift, Users, Flag, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [userCount, activeOripa, pendingReports, disputedSales] = await Promise.all([
    db.profile.count(),
    db.oripaSeries.count({ where: { status: "ACTIVE" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.sale.count({ where: { status: "DISPUTED" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Admin</h1>
      <p className="mt-1 text-sm text-slate-400">Platform management.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminTile
          href="/admin/oripa"
          icon={<Gift size={20} />}
          title="Oripa"
          body={`${activeOripa} active series`}
          highlight
        />
        <AdminTile
          icon={<Users size={20} />}
          title="Users"
          body={`${userCount} registered — management UI coming soon`}
        />
        <AdminTile
          icon={<Receipt size={20} />}
          title="Disputed sales"
          body={`${disputedSales} awaiting review — UI coming soon`}
        />
        <AdminTile
          icon={<Flag size={20} />}
          title="Reports"
          body={`${pendingReports} pending — moderation queue coming soon`}
        />
      </div>
    </div>
  );
}

function AdminTile({
  href,
  icon,
  title,
  body,
  highlight,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  const inner = (
    <Card className={`${href ? "card-lift" : "opacity-70"} h-full ${highlight ? "border-brand-500/30" : ""}`}>
      <CardContent className="p-5">
        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${highlight ? "bg-brand-600/20 text-brand-300" : "bg-slate-800 text-slate-400"}`}>
          {icon}
        </div>
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
