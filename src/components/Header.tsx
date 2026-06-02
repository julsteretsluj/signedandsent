import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  return (
    <header className="border-b border-brand-navy/6 bg-white/90 shadow-sm shadow-brand-navy/[0.04] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group min-w-0 inline-block leading-none">
          <BrandLogo size="header" priority />
          <p className="font-display mt-1.5 text-xs font-medium tracking-wide text-brand-ink sm:text-sm">
            <span className="text-brand-royal group-hover:underline">SEAMUN I 2027</span>
            <span className="mx-1.5 text-brand-navy/25" aria-hidden>
              ·
            </span>
            Parental consent
          </p>
        </Link>
      </div>
    </header>
  );
}
