"use client";

import { FormEvent, useCallback, useState } from "react";
import { ConsentCheckboxesForm } from "./ConsentCheckboxesForm";
import { ConsentFieldsForm } from "./ConsentFieldsForm";
import { DocumentViewer } from "./DocumentViewer";
import { FormFillGuide } from "./FormFillGuide";
import { SignaturePanel } from "./SignaturePanel";
import {
  emptyConsentCheckboxes,
  type ConsentCheckboxKey,
} from "@/lib/consent-checkboxes";
import type { ConsentFormFields } from "@/lib/consent-form-fields";
import type { SignatureMethod } from "@/lib/signature";
import type { FormKind } from "@/lib/form-kind";
import { getFormKindLabel } from "@/lib/form-kind";
import type { VisaLetterFields } from "@/lib/visa-letter-fields";
import { VisaLetterFieldsForm } from "./VisaLetterFieldsForm";

const emptyFields: ConsentFormFields = {
  delegateFirstName: "",
  delegateMiddleName: "",
  delegateLastName: "",
  preferredName: "",
  school: "",
  parentName: "",
  emergencyContact: "",
};

const emptyVisaLetterFields: VisaLetterFields = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  conferenceRole: "delegate",
};

type SignFormProps = {
  code: string;
  documentUrl: string;
  formKind: FormKind;
};

export function SignForm({ code, documentUrl, formKind }: SignFormProps) {
  const [formFields, setFormFields] = useState<ConsentFormFields>(emptyFields);
  const [consents, setConsents] =
    useState<Record<ConsentCheckboxKey, boolean>>(emptyConsentCheckboxes);
  const [visaFields, setVisaFields] = useState<VisaLetterFields>(
    emptyVisaLetterFields
  );
  const [email, setEmail] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    parentCopySent: boolean;
    downloadUrl?: string;
    email: string;
  } | null>(null);

  const formLabel = getFormKindLabel(formKind);
  const submitButtonLabel =
    formKind === "visaLetter" ? "Submit signed visa letter" : "Submit signed consent";

  const handleSignatureReady = useCallback(
    (dataUrl: string | null, method: SignatureMethod | null) => {
      setSignatureImage(dataUrl);
      setSignatureMethod(method);
    },
    []
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (formKind === "consent") {
      if (!consents.dataConsent || !consents.mediaConsent) {
        setError("Please tick both consent statement boxes in Section 3 before submitting.");
        return;
      }

      if (!signatureImage || !signatureMethod) {
        setError("Please add your signature before submitting.");
        return;
      }
    } else {
      if (
        !visaFields.fullName ||
        !visaFields.passportNumber ||
        !visaFields.nationality ||
        !visaFields.conferenceRole
      ) {
        setError("Please complete all required visa letter fields.");
        return;
      }
      if (!email) {
        setError("Please enter your email address.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload =
        formKind === "visaLetter"
          ? {
              code,
              email,
              ...visaFields,
            }
          : {
              code,
              email,
              signatureMethod: signatureMethod!,
              signatureImage: signatureImage!,
              ...formFields,
              ...consents,
            };

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Submission failed.");
        return;
      }

      setSuccess({
        parentCopySent: Boolean(data.parentCopySent),
        downloadUrl: data.downloadUrl,
        email,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-emerald-900">Signed &amp; sent!</h2>
        <p className="mt-2 text-emerald-800">
          Thank you. Your signed {formLabel} has been submitted successfully.
        </p>
        {formKind === "visaLetter" && (
          <p className="mt-3 text-sm text-emerald-800">
            Please save this and print it out for your travels.
          </p>
        )}
        {success.parentCopySent ? (
          <p className="mt-3 text-sm text-emerald-800">
            A copy of your signed PDF has been emailed to{" "}
            <strong>{success.email}</strong>. Please check your inbox (and spam
            folder).
          </p>
        ) : (
          <p className="mt-3 text-sm text-emerald-800">
            Save a copy using the download button below.
          </p>
        )}
        {success.downloadUrl && (
          <a
            href={success.downloadUrl}
            download
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-royal px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-royal-dark"
          >
            Download your signed PDF
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formKind === "consent" && <FormFillGuide />}

      {formKind === "consent" ? (
        <ConsentFieldsForm
          values={formFields}
          onChange={setFormFields}
          formKind={formKind}
        />
      ) : (
        <VisaLetterFieldsForm values={visaFields} onChange={setVisaFields} />
      )}

      <DocumentViewer documentUrl={documentUrl} formKind={formKind} />

      {formKind === "consent" && (
        <ConsentCheckboxesForm values={consents} onChange={setConsents} />
      )}

      <div className="rounded-xl border border-brand-royal/20 bg-brand-royal-muted/70 px-4 py-3">
        <p className="text-sm font-medium text-brand-navy">
          Your digital signature
        </p>
        <p className="mt-1 text-xs text-brand-ink">
          After ticking the required statements above, add your signature below.
          It appears on page 2 with today&apos;s date.
        </p>
      </div>
      {formKind === "consent" && (
        <SignaturePanel onSignatureReady={handleSignatureReady} />
      )}

      <div className="brand-panel p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-brand-navy">
            {formKind === "visaLetter"
              ? "Delegate/Chair/Advisor email"
              : "Your email address"}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. guardian@example.com"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
          />
          <p className="mt-1 text-xs text-slate-500">
            {formKind === "visaLetter"
              ? "We will email your visa letter to this address after you submit."
              : "We will email your signed PDF to this address after you submit."}
          </p>
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-brand-royal to-brand-royal-dark px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-royal/30 transition hover:from-brand-royal-dark hover:to-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Submitting…" : submitButtonLabel}
      </button>
    </form>
  );
}
