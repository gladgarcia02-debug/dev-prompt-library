import test from "node:test";
import assert from "node:assert/strict";
import { validOAuthState, verifiedGoogleProfile } from "./google.js";

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
