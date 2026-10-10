import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const saltLength = 16;
const keyLength = 64;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validateCredentials(emailValue, passwordValue, { registration = false } = {}) {
  const email = normalizeEmail(emailValue);
  const errors = [];

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Enter a valid email address.");
  }
  if (typeof passwordValue !== "string" || !passwordValue) {
    errors.push("Password is required.");
  } else if (registration && passwordValue.length < 12) {
    errors.push("Password must be at least 12 characters.");
  } else if (passwordValue.length > 128) {
    errors.push("Password must be 128 characters or fewer.");
  }

  return errors.length ? { errors } : { data: { email, password: passwordValue } };
}

export async function hashPassword(password) {
  const salt = randomBytes(saltLength);
  const derivedKey = await scrypt(password, salt, keyLength);
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

const dummyPasswordHash = await hashPassword("dev-prompt-library-invalid-user");

export async function verifyPassword(password, storedHash) {
  const hasStoredHash = typeof storedHash === "string";
  const hashToCheck = hasStoredHash ? storedHash : dummyPasswordHash;
  const [algorithm, saltHex, keyHex, extra] = hashToCheck.split("$");
  if (
    algorithm !== "scrypt" ||
    extra !== undefined ||
    !new RegExp(`^[a-f0-9]{${saltLength * 2}}$`).test(saltHex || "") ||
    !new RegExp(`^[a-f0-9]{${keyLength * 2}}$`).test(keyHex || "")
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedKey = Buffer.from(keyHex, "hex");
  const derivedKey = await scrypt(password, salt, keyLength);
  const matches = timingSafeEqual(expectedKey, derivedKey);
  return hasStoredHash && matches;
}
