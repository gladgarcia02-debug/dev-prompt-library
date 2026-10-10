import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, validateCredentials, verifyPassword } from "./credentials.js";

test("registration validates and normalizes an email address", () => {
  assert.deepEqual(
    validateCredentials("  PERSON@Example.com ", "long-enough-password", { registration: true }),
    { data: { email: "person@example.com", password: "long-enough-password" } }
  );
  assert.ok(validateCredentials("not-an-email", "long-enough-password", { registration: true }).errors);
});

test("registration requires a 12-character password and caps password length", () => {
  assert.ok(validateCredentials("person@example.com", "short", { registration: true }).errors);
  assert.ok(validateCredentials("person@example.com", "x".repeat(129)).errors);
  assert.ok(validateCredentials("person@example.com", "x".repeat(12), { registration: true }).data);
});

test("passwords are salted and verified without storing plaintext", async () => {
  const password = "correct horse battery staple";
  const firstHash = await hashPassword(password);
  const [algorithm, firstSalt] = firstHash.split("$");
  const secondHash = await hashPassword(password);

  assert.equal(algorithm, "scrypt");
  assert.notEqual(firstSalt, secondHash.split("$")[1]);
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword("wrong password", firstHash), false);
  assert.equal(await verifyPassword(password, undefined), false);
});
