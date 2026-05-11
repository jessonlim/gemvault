import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
            GV
          </div>
          <span className="text-base font-semibold text-slate-100">GemVault</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-20 pt-4 sm:items-center sm:pt-0">
        {children}
      </main>
    </div>
  );
}
