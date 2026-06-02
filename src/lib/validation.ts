import { z } from "zod";
import { CONSENT_CHECKBOX_CONFIG } from "./consent-checkboxes";
import { consentFormFieldsSchema } from "./consent-form-fields";

export const lookupSchema = z.object({
  code: z
    .string()
    .min(4, "Code must be at least 4 characters")
    .max(32)
    .transform((c) => c.trim().toUpperCase()),
});

export const submitSchema = z
  .object({
    code: z.string().min(4).max(32).transform((c) => c.trim().toUpperCase()),
    email: z.string().email("Please enter a valid email address"),
    signatureMethod: z.enum(["drawn", "uploaded", "typed"]),
    signatureImage: z.string().min(1, "Signature is required"),
    delegateFirstName: consentFormFieldsSchema.shape.delegateFirstName,
    delegateMiddleName: consentFormFieldsSchema.shape.delegateMiddleName,
    delegateLastName: consentFormFieldsSchema.shape.delegateLastName,
    preferredName: consentFormFieldsSchema.shape.preferredName,
    school: consentFormFieldsSchema.shape.school,
    parentName: consentFormFieldsSchema.shape.parentName,
    emergencyContact: consentFormFieldsSchema.shape.emergencyContact,
    dataConsent: z.boolean(),
    mediaConsent: z.boolean(),
  })
  .superRefine((data, ctx) => {
    for (const group of CONSENT_CHECKBOX_CONFIG) {
      for (const item of group.items) {
        const key = item.key as keyof typeof data;
        if (!data[key]) {
          ctx.addIssue({
            code: "custom",
            message: `Please agree to: ${item.label}`,
            path: [item.key],
          });
        }
      }
    }
  });
