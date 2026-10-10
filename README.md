# Dev Prompt Library

A simple full-stack CRUD application for saving reusable software engineering prompts.

## Features
- Browse 12 starter prompt templates
- Search prompts by title, category, description, or content
- Create, view, edit, and delete prompts
- Copy a prompt to the clipboard
- Customize placeholders in a separate editor before copying
- Filter by category
- PostgreSQL persistence through an Express REST API

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- API: REST

## Requirements
- Node.js 20+
- PostgreSQL 14+

## Setup

### 1. Create the database
Create a PostgreSQL database named `dev_prompt_library`, or choose another name and update the backend environment variable.

```sql
CREATE DATABASE dev_prompt_library;
```

### 2. Configure the backend

```powershell
cd server
Copy-Item .env.example .env
```

Update `DATABASE_URL` in `.env` to your PostgreSQL connection string and replace
`SESSION_SECRET` with a random value. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

To enable Google sign-in, create an OAuth 2.0 Client ID in Google Cloud Console
for a web application. Add `http://localhost:4000/api/auth/google/callback` as
an authorized redirect URI, then set `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in `server/.env`. For deployment, register the matching
HTTPS callback URI and set `GOOGLE_REDIRECT_URI` to that exact URL. Leave the
Google settings empty to keep password login available without Google sign-in.
Google sign-in creates an account on first use and links to an existing account
when Google reports the same verified email address.

### 3. Install dependencies

```powershell
npm install
```

Run the install command from the repository root.

### 4. Initialize the database and start the backend

With `server/.env` configured and the database available:

```powershell
npm run db:init
npm run db:seed
npm run dev:server
```

The API runs at `http://localhost:4000`. Register with an email address and a
password of at least 12 characters. Existing prompts are assigned to the first
account registered after upgrading; subsequent accounts have separate libraries.

### 5. Start the frontend in a second terminal from the project root

```powershell
npm run dev:client
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account and log in |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the current account |
| GET | `/api/auth/google` | Start Google OAuth sign-in |
| GET | `/api/auth/google/callback` | Complete Google OAuth sign-in |
| GET | `/api/prompts` | List prompts; supports `?search=` and `?category=` |
| GET | `/api/prompts/:id` | Get one prompt |
| POST | `/api/prompts` | Create a prompt |
| PUT | `/api/prompts/:id` | Update a prompt |
| DELETE | `/api/prompts/:id` | Delete a prompt |
| GET | `/api/health` | API health check |

## Notes
- The seed script inserts the 12 starter templates only when the prompts table is empty.
- This starter version is intended for personal/local use. Authentication uses
  PostgreSQL-backed sessions, HttpOnly cookies, and a rate limit on auth routes.
  Before exposing it publicly, configure HTTPS and deployment-specific secrets
  management, and consider email verification and account recovery.
- Do not store passwords, API keys, private credentials, or sensitive personal data in prompt templates.

## Deploy to Vercel

The repository is configured as one Vercel project with two services. The
`client` service builds the React/Vite frontend, and the `server` service runs
the Express API. The top-level rewrites send `/api/*` to the server and all
other paths to the client. The browser calls the API on the same origin, so no
service binding or `VITE_API_URL` is needed. A hosted PostgreSQL database is
required; Vercel's filesystem is not persistent and must not be used for
application data.

Add these server environment variables in the Vercel project settings for each
environment you deploy:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Connection string for a hosted PostgreSQL database. Prefer the provider's pooled connection string and require TLS. |
| `SESSION_SECRET` | A unique random secret of at least 32 characters. |
| `CLIENT_ORIGIN` | The deployed site's origin, such as `https://your-project.vercel.app`, without a trailing slash. |
| `GOOGLE_CLIENT_ID` | Optional; OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Optional; OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Optional; exact callback URL, such as `https://your-project.vercel.app/api/auth/google/callback`. |

Do not set `VITE_API_URL` for this same-origin deployment; production uses
`/api` automatically. `VITE_API_URL` is only needed when the API is hosted on a
different origin.

After setting `DATABASE_URL` and `SESSION_SECRET` locally in `server/.env`, run
`npm run db:init` and `npm run db:seed` from the repository root to initialize
the hosted database. Keep `server/.env` out of Git. If enabling Google sign-in,
add the production callback URL to the OAuth client's authorized redirect URIs
and update the three Google variables above.

In Vercel, import the GitHub repository and leave the project Root Directory
at the repository root (`.`). The service roots are configured separately in
`vercel.json` as `client` and `server`. Deploy after setting the environment
variables; then check `https://your-project.vercel.app/api/health` for
`{"status":"ok"}`. You can run the services together locally with `vercel dev`
after installing and authenticating the Vercel CLI.
