/**
 * Shared access codes distributed via Google Form / school comms.
 *
 * The legacy `SHARED_ACCESS_CODE` env var (previously used for consent) is
 * still supported as an alias for `SHARED_CONSENT_ACCESS_CODE`.
 */
const LEGACY_SHARED_ACCESS_CODE = process.env.SHARED_ACCESS_CODE?.trim().toUpperCase();

/** Previously the default consent code; kept for backwards-compatible lookups. */
export const LEGACY_CONSENT_ACCESS_CODE = "SEAMUN2027";

export const SHARED_CONSENT_ACCESS_CODE =
  process.env.SHARED_CONSENT_ACCESS_CODE?.trim().toUpperCase() ??
  LEGACY_SHARED_ACCESS_CODE ??
  "SEAMUNCONSENT2027";

export const SHARED_VISA_LETTER_ACCESS_CODE =
  process.env.SHARED_VISA_LETTER_ACCESS_CODE?.trim().toUpperCase() ??
  "SEAMUNVISA2027";

/** Backwards-compatible alias. Prefer `SHARED_CONSENT_ACCESS_CODE`. */
export const SHARED_ACCESS_CODE = SHARED_CONSENT_ACCESS_CODE;
