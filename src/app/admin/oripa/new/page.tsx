import Link from "next/link";
import { CreateSeriesForm } from "./create-series-form";

export default function NewOripaSeriesPage() {
  return (
    <div className="max-w-xl">
      <Link href="/admin/oripa" className="text-sm text-brand-400 hover:underline">
        ← Back to oripa list
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-50">New oripa series</h1>
      <p className="mt-1 text-sm text-slate-400">
        Step 1 of 2 — set the basics here, then add prizes on the next screen before activating.
      </p>
      <div className="mt-6">
        <CreateSeriesForm />
      </div>
    </div>
  );
}
