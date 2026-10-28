# Contrato REST — Notification Rules API

## URL local

http://localhost:3001/api

## Endpoints

| Método | Ruta | Respuesta exitosa |
|---|---|---|
| GET | /health | 200 — Estado del servicio |
| GET | /rules | 200 — Listado resumido |
| GET | /rules/:ruleId | 200 — Regla completa |
| POST | /rules | 201 — Regla creada |
| PUT | /rules/:ruleId | 200 — Regla actualizada |
| PATCH | /rules/:ruleId/status | 200 — Estado actualizado |

## Crear y actualizar reglas

POST /api/rules
PUT /api/rules/:ruleId

Ambos reciben nombre, disparador, lógica, condiciones y acciones.

Ejemplo:

```json
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

El servidor genera el ID de cada regla y establece isActive=true
al crearla. Las actualizaciones conservan su ID y estado.

## Cambiar estado

PATCH /api/rules/:ruleId/status

```json
{
  "isActive": false
}
```

## Respuestas de error

| HTTP | Código | Significado |
|---|---|---|
| 400 | BAD_REQUEST | Cuerpo JSON no válido para la operación |
| 400 | INVALID_JSON | JSON mal formado |
| 404 | RULE_NOT_FOUND | Regla inexistente |
| 404 | ROUTE_NOT_FOUND | Ruta desconocida |
| 409 | DUPLICATE_RULE_NAME | Nombre duplicado |
| 413 | PAYLOAD_TOO_LARGE | Cuerpo mayor que el límite |
| 422 | VALIDATION_ERROR | Datos inválidos |
| 500 | INTERNAL_SERVER_ERROR | Error inesperado |

Formato general:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos de la regla son inválidos.",
    "details": ["actions: agrega al menos una acción."]
  }
}
```

El campo details es opcional.

## Reglas de negocio

- Nombre obligatorio y único, sin distinguir mayúsculas.
- Tres disparadores: customer_created, payment_received y ticket_unanswered.
- Cero o más condiciones; las agregadas deben ser válidas.
- Operadores según el tipo de campo y lógica AND/OR.
- Al menos una acción Email, SMS o Webhook.
- Email requiere destinatario, asunto y cuerpo.
- SMS requiere teléfono y mensaje de máximo 160 caracteres.
- Webhook requiere URL HTTP/HTTPS y método POST o PUT.

## Estado de la implementación

Paso 8: API REST con operaciones y validación del lado del servidor.

Actualmente se utiliza almacenamiento temporal en memoria.
Las reglas se pierden cuando reinicia el proceso.

La persistencia PostgreSQL y la integración con React
se implementarán en etapas posteriores.

## Pruebas

```bash
npm run typecheck
npm run build
npm test
```

Las pruebas levantan un servidor temporal independiente del servidor
de desarrollo.
