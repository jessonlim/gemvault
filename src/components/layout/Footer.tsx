import { Container } from "./Container";
import { GemLogo } from "@/components/ui/gem-logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 py-10 text-sm text-slate-500 sm:mt-24">
      <Container className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <GemLogo size={20} />
          <span className="font-semibold text-slate-300">GemVault</span>
          <span className="text-slate-600">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <p className="text-xs text-slate-600">
          Built for trading card collectors · Not affiliated with any TCG publisher
        </p>
      </Container>
    </footer>
  );
}
