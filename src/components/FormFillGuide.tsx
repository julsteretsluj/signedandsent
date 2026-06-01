"use client";

import { useState } from "react";
import {
  CONSENT_FORM_GUIDE,
  GUIDE_SUMMARY,
  type GuideField,
} from "@/lib/consent-form-guide";

function FieldTypeBadge({ type }: { type: GuideField["type"] }) {
  const styles: Record<GuideField["type"], string> = {
    text: "bg-brand-royal-muted text-brand-royal",
    signature: "bg-violet-100 text-violet-800",
    date: "bg-amber-100 text-amber-800",
    acknowledgment: "bg-slate-100 text-slate-700",
    note: "bg-orange-100 text-orange-800",
  };
  const labels: Record<GuideField["type"], string> = {
    text: "Type below",
    signature: "Sign below",
    date: "Auto on submit",
    acknowledgment: "Read & agree",
    note: "Separate form",
  };
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function GuideFieldRow({ field }: { field: GuideField }) {
  return (
    <li className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">
          {field.label}
          {field.required && (
            <span className="ml-1 text-red-600" aria-label="required">
              *
            </span>
          )}
        </p>
        <FieldTypeBadge type={field.type} />
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{field.guide}</p>
      {field.example && (
        <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700">
          <span className="font-medium text-slate-500">Suggested: </span>
          {field.example}
        </p>
      )}
    </li>
  );
}

export function FormFillGuide() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | "all">("all");

  const visibleSteps =
    activeStep === "all"
      ? CONSENT_FORM_GUIDE
      : CONSENT_FORM_GUIDE.filter((s) => s.step === activeStep);

  return (
    <div className="brand-panel overflow-hidden bg-gradient-to-b from-brand-royal-muted/50 to-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls="form-fill-guide-panel"
      >
        <div>
          <p className="text-sm font-semibold text-brand-navy">
            Step-by-step filling guide
          </p>
          <p className="text-xs text-slate-600">
            {open
              ? `${CONSENT_FORM_GUIDE.length} steps · tap to hide`
              : "Optional help · tap to show step-by-step instructions"}
          </p>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div
          id="form-fill-guide-panel"
          className="border-t border-brand-navy/8 px-4 pb-4 pt-3"
        >
          <div className="mb-4 rounded-lg bg-white/80 px-3 py-2.5 text-xs text-slate-600">
            <p>
              <strong className="text-slate-800">Conference:</strong>{" "}
              {GUIDE_SUMMARY.conferenceDates} · {GUIDE_SUMMARY.venue}
            </p>
            <p className="mt-1">
              <strong className="text-slate-800">How to use this guide:</strong>{" "}
              Fill in <strong>Section 1</strong> using the text boxes below the
              guide, then add your <strong>digital signature</strong> and email.
              Your answers and signature are placed on the PDF when you submit.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveStep("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                activeStep === "all"
                  ? "bg-brand-royal text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              All steps
            </button>
            {CONSENT_FORM_GUIDE.map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  activeStep === s.step
                    ? "bg-brand-royal text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Step {s.step}
              </button>
            ))}
          </div>

          <ol className="space-y-5">
            {visibleSteps.map((step) => (
              <li key={step.step}>
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-royal text-xs font-bold text-white">
                    {step.step}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {step.section}
                  </h3>
                  <span className="text-xs text-slate-400">Page {step.page}</span>
                </div>
                {step.intro && (
                  <p className="mb-2 text-sm text-slate-600">{step.intro}</p>
                )}
                <ul className="space-y-2">
                  {step.fields.map((field) => (
                    <GuideFieldRow key={field.id} field={field} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-xs text-slate-500">
            Questions? Contact{" "}
            <a
              href={`mailto:${GUIDE_SUMMARY.contacts[0].email}`}
              className="text-brand-royal underline"
            >
              {GUIDE_SUMMARY.contacts[0].email}
            </a>{" "}
            or{" "}
            <a
              href={`mailto:${GUIDE_SUMMARY.contacts[1].email}`}
              className="text-brand-royal underline"
            >
              {GUIDE_SUMMARY.contacts[1].email}
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
