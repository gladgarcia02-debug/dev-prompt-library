import test from "node:test";
import assert from "node:assert/strict";
import { requireAuth } from "./middleware.js";

test("requireAuth rejects requests without an authenticated session", () => {
  let statusCode;
  let responseBody;
  let continued = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
    }
  };

  requireAuth({ session: {} }, res, () => { continued = true; });

  assert.equal(statusCode, 401);
  assert.equal(responseBody.error, "Please log in to continue.");
  assert.equal(continued, false);
});

test("requireAuth attaches the authenticated user's id", () => {
  const req = { session: { userId: "42" } };
  let continued = false;

  requireAuth(req, {}, () => { continued = true; });

  assert.equal(req.userId, "42");
  assert.equal(continued, true);
});
