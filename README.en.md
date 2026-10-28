# Notification Rules Backend

REST API for the Notification Rules Builder project.

## Technology

- Node.js 22.19.0
- Express
- TypeScript
- PostgreSQL 17
- node-postgres (pg)
- Node.js Test Runner

## Setup

```bash id="qmku9b"
npm install
cp .env.example .env
```

Configure DB_* variables in .env using the application
database credentials.

Never commit .env to Git.

## Development

```bash id="sfqn98"
npm run dev
```

Local server: http://localhost:3001

## Validation

```bash id="hl7jbs"
npm run typecheck
npm run build
npm test
```

Tests exclusively use notification_rules_test_db
and clean up the records created during each run.

Create the test database and apply the schema before
running npm test. See docs/DATABASE.en.md.

## Endpoints

- GET /api/health
- GET /api/rules
- GET /api/rules/:ruleId
- POST /api/rules
- PUT /api/rules/:ruleId
- PATCH /api/rules/:ruleId/status

Full contract: docs/API_CONTRACT.en.md

## Persistence

Rules, conditions and actions are stored in PostgreSQL.

Create and update operations use SQL transactions
to preserve data integrity.

Schema: sql/001_initial_schema.sql

Documentation: docs/DATABASE.en.md

## Repository

Independent backend for Notification Rules Builder.
