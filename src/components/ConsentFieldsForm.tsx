"use client";

import {
  CONSENT_FORM_FIELDS,
  DELEGATE_NAME_FIELDS,
  type ConsentFormFields,
} from "@/lib/consent-form-fields";
import type { FormKind } from "@/lib/form-kind";
import { getFormKindLabel } from "@/lib/form-kind";

type ConsentFieldsFormProps = {
  values: ConsentFormFields;
  onChange: (values: ConsentFormFields) => void;
  formKind: FormKind;
};

export function ConsentFieldsForm({
  values,
  onChange,
  formKind,
}: ConsentFieldsFormProps) {
  const formLabel = getFormKindLabel(formKind);
  function updateField<K extends keyof ConsentFormFields>(
    key: K,
    value: ConsentFormFields[K]
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="brand-panel overflow-hidden">
      <div className="border-b border-brand-navy/8 bg-brand-royal-muted/60 px-4 py-3">
        <p className="text-sm font-semibold text-brand-navy">
          Section 1 — Fill in your details
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          These answers are typed here and placed on page 1 of the {formLabel}{" "}
          PDF when you submit.
        </p>
      </div>
      <div className="space-y-4 p-4">
        <fieldset className="space-y-4">
          <legend className="mb-1 block text-sm font-medium text-slate-800">
            Delegate name
            <span className="text-red-600" aria-hidden>
              {" "}
              *
            </span>
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {DELEGATE_NAME_FIELDS.map((field) => (
              <label
                key={field.key}
                className={`block ${field.key === "preferredName" ? "sm:col-span-2" : ""}`}
              >
                <span className="mb-1 block text-sm font-medium text-slate-800">
                  {field.label}
                  {!field.optional && (
                    <span className="text-red-600" aria-hidden>
                      {" "}
                      *
                    </span>
                  )}
                </span>
                <input
                  type="text"
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    updateField(
                      field.key,
                      e.target.value as ConsentFormFields[typeof field.key]
                    )
                  }
                  placeholder={field.placeholder}
                  required={!field.optional}
                  autoComplete={
                    field.key === "delegateFirstName"
                      ? "given-name"
                      : field.key === "delegateLastName"
                        ? "family-name"
                        : "off"
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy placeholder:text-slate-400 focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
                />
                <p className="mt-1 text-xs text-slate-500">{field.guide}</p>
              </label>
            ))}
          </div>
        </fieldset>

        {CONSENT_FORM_FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-800">
              {field.label}
              {!field.optional && (
                <span className="text-red-600" aria-hidden>
                  {" "}
                  *
                </span>
              )}
            </span>
            <input
              type={field.inputMode === "tel" ? "tel" : "text"}
              value={values[field.key] ?? ""}
              onChange={(e) =>
                updateField(
                  field.key,
                  e.target.value as ConsentFormFields[typeof field.key]
                )
              }
              placeholder={field.placeholder}
              required={!field.optional}
              autoComplete={
                field.key === "parentName"
                  ? "name"
                  : field.key === "emergencyContact"
                    ? "tel"
                    : "off"
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy placeholder:text-slate-400 focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
            />
            <p className="mt-1 text-xs text-slate-500">{field.guide}</p>
          </label>
        ))}
      </div>
    </div>
  );
}
