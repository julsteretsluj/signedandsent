import { z } from "zod";

/** Section 1 fields — typed on the website and drawn onto page 1 of the PDF. */
export const consentFormFieldsSchema = z.object({
  delegateName: z.string().min(1, "Delegate full name is required").max(120),
  preferredName: z
    .string()
    .max(80)
    .optional()
    .transform((v) => v?.trim() || undefined),
  school: z.string().min(1, "School / institution is required").max(120),
  parentName: z.string().min(1, "Parent / guardian name is required").max(120),
  emergencyContact: z
    .string()
    .min(5, "Emergency contact number is required")
    .max(40),
});

export type ConsentFormFields = {
  delegateName: string;
  preferredName?: string;
  school: string;
  parentName: string;
  emergencyContact: string;
};

export type ConsentFieldConfig = {
  key: keyof ConsentFormFields;
  label: string;
  placeholder: string;
  guide: string;
  optional?: boolean;
  inputMode?: "text" | "tel";
};

export const CONSENT_FORM_FIELDS: ConsentFieldConfig[] = [
  {
    key: "delegateName",
    label: "Delegate full name",
    placeholder: "e.g. Jordan Kai Rivers",
    guide:
      "Your child's full legal name (as on passport or school records).",
  },
  {
    key: "preferredName",
    label: "Preferred name (optional)",
    placeholder: "e.g. J.K.",
    optional: true,
    guide:
      "Name your child prefers to be called at the conference, if different from their legal name.",
  },
  {
    key: "school",
    label: "School / institution",
    placeholder: "e.g. Northbridge Model United Nations Academy",
    guide: "The school or organisation your child represents.",
  },
  {
    key: "parentName",
    label: "Parent / guardian name",
    placeholder: "e.g. Ms. Taylor Morgan",
    guide: "Full name of the parent or legal guardian signing this form.",
  },
  {
    key: "emergencyContact",
    label: "Emergency contact number",
    placeholder: "e.g. +1 555 010 2847",
    guide:
      "Phone number reachable during the conference (16–17 Jan 2027). Include country code.",
    inputMode: "tel",
  },
];

/** PDF coordinates (origin bottom-left), aligned to underscore lines on page 1. */
export const PDF_TEXT_FIELDS: {
  key: "delegateName" | "school" | "parentName" | "emergencyContact";
  page: number;
  x: number;
  y: number;
  size: number;
  maxChars: number;
}[] = [
  { key: "delegateName", page: 0, x: 228, y: 662, size: 10, maxChars: 48 },
  { key: "school", page: 0, x: 220, y: 634, size: 10, maxChars: 52 },
  { key: "parentName", page: 0, x: 248, y: 607, size: 10, maxChars: 44 },
  { key: "emergencyContact", page: 0, x: 280, y: 579, size: 10, maxChars: 28 },
];

/** Shown below delegate name on page 1 when provided. */
export const PDF_PREFERRED_NAME = {
  page: 0,
  x: 228,
  y: 648,
  size: 9,
  maxChars: 40,
  prefix: "Preferred name: ",
};
