import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/layout/Container";
import { requireAdmin } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <Navbar />
      <div className="border-b border-brand-500/20 bg-brand-600/5">
        <Container className="flex h-10 items-center gap-2 text-xs font-medium text-brand-300">
          <ShieldCheck size={14} />
          Admin area
          <span className="text-slate-600">·</span>
          <Link href="/admin" className="hover:underline">Home</Link>
          <span className="text-slate-600">·</span>
          <Link href="/admin/oripa" className="hover:underline">Oripa</Link>
        </Container>
      </div>
      <Container className="py-6 pb-24 sm:py-8">
        <main>{children}</main>
      </Container>
    </>
  );
}
