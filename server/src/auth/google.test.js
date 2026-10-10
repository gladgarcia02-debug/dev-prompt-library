import test from "node:test";
import assert from "node:assert/strict";
import {
  getClientOrigin, getGoogleRedirectUri, validOAuthState, verifiedGoogleProfile
} from "./google.js";

test("OAuth state only matches the exact expected state", () => {
  assert.equal(validOAuthState("expected-state", "expected-state"), true);
  assert.equal(validOAuthState("different-state", "expected-state"), false);
  assert.equal(validOAuthState(["expected-state"], "expected-state"), false);
  assert.equal(validOAuthState("expected-state", undefined), false);
});

test("Google profile requires a subject and verified email", () => {
  assert.deepEqual(
    verifiedGoogleProfile({ sub: "google-subject", email: " USER@Example.com ", email_verified: true }),
    { sub: "google-subject", email: "user@example.com" }
  );
  assert.equal(verifiedGoogleProfile({ sub: "id", email: "user@example.com", email_verified: false }), null);
  assert.equal(verifiedGoogleProfile({ email: "user@example.com", email_verified: true }), null);
});

test("client origin uses the deployed Vercel URL instead of localhost", () => {
  assert.equal(
    getClientOrigin({ VERCEL: "1", VERCEL_URL: "dev-prompt-library.vercel.app" }),
    "https://dev-prompt-library.vercel.app"
  );
  assert.equal(
    getClientOrigin({
      VERCEL: "1",
      VERCEL_URL: "dev-prompt-library.vercel.app",
      CLIENT_ORIGIN: "http://localhost:5173"
    }),
    "https://dev-prompt-library.vercel.app"
  );
  assert.equal(
    getClientOrigin({
      VERCEL: "1",
      VERCEL_URL: "dev-prompt-library.vercel.app",
      CLIENT_ORIGIN: "https://prompts.example.com/"
    }),
    "https://prompts.example.com"
  );
  assert.equal(getClientOrigin({}), "http://localhost:5173");
});

test("Google callback URL never falls back to localhost on Vercel", () => {
  assert.equal(
    getGoogleRedirectUri({
      VERCEL: "1",
      VERCEL_URL: "dev-prompt-library.vercel.app",
      GOOGLE_REDIRECT_URI: "http://localhost:4000/api/auth/google/callback"
    }),
    "https://dev-prompt-library.vercel.app/api/auth/google/callback"
  );
  assert.equal(
    getGoogleRedirectUri({
      VERCEL: "1",
      VERCEL_URL: "dev-prompt-library.vercel.app"
    }),
    "https://dev-prompt-library.vercel.app/api/auth/google/callback"
  );
  assert.equal(
    getGoogleRedirectUri({
      VERCEL: "1",
      VERCEL_URL: "dev-prompt-library.vercel.app",
      GOOGLE_REDIRECT_URI: "https://prompts.example.com/api/auth/google/callback"
    }),
    "https://prompts.example.com/api/auth/google/callback"
  );
  assert.equal(
    getGoogleRedirectUri({}),
    "http://localhost:4000/api/auth/google/callback"
  );
});
