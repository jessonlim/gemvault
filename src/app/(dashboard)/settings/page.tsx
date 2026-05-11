import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-50">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">
        Update your public profile. Email and username can&apos;t be changed yet.
      </p>

      {/* Read-only header — account stuff */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Username" value={<><span className="text-slate-100">@{profile.username}</span> <Link href={`/profile/${profile.username}`} className="ml-2 inline-flex items-center gap-1 text-xs text-brand-400 hover:underline">View public profile <ExternalLink size={12} /></Link></>} />
            <Row label="Email" value={profile.email} />
            <Row
              label="Verification"
              value={
                profile.verificationStatus === "VERIFIED" ? (
                  <Badge variant="success" className="gap-1"><ShieldCheck size={12} /> Verified</Badge>
                ) : profile.verificationStatus === "PENDING" ? (
                  <Badge variant="warning">Pending</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )
              }
            />
          </dl>
        </CardContent>
      </Card>

      {/* Editable form */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Public profile
          </h2>
          <div className="mt-4">
            <ProfileForm profile={profile} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}
