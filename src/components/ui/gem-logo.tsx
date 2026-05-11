import { cn } from "@/lib/utils";

interface GemLogoProps {
  className?: string;
  size?: number;
}

/**
 * Inline SVG gemstone logo for GemVault.
 * Uses red gradient — matches brand palette.
 */
export function GemLogo({ className, size = 28 }: GemLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      <defs>
        <linearGradient id="gemGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e63946" />
          <stop offset="60%" stopColor="#c1121f" />
          <stop offset="100%" stopColor="#780000" />
        </linearGradient>
        <linearGradient id="gemShine" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path
        d="M16 3 L27 11 L22 27 H10 L5 11 Z"
        fill="url(#gemGrad)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.5"
      />
      <path d="M16 3 L22 27 L16 3 Z M16 3 L10 27 L16 3 Z" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
      <path d="M5 11 L27 11" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
      <path d="M16 3 L13 11 L16 3 Z M16 3 L19 11 L16 3 Z" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      <path d="M16 3 L19 11 L16 3" fill="url(#gemShine)" opacity="0.7" />
    </svg>
  );
}
