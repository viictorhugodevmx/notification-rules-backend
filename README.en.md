# Notification Rules Backend

REST API for Notification Rules Builder, developed with
Express, TypeScript, and PostgreSQL persistence.

## Live Deployment

**Public API:**
https://notification-rules-backend.onrender.com/api

**Health endpoint:**
https://notification-rules-backend.onrender.com/api/health

**Frontend:**
https://notification-rules-demo.netlify.app

## Technology

- Node.js 22.19.0
- Express
- TypeScript
- node-postgres (pg)
- PostgreSQL 17 locally / PostgreSQL 18 on Neon
- Node.js Test Runner

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Configure DB_* variables in `.env`.

Local API: http://localhost:3001/api

Never commit `.env`.

## Render Deployment

Independent repository deployed from `main`.

Configuration:

- Runtime: Node
- Region: Ohio (US East)
- Build: `npm ci && npm run build`
- Start: `npm start`
- Plan: Free

Environment variables:

| Variable | Purpose |
|---|---|
| NODE_VERSION | 22.19.0 |
| DB_HOST | Direct Neon hostname |
| DB_PORT | 5432 |
| DB_NAME | neondb |
| DB_USER | Neon PostgreSQL user |
| DB_PASSWORD | Neon database password |
| PGSSLMODE | require |
| CORS_ORIGIN | https://notification-rules-demo.netlify.app |

Database passwords are configured only in Render.

Render provides the server's `PORT` environment variable.

## PostgreSQL on Neon

- Project: `notification-rules-demo`
- Region: AWS US East 2 (Ohio)
- Database: `neondb`
- Branch: `production`
- PostgreSQL 18

The original database schema is located at:

`sql/001_initial_schema.sql`

Tables:

- `notification_rules`
- `notification_rule_conditions`
- `notification_rule_actions`

The Neon schema was initialized without the GRANT
statements specific to the local `notification_rules_app` role.

Create and update operations use SQL transactions.

## Endpoints

| Method | Route |
|---|---|
| GET | /api/health |
| GET | /api/rules |
| GET | /api/rules/:ruleId |
| POST | /api/rules |
| PUT | /api/rules/:ruleId |
| PATCH | /api/rules/:ruleId/status |

API contract: `docs/API_CONTRACT.en.md`

Database documentation: `docs/DATABASE.en.md`

## Verification

```bash
npm run typecheck
npm run build
npm test
```

Automated tests exclusively use
`notification_rules_test_db`, isolated from production.

## Security and Scope

- Authentication and authorization are not implemented.
- Write endpoints are publicly accessible.
- Use fictional demonstration data only.
- Configured notification actions are not dispatched.
- PostgreSQL credentials must never be committed.
- Render Free may spin down during inactivity.

This is a technical demonstration and is not
suitable for processing sensitive production data.

## Frontend

Repository:
https://github.com/viictorhugodevmx/app-react-test

Live demo:
https://notification-rules-demo.netlify.app

Spanish version: [README.md](README.md).
