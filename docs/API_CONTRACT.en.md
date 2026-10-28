# REST Contract — Notification Rules API

## Local base URL

http://localhost:3001/api

## Endpoints

| Method | Route | Success response |
|---|---|---|
| GET | /health | 200 — Service status |
| GET | /rules | 200 — Rule summaries |
| GET | /rules/:ruleId | 200 — Complete rule |
| POST | /rules | 201 — Rule created |
| PUT | /rules/:ruleId | 200 — Rule updated |
| PATCH | /rules/:ruleId/status | 200 — Status updated |

## Creating and updating rules

POST /api/rules
PUT /api/rules/:ruleId

Both accept name, trigger, condition logic, conditions and actions.

Example:

```json
{
  "name": "Important payments",
  "trigger": "payment_received",
  "conditionLogic": "AND",
  "conditions": [
    {
      "id": "condition-1",
      "field": "monto",
      "operator": "greater_than",
      "value": 1500
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "type": "email",
      "recipient": "customer@example.com",
      "subject": "Payment received",
      "body": "An important payment was received."
    }
  ]
}
```

The server generates rule IDs and defaults new rules to
isActive=true. Updates preserve the rule ID and active status.

## Status update

PATCH /api/rules/:ruleId/status

```json
{
  "isActive": false
}
```

## Error responses

| HTTP | Code | Meaning |
|---|---|---|
| 400 | BAD_REQUEST | Invalid request body |
| 400 | INVALID_JSON | Malformed JSON |
| 404 | RULE_NOT_FOUND | Rule does not exist |
| 404 | ROUTE_NOT_FOUND | Unknown route |
| 409 | DUPLICATE_RULE_NAME | Duplicate name |
| 413 | PAYLOAD_TOO_LARGE | Request body exceeds limit |
| 422 | VALIDATION_ERROR | Invalid rule data |
| 500 | INTERNAL_SERVER_ERROR | Unexpected error |

General format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos de la regla son inválidos.",
    "details": ["actions: agrega al menos una acción."]
  }
}
```

The details property is optional. Current API error messages
are written in Spanish.

## Business rules

- Rule names are required and case-insensitively unique.
- Three triggers are supported.
- Zero or more conditions; configured conditions must be valid.
- Field-specific operators with AND/OR logic.
- At least one Email, SMS or Webhook action.
- Email requires recipient, subject and body.
- SMS requires a phone number and a message up to 160 characters.
- Webhook requires an HTTP/HTTPS URL and POST or PUT.

## Implementation status

Step 8: working REST API with server-side validation.

Storage is currently in memory. Rules are lost on server restart.

PostgreSQL persistence and React integration are planned
for subsequent stages.

## Tests

```bash
npm run typecheck
npm run build
npm test
```

Integration tests use an independent temporary server.
