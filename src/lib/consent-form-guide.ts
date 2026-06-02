export type GuideFieldType = "text" | "signature" | "date" | "acknowledgment" | "note";

export type GuideField = {
  id: string;
  label: string;
  guide: string;
  example?: string;
  type: GuideFieldType;
  required: boolean;
};

export type GuideStep = {
  step: number;
  page: 1 | 2;
  section: string;
  intro?: string;
  fields: GuideField[];
};

/** Step-by-step guide derived from the official SEAMUN I 2027 parental consent PDF. */
export const CONSENT_FORM_GUIDE: GuideStep[] = [
  {
    step: 1,
    page: 1,
    section: "Section 1 — Delegate & parent information",
    intro:
      "Use the text boxes in Section 1 below (they are added to page 1 of the PDF automatically). Match passport or school records spelling.",
    fields: [
      {
        id: "delegate-first-name",
        label: "First name",
        type: "text",
        required: true,
        guide: "Your child's legal first name, as on passport or school records.",
        example: "e.g. Jordan",
      },
      {
        id: "delegate-middle-name",
        label: "Middle name (optional)",
        type: "text",
        required: false,
        guide: "Middle name or initial, if applicable.",
        example: "e.g. Kai",
      },
      {
        id: "delegate-last-name",
        label: "Last name",
        type: "text",
        required: true,
        guide: "Your child's legal surname or family name.",
        example: "e.g. Rivers",
      },
      {
        id: "preferred-name",
        label: "Preferred name (optional)",
        type: "text",
        required: false,
        guide:
          "If provided, appears in brackets after the first and middle names on the PDF.",
        example: "e.g. Jordan Kai (J.K.) Rivers",
      },
      {
        id: "school",
        label: "School / institution",
        type: "text",
        required: true,
        guide:
          "The school or organisation the delegate represents at the conference.",
        example: "e.g. Northbridge Model United Nations Academy",
      },
      {
        id: "parent-name",
        label: "Parent / guardian name",
        type: "text",
        required: true,
        guide:
          "Full name of the parent or legal guardian signing this form (the undersigned in Section 2).",
        example: "e.g. Ms. Taylor Morgan or Mr. Casey Quinn Harper",
      },
      {
        id: "emergency-contact",
        label: "Emergency contact number",
        type: "text",
        required: true,
        guide:
          "A phone number where we can reach you during the conference (16–17 January 2027). Include country code if outside Thailand.",
        example: "e.g. +1 555 010 2847 or +44 5550 100 284",
      },
    ],
  },
  {
    step: 2,
    page: 1,
    section: "Section 2 — Consent for attendance & participation",
    intro:
      "There are no blanks to write here. Read each bullet carefully — by signing later you confirm you understand and agree to all three points.",
    fields: [
      {
        id: "supervision",
        label: "Supervision",
        type: "acknowledgment",
        required: true,
        guide:
          "You understand the summit maintains a strict 1:1 adult-to-room ratio for oversight and safeguarding.",
      },
      {
        id: "independent-initiative",
        label: "Independent initiative",
        type: "acknowledgment",
        required: true,
        guide:
          "You acknowledge SEAMUN I is an independent, non-profit student-led initiative; proceeds support the Thai Red Cross Society (TRCS).",
      },
      {
        id: "financial",
        label: "Financial responsibility",
        type: "acknowledgment",
        required: true,
        guide:
          "You accept that travel, medical insurance, and accommodation costs are your responsibility or your child's home institution's.",
      },
    ],
  },
  {
    step: 3,
    page: 2,
    section: "Section 3 — Data protection & PDPA compliance",
    intro:
      "Read the four numbered purposes (visa letters, InterMUN platform, media/photography, humanitarian reporting). Both consent statements below are mandatory to attend.",
    fields: [
      {
        id: "data-consent",
        label: "Personal data consent",
        type: "acknowledgment",
        required: true,
        guide:
          'You consent to collection and use of your child\'s personal data for academic and disclosed administrative purposes of SEAMUN I 2027 (passport details, names, school affiliation, registration, etc.).',
      },
      {
        id: "media-consent",
        label: "Image / likeness consent",
        type: "acknowledgment",
        required: true,
        guide:
          "You consent to your child being photographed or filmed for the official website, social media, and post-summit Impact Report. If you do not consent to both statements in this section, registration cannot proceed.",
      },
    ],
  },
  {
    step: 4,
    page: 2,
    section: "Section 4 — Medical & safeguarding",
    intro: "No blanks on this section — read and confirm you understand before signing.",
    fields: [
      {
        id: "medical-fit",
        label: "Medical fitness",
        type: "acknowledgment",
        required: true,
        guide:
          "You confirm your child is medically fit to attend the conference.",
      },
      {
        id: "medical-dietary-form",
        label: "Medical & dietary form (separate)",
        type: "note",
        required: false,
        guide:
          "Any specific medical conditions or dietary requirements must be disclosed on the official Medical and Dietary Form (separate from this document). Submit that form to organisers as instructed.",
        example: "Ask your school delegate coordinator or email information@seamun.com",
      },
      {
        id: "emergency-authorisation",
        label: "Emergency medical authorisation",
        type: "acknowledgment",
        required: true,
        guide:
          "In a medical emergency, you authorise the SEAMUN Secretariat and Faculty Advisors to seek professional care at the nearest medical facility.",
      },
    ],
  },
  {
    step: 5,
    page: 2,
    section: "Section 5 — Declaration",
    intro:
      "Confirm the information you entered in Section 1 is accurate, then complete your signature and date below on this website.",
    fields: [
      {
        id: "declaration",
        label: "Accuracy declaration",
        type: "acknowledgment",
        required: true,
        guide:
          "You have read and understood the summit and data privacy policies and confirm all information provided is accurate.",
      },
      {
        id: "signature",
        label: "Parent / guardian signature",
        type: "signature",
        required: true,
        guide:
          "Use the signature panel below (draw, type your name in a script font, or upload an image of your handwritten signature). This must match the parent/guardian name in Section 1.",
        example: "Same person as “Parent/Guardian Name” on page 1",
      },
      {
        id: "date",
        label: "Date",
        type: "date",
        required: true,
        guide:
          "Today's date is added automatically on the PDF when you submit. You do not need to write the date separately on the paper form if submitting digitally.",
        example: "Filled in automatically on submit",
      },
    ],
  },
  {
    step: 6,
    page: 2,
    section: "Submit on this website",
    intro: "After completing the PDF blanks and your digital signature:",
    fields: [
      {
        id: "email",
        label: "Your email address",
        type: "text",
        required: true,
        guide:
          "Enter the email address where you want confirmation sent. Use an inbox you check regularly.",
        example: "e.g. guardian@example.com",
      },
      {
        id: "confirmation",
        label: "Final confirmation checkbox",
        type: "acknowledgment",
        required: true,
        guide:
          "Tick the box to confirm you are the parent/legal guardian and that your electronic signature is legally binding.",
      },
    ],
  },
];

export const GUIDE_SUMMARY = {
  conferenceDates: "16–17 January 2027",
  venue: "Riverside International Academy, Bangkok (Example Campus)",
  contacts: [
    { role: "Secretary General", email: "secretary-general@example-seamun.org" },
    { role: "SMT", email: "information@seamun.com" },
  ],
};
