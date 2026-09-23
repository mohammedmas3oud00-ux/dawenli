import { z } from "zod";

/** Normalises (trim + lowercase) before validating so padded form input is accepted. */
export const emailSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email().max(254),
);

export const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  next: z.string().startsWith("/").max(500).optional(),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
  next: z.string().startsWith("/").max(500).optional(),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: passwordSchema,
});

export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "userExists"
  | "weakPassword"
  | "invalidEmail"
  | "oauthFailed"
  | "generic";

/** Maps Supabase auth error codes to keys in the `auth.errors` namespace. */
export function authErrorKey(code: string | undefined): AuthErrorKey {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "weak_password":
      return "weakPassword";
    case "validation_failed":
    case "email_address_invalid":
      return "invalidEmail";
    default:
      return "generic";
  }
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
