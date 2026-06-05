import { z } from "zod";

export const VISA_LETTER_CONFERENCE_ROLES = ["delegate", "chair", "advisor"] as const;

export type VisaLetterConferenceRole =
  (typeof VISA_LETTER_CONFERENCE_ROLES)[number];

export type VisaLetterFields = {
  fullName: string;
  passportNumber: string;
  nationality: string;
  conferenceRole: VisaLetterConferenceRole;
};

export const visaLetterFieldsSchema = z.object({
  fullName: z.string().min(2).max(120).transform((s) => s.trim()),
  passportNumber: z
    .string()
    .min(2)
    .max(60)
    .transform((s) => s.trim()),
  nationality: z.string().min(2).max(60).transform((s) => s.trim()),
  conferenceRole: z.enum(VISA_LETTER_CONFERENCE_ROLES),
});

