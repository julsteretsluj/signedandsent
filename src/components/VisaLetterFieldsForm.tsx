"use client";

import { useMemo } from "react";
import type {
  VisaLetterConferenceRole,
  VisaLetterFields,
} from "@/lib/visa-letter-fields";
import { VISA_LETTER_CONFERENCE_ROLES } from "@/lib/visa-letter-fields";

type VisaLetterFieldsFormProps = {
  values: VisaLetterFields;
  onChange: (values: VisaLetterFields) => void;
};

export function VisaLetterFieldsForm({
  values,
  onChange,
}: VisaLetterFieldsFormProps) {
  const roles = useMemo(() => VISA_LETTER_CONFERENCE_ROLES, []);

  return (
    <div className="space-y-4">
      <div className="brand-panel overflow-hidden">
        <div className="border-b border-brand-royal/8 bg-brand-royal-muted/60 px-4 py-3">
          <p className="text-sm font-semibold text-brand-navy">
            Visa letter participant details
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            These answers are placed on the visa letter PDF when you submit.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-navy">
              Full name (as per passport)
            </span>
            <input
              type="text"
              value={values.fullName}
              onChange={(e) => onChange({ ...values, fullName: e.target.value })}
              placeholder="e.g. Jordan Rivers"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy placeholder:text-slate-400 focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-navy">
              Passport number
            </span>
            <input
              type="text"
              value={values.passportNumber}
              onChange={(e) =>
                onChange({ ...values, passportNumber: e.target.value })
              }
              placeholder="e.g. 123456789"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy placeholder:text-slate-400 focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-navy">
              Nationality
            </span>
            <input
              type="text"
              value={values.nationality}
              onChange={(e) =>
                onChange({ ...values, nationality: e.target.value })
              }
              placeholder="e.g. British"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy placeholder:text-slate-400 focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-navy">
              Conference role
            </span>
            <select
              value={values.conferenceRole}
              onChange={(e) =>
                onChange({
                  ...values,
                  conferenceRole: e.target.value as VisaLetterConferenceRole,
                })
              }
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-brand-navy focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "delegate"
                    ? "Delegate"
                    : role === "chair"
                      ? "Chair"
                      : "Advisor"}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

