import Image from "next/image";
import { cn } from "@/lib/cn";

/** Intrinsic size of public/logo.png (trimmed to ink, transparent). */
const LOGO_WIDTH = 924;
const LOGO_HEIGHT = 282;

const SIZES = {
  header: "h-14 w-auto max-w-[min(100%,22rem)] sm:h-16",
  hero: "h-24 w-auto max-w-[min(100%,28rem)] sm:h-28",
  footer: "h-12 w-auto max-w-[min(100%,18rem)] sm:h-14",
  compact: "h-11 w-auto max-w-[min(100%,16rem)] sm:h-12",
} as const;

type BrandLogoProps = {
  size?: keyof typeof SIZES;
  /** Use on dark backgrounds (e.g. navy footer) */
  variant?: "default" | "on-dark";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  size = "header",
  variant = "default",
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Signed & Sent"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={cn(
        "block shrink-0 leading-none",
        SIZES[size],
        variant === "on-dark" && "brightness-0 invert",
        className
      )}
    />
  );
}
