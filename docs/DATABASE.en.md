# Database — Notification Rules

## Engine

PostgreSQL 17 installed locally on Ubuntu.

## Databases

| Database | Purpose |
|---|---|
| notification_rules_db | Development |
| notification_rules_test_db | Automated tests |

Both databases are independent.

## Connection

- Host: 127.0.0.1
- Port: 5432
- User: notification_rules_app
- Credentials: .env, excluded from Git

## Tables

### notification_rules

Stores:

- id: primary UUID
- name: unique name
- trigger_type: trigger
- condition_logic: AND or OR
- is_active: active state
- created_at and updated_at

### notification_rule_conditions

Conditions linked by rule_id.

- id: condition identifier
- sort_order: position
- field_name: field
- comparison_operator: operator
- value: JSONB value

### notification_rule_actions

Actions linked by rule_id.

- id: action identifier
- sort_order: position
- action_type: email, sms or webhook
- payload: JSONB action configuration

## Initial schema

File: sql/001_initial_schema.sql

Run once for each new database.

Future schema changes should use new migrations.

## Transactions

Create and update operations use BEGIN, COMMIT and ROLLBACK.

If any condition or action operation fails,
the entire transaction is rolled back.

## Security

The application user:

- Is not a superuser.
- Cannot create databases.
- Cannot administer the schema.
- Uses parameterized queries.

Only notification_rules_test_db grants DELETE
on notification_rules for test cleanup.

## Test setup

Create notification_rules_test_db owned by postgres.

Revoke public database privileges and grant CONNECT
to notification_rules_app.

Apply sql/001_initial_schema.sql.

Grant DELETE on public.notification_rules
only in notification_rules_test_db.

Never run tests against notification_rules_db.

## Execution

```bash id="si1lmi"
npm run typecheck
npm run build
npm test
```

Tests use DB_NAME=notification_rules_test_db,
verify their database and remove only their own records.

## Status

PostgreSQL persistence is operational.
React integration is planned for a subsequent stage.
