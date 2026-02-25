# Review Request System

Full-stack app: **Next.js 15 (App Router)** frontend, **Express** API, **MongoDB (Mongoose)**, **Twilio** (SMS), **SendGrid** (email). Admin dashboard, manifest upload, send review, rating page, private feedback, and redirect tracking.

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Twilio account (SMS)
- SendGrid account (email)

## Setup

### 1. API (Express)

```bash
cd api
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, TWILIO_*, SENDGRID_*, EXPRESS_URL, NEXT_PUBLIC_APP_URL
# Optional: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD to create first admin
npm install
npm run dev
```

API runs at **http://localhost:4000**.

### 2. Frontend (Next.js)

From project root:

```bash
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

App runs at **http://localhost:3000**.

## Env (API – api/.env)

| Variable | Description |
|----------|-------------|
| PORT | API port (default 4000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret for JWT auth |
| EXPRESS_URL | Public API URL (e.g. http://localhost:4000) |
| NEXT_PUBLIC_APP_URL | Public Next.js URL (e.g. http://localhost:3000) |
| TWILIO_ACCOUNT_SID | Twilio account SID |
| TWILIO_AUTH_TOKEN | Twilio auth token |
| TWILIO_PHONE_NUMBER | Twilio from number (E.164) |
| SENDGRID_API_KEY | SendGrid API key |
| SENDGRID_FROM_EMAIL | From email for SendGrid |
| SENDGRID_FROM_NAME | From name |
| SEED_ADMIN_EMAIL | (Optional) Create first admin with this email |
| SEED_ADMIN_PASSWORD | (Optional) First admin password |

## Env (Frontend – .env.local)

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | API base URL (e.g. http://localhost:4000) |

## Routes

- **/** – Landing; redirects to login or admin dashboard when logged in
- **/login** – Admin login
- **/admin/dashboard** – Dashboard (counts, recent requests)
- **/admin/manifest** – List manifests, upload CSV
- **/admin/manifest/[id]** – Manifest detail and contacts
- **/admin/send-review** – Send review (manifest, channel SMS/email, optional redirect tracking)
- **/admin/rating** – Rating page copy (title, subtitle, thank you message)
- **/admin/feedback** – Private feedback list
- **/admin/redirects** – Redirect click tracking list
- **/r/[token]** – Public rating page (link from SMS/email)

## CSV manifest format

Upload a CSV with columns such as: `name`, `phone`, `email` (or `Name`, `Phone`, `Email`). Extra columns are stored as `extra` on the contact.

## Running both

- Terminal 1: `cd api && npm run dev`
- Terminal 2: `npm run dev` (from root)
