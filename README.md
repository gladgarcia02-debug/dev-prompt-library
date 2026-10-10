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

### 3. Install, initialize, and start the backend

```powershell
npm install
npm run db:init
npm run db:seed
npm run dev
```

Run these commands in the same backend terminal, still in the `server` directory.

The API runs at `http://localhost:4000`. Register with an email address and a
password of at least 12 characters. Existing prompts are assigned to the first
account registered after upgrading; subsequent accounts have separate libraries.

### 4. Start the frontend in a second terminal from the project root

```powershell
cd client
npm install
npm run dev
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
