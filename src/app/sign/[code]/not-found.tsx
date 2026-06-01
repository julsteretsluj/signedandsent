import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold text-brand-navy">
        Code not found
      </h1>
      <p className="mt-2 text-brand-ink">
        We couldn&apos;t find a consent form for that code. Please double-check the
        code from your invitation and try again.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-brand-royal px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-royal/25 transition hover:bg-brand-royal-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
