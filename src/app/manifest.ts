import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes GemVault installable on phones.
 * Android Chrome: menu → "Install app" / "Add to Home screen"
 * iOS Safari: Share → "Add to Home Screen"
 * Installed, it launches fullscreen (no browser chrome) like a native app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GemVault — Trading Card Vault",
    short_name: "GemVault",
    description:
      "Track your card collection, trade with collectors, and pull oripa packs.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
