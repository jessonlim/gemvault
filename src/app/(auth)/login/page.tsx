import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; confirm?: string };
}) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-50">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-400">Log in to your GemVault account.</p>

      {searchParams.confirm === "1" && (
        <div className="mt-4 rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-300">
          Check your inbox to confirm your email, then log in.
        </div>
      )}

      <LoginForm redirectTo={searchParams.redirect} />

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
