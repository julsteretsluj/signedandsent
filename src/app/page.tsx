import Link from "next/link";
import { CodeEntryForm } from "@/components/CodeEntryForm";
import {
  SHARED_CONSENT_ACCESS_CODE,
  SHARED_VISA_LETTER_ACCESS_CODE,
} from "@/lib/access-code";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <section className="mx-auto max-w-2xl text-center">
        <p className="inline-block rounded-full border border-brand-royal/25 bg-brand-royal-muted/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-royal">
          SEAMUN I 2027
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-tight text-brand-navy sm:text-5xl">
          Sign your form in minutes
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-brand-ink">
          Enter the access code from your invitation to open the form,
          sign digitally, and submit — no printing required.
        </p>
      </section>

      <div className="mx-auto mt-8 max-w-md space-y-4">
        <div className="brand-panel-elevated px-5 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-royal">
            Consent access code
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.2em] text-brand-navy">
            {SHARED_CONSENT_ACCESS_CODE}
          </p>
          <Link
            href={`/sign/${SHARED_CONSENT_ACCESS_CODE}`}
            className="mt-4 inline-block text-sm font-semibold text-brand-royal underline decoration-brand-royal/35 underline-offset-4 transition hover:text-brand-royal-dark"
          >
            Go directly to the consent form →
          </Link>
        </div>

        <div className="brand-panel-elevated px-5 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-royal">
            Visa letter access code
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.2em] text-brand-navy">
            {SHARED_VISA_LETTER_ACCESS_CODE}
          </p>
          <Link
            href={`/sign/${SHARED_VISA_LETTER_ACCESS_CODE}`}
            className="mt-4 inline-block text-sm font-semibold text-brand-royal underline decoration-brand-royal/35 underline-offset-4 transition hover:text-brand-royal-dark"
          >
            Go directly to the visa letter →
          </Link>
        </div>
        <div className="brand-panel p-6 sm:p-8">
          <CodeEntryForm />
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Enter your code",
            text: "Use the access code shared by the SEAMUN organisers.",
          },
          {
            step: "2",
            title: "Review & sign",
            text: "Read the form and sign by drawing, typing, or uploading.",
          },
          {
            step: "3",
            title: "Submit",
            text: "Add your email and send — organisers receive your signed PDF.",
          },
        ].map((item) => (
          <div key={item.step} className="brand-panel p-6 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-royal to-brand-royal-dark text-base font-bold text-white shadow-md shadow-brand-royal/30">
              {item.step}
            </span>
            <h3 className="font-display mt-4 text-xl font-semibold text-brand-navy">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
