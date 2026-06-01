"use client";

import {
  CONSENT_CHECKBOX_CONFIG,
  type ConsentCheckboxKey,
} from "@/lib/consent-checkboxes";

type ConsentCheckboxesFormProps = {
  values: Record<ConsentCheckboxKey, boolean>;
  onChange: (values: Record<ConsentCheckboxKey, boolean>) => void;
};

export function ConsentCheckboxesForm({
  values,
  onChange,
}: ConsentCheckboxesFormProps) {
  function toggle(key: ConsentCheckboxKey, checked: boolean) {
    onChange({ ...values, [key]: checked });
  }

  return (
    <div className="space-y-4">
      {CONSENT_CHECKBOX_CONFIG.map((group) => (
        <div
          key={group.section}
          className="brand-panel overflow-hidden"
        >
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{group.section}</p>
            <p className="text-xs text-slate-500">
              Both statements are required to attend (see page {group.page} of the PDF)
            </p>
          </div>
          <ul className="divide-y divide-slate-100 p-2">
            {group.items.map((item) => (
              <li key={item.key}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={values[item.key]}
                    onChange={(e) => toggle(item.key, e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-royal focus:ring-brand-royal"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-slate-600">
                      {item.description}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
