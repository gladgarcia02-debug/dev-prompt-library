import { timingSafeEqual } from "node:crypto";

function isLocalhostUrl(value) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

function deploymentUrl(env) {
  if (!env.VERCEL_URL) return null;
  const hostname = env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://${hostname}`;
}

export function getClientOrigin(env = process.env) {
  const configuredOrigin = env.CLIENT_ORIGIN?.replace(/\/+$/, "");
  if (env.VERCEL === "1") {
    if (configuredOrigin && !isLocalhostUrl(configuredOrigin)) return configuredOrigin;
    const vercelOrigin = deploymentUrl(env);
    if (vercelOrigin) return vercelOrigin;
    throw new Error("Set CLIENT_ORIGIN or ensure VERCEL_URL is available in the Vercel environment.");
  }
  return configuredOrigin || "http://localhost:5173";
}

export function getGoogleRedirectUri(env = process.env) {
  const configuredUri = env.GOOGLE_REDIRECT_URI;
  if (configuredUri && !(env.VERCEL === "1" && isLocalhostUrl(configuredUri))) {
    return configuredUri;
  }
  if (env.VERCEL !== "1") {
    return "http://localhost:4000/api/auth/google/callback";
  }
  return `${getClientOrigin(env)}/api/auth/google/callback`;
}

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
