import Image from "next/image";
import { cn } from "@/lib/utils";

interface CardImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

/**
 * One Piece TCG card aspect ratio is roughly 5:7 (closer to 0.715).
 * We use a fixed aspect-[5/7] container with a graceful fallback when no image exists.
 */
export function CardImage({ src, alt, className }: CardImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-[5/7] w-full overflow-hidden rounded-lg bg-slate-800",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
          No image
        </div>
      )}
    </div>
  );
}
