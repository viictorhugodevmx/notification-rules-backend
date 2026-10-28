# REST Contract — Notification Rules API

## Local base URL

http://localhost:3001/api

## Endpoints

| Method | Route | Success |
|---|---|---|
| GET | /health | 200 |
| GET | /rules | 200 |
| GET | /rules/:ruleId | 200 |
| POST | /rules | 201 |
| PUT | /rules/:ruleId | 200 |
| PATCH | /rules/:ruleId/status | 200 |

## Creating and updating rules

POST /api/rules
PUT /api/rules/:ruleId

Example:

```json id="9qz551"
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

The server generates the primary UUID and defaults
new rules to isActive=true.

Updates preserve the UUID and active status.

## Updating status

PATCH /api/rules/:ruleId/status

```json id="n99n39"
{
  "isActive": false
}
```

## Errors

| HTTP | Code |
|---|---|
| 400 | BAD_REQUEST |
| 400 | INVALID_JSON |
| 404 | RULE_NOT_FOUND |
| 404 | ROUTE_NOT_FOUND |
| 409 | DUPLICATE_RULE_NAME |
| 413 | PAYLOAD_TOO_LARGE |
| 422 | VALIDATION_ERROR |
| 500 | INTERNAL_SERVER_ERROR |

Error format:

```json id="ha8u9m"
{
  "error": {
    "code": "DUPLICATE_RULE_NAME",
    "message": "Ya existe una regla con este nombre."
  }
}
```

Current error messages are written in Spanish.

## Business rules

- Required, case-insensitively unique names.
- Triggers: customer_created, payment_received,
  ticket_unanswered.
- Zero or more conditions.
- Operators depend on field types.
- AND or OR condition logic.
- At least one Email, SMS or Webhook action.
- Email requires recipient, subject and body.
- SMS messages allow up to 160 characters.
- Webhook requires HTTP/HTTPS and POST or PUT.

## Persistence

Data is stored in PostgreSQL.

A unique SQL index protects rule names.
Create and update operations use transactions.

Data survives Express process restarts.

## Tests

Automated tests use a separate database:
notification_rules_test_db.

npm test does not modify the development database.
