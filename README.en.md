# Notification Rules Backend

REST API for the Notification Rules Builder project.

## Technology

- Node.js 22.19.0
- Express
- TypeScript
- PostgreSQL (upcoming persistence stage)

## Setup

```bash
npm install
cp .env.example .env
```

## Development

```bash
npm run dev
```

Local server: http://localhost:3001

## Validation

```bash
npm run typecheck
npm run build
npm test
```

## Endpoints

- GET /api/health
- GET /api/rules
- GET /api/rules/:ruleId
- POST /api/rules
- PUT /api/rules/:ruleId
- PATCH /api/rules/:ruleId/status

See docs/API_CONTRACT.en.md for the complete API contract.

## Persistence

The backend currently uses temporary in-memory storage.
Rules are lost when the server restarts.

PostgreSQL persistence will be implemented later.

## Repository

Independent backend project for Notification Rules Builder.
