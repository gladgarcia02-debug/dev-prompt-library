import { timingSafeEqual } from "node:crypto";

export function validOAuthState(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

export function verifiedGoogleProfile(profile) {
  if (
    typeof profile?.sub !== "string" ||
    !profile.sub ||
    typeof profile.email !== "string" ||
    !profile.email.trim() ||
    profile.email_verified !== true
  ) {
    return null;
  }
  return { sub: profile.sub, email: profile.email.trim().toLowerCase() };
}
