import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-50">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">Free forever for collectors.</p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
