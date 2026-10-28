# Contrato REST — Notification Rules API

## URL local

http://localhost:3001/api

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| GET | /health | 200 |
| GET | /rules | 200 |
| GET | /rules/:ruleId | 200 |
| POST | /rules | 201 |
| PUT | /rules/:ruleId | 200 |
| PATCH | /rules/:ruleId/status | 200 |

## Crear y actualizar reglas

POST /api/rules
PUT /api/rules/:ruleId

Ejemplo:

```json id="pewrfr"
{
  "name": "Pagos importantes",
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
      "recipient": "cliente@ejemplo.com",
      "subject": "Pago recibido",
      "body": "Se recibió un pago importante."
    }
  ]
}
```

El servidor genera el UUID principal y establece
isActive=true al crear una regla.

Actualizar conserva el UUID y el estado activo.

## Cambiar estado

PATCH /api/rules/:ruleId/status

```json id="vxc807"
{
  "isActive": false
}
```

## Errores

| HTTP | Código |
|---|---|
| 400 | BAD_REQUEST |
| 400 | INVALID_JSON |
| 404 | RULE_NOT_FOUND |
| 404 | ROUTE_NOT_FOUND |
| 409 | DUPLICATE_RULE_NAME |
| 413 | PAYLOAD_TOO_LARGE |
| 422 | VALIDATION_ERROR |
| 500 | INTERNAL_SERVER_ERROR |

Formato de error:

```json id="72xtdo"
{
  "error": {
    "code": "DUPLICATE_RULE_NAME",
    "message": "Ya existe una regla con este nombre."
  }
}
```

## Reglas de negocio

- Nombre obligatorio y único sin distinguir mayúsculas.
- Disparadores: customer_created, payment_received,
  ticket_unanswered.
- Cero o más condiciones.
- Operadores según tipo de campo.
- Lógica AND u OR.
- Al menos una acción Email, SMS o Webhook.
- Email requiere destinatario, asunto y cuerpo.
- SMS admite máximo 160 caracteres.
- Webhook requiere URL HTTP/HTTPS y método POST o PUT.

## Persistencia

Los datos se almacenan en PostgreSQL.

El nombre único está protegido con un índice SQL.
La creación y edición utilizan transacciones.

Los datos sobreviven al reinicio del proceso Express.

## Pruebas

El conjunto automatizado usa una base separada:
notification_rules_test_db.

La base de desarrollo no es alterada por npm test.
