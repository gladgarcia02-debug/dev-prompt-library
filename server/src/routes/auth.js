import { Router } from "express";
import {
  createHash, randomBytes
} from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { hashPassword, validateCredentials, verifyPassword } from "../auth/credentials.js";
import {
  getClientOrigin, getGoogleRedirectUri, validOAuthState, verifiedGoogleProfile
} from "../auth/google.js";
import { pool } from "../db/pool.js";

const router = Router();
const registrationLockId = "684319720153";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." }
});

router.use(["/register", "/login"], authLimiter);

function googleConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;
  return {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: getGoogleRedirectUri()
  };
}

function frontendRedirect(result) {
  return `${getClientOrigin()}/?auth_error=${encodeURIComponent(result)}`;
}

async function googleJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
  const data = await response.json();
  if (!response.ok) throw new Error("Google authentication request failed.");
  return data;
}

async function findOrCreateGoogleUser(profile) {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [registrationLockId]);

    let result = await client.query(
      "SELECT id, email FROM users WHERE google_sub = $1",
      [profile.sub]
    );
    if (result.rowCount) {
      await client.query("COMMIT");
      transactionStarted = false;
      return result.rows[0];
    }

    result = await client.query("SELECT id, email, google_sub FROM users WHERE email = $1", [profile.email]);
    let user;
    if (result.rowCount) {
      if (result.rows[0].google_sub) {
        throw new Error("This Google account is linked to a different user.");
      }
      const linked = await client.query(
        "UPDATE users SET google_sub = $1 WHERE id = $2 AND google_sub IS NULL RETURNING id, email",
        [profile.sub, result.rows[0].id]
      );
      if (!linked.rowCount) throw new Error("Could not link this Google account.");
      user = linked.rows[0];
    } else {
      const inserted = await client.query(
        "INSERT INTO users (email, google_sub) VALUES ($1, $2) RETURNING id, email",
        [profile.email, profile.sub]
      );
      user = inserted.rows[0];
      const userCount = await client.query("SELECT COUNT(*)::int AS count FROM users");
      if (userCount.rows[0].count === 1) {
        await client.query("UPDATE prompts SET user_id = $1 WHERE user_id IS NULL", [user.id]);
        await client.query("ALTER TABLE prompts ALTER COLUMN user_id SET NOT NULL");
      }
    }

    await client.query("COMMIT");
    transactionStarted = false;
    return user;
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => error ? reject(error) : resolve());
  });
}

router.get("/google", (req, res, next) => {
  const config = googleConfig();
  if (!config) return res.redirect(frontendRedirect("google_not_configured"));

  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  req.session.googleOAuth = { state, verifier };
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account"
  }).toString();
  req.session.save((error) => {
    if (error) return next(error);
    res.redirect(authorizationUrl.toString());
  });
});

router.get("/google/callback", async (req, res, next) => {
  const config = googleConfig();
  const oauth = req.session?.googleOAuth;
  delete req.session?.googleOAuth;
  if (!config || !oauth || !validOAuthState(req.query.state, oauth.state)) {
    return res.redirect(frontendRedirect("google_failed"));
  }
  if (req.query.error) return res.redirect(frontendRedirect("google_cancelled"));
  if (typeof req.query.code !== "string") return res.redirect(frontendRedirect("google_failed"));

  try {
    const token = await googleJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
        code_verifier: oauth.verifier
      })
    });
    if (typeof token.access_token !== "string") throw new Error("Google did not return an access token.");

    const profile = await googleJson("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    const verifiedProfile = verifiedGoogleProfile(profile);
    if (!verifiedProfile) {
      return res.redirect(frontendRedirect("google_unverified_email"));
    }

    const user = await findOrCreateGoogleUser(verifiedProfile);
    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);
    res.redirect(getClientOrigin());
  } catch (error) {
    if (error.code === "23505") {
      return res.redirect(frontendRedirect("google_account_conflict"));
    }
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: "Please log in." });

  try {
    const result = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [req.session.userId]
    );
    if (!result.rowCount) {
      return req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie("devprompt.sid", { path: "/" });
        res.status(401).json({ error: "Please log in." });
      });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  const validated = validateCredentials(req.body?.email, req.body?.password, { registration: true });
  if (validated.errors) return res.status(400).json({ errors: validated.errors });

  let client;
  try {
    const passwordHash = await hashPassword(validated.data.password);
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [registrationLockId]);
    const userResult = await client.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [validated.data.email, passwordHash]
    );
    const user = userResult.rows[0];
    const userCount = await client.query("SELECT COUNT(*)::int AS count FROM users");
    if (userCount.rows[0].count === 1) {
      await client.query("UPDATE prompts SET user_id = $1 WHERE user_id IS NULL", [user.id]);
      await client.query("ALTER TABLE prompts ALTER COLUMN user_id SET NOT NULL");
    }
    await client.query("COMMIT");

    await regenerateSession(req);
    req.session.userId = user.id;
    res.status(201).json({ user });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        return next(rollbackError);
      }
    }
    if (error.code === "23505") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    next(error);
  } finally {
    client?.release();
  }
});

router.post("/login", async (req, res, next) => {
  const validated = validateCredentials(req.body?.email, req.body?.password);
  if (validated.errors) return res.status(400).json({ errors: validated.errors });

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [validated.data.email]
    );
    const user = result.rows[0];
    const passwordMatches = await verifyPassword(validated.data.password, user?.password_hash);
    if (!user || !passwordMatches) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    await regenerateSession(req);
    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  if (!req.session) return res.status(204).end();
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("devprompt.sid", { path: "/" });
    res.status(204).end();
  });
});

export default router;
