# Base de datos — Notification Rules

## Motor

PostgreSQL 17 instalado localmente en Ubuntu.

## Bases de datos

| Base | Uso |
|---|---|
| notification_rules_db | Desarrollo |
| notification_rules_test_db | Pruebas automatizadas |

Ambas bases son independientes.

## Conexión

- Host: 127.0.0.1
- Puerto: 5432
- Usuario: notification_rules_app
- Credenciales: archivo .env, excluido de Git

## Tablas

### notification_rules

Contiene:

- id: UUID principal
- name: nombre único
- trigger_type: disparador
- condition_logic: AND u OR
- is_active: estado
- created_at y updated_at

### notification_rule_conditions

Condiciones asociadas por rule_id.

- id: identificador
- sort_order: posición
- field_name: campo
- comparison_operator: operador
- value: valor JSONB

### notification_rule_actions

Acciones asociadas por rule_id.

- id: identificador
- sort_order: posición
- action_type: email, sms o webhook
- payload: configuración JSONB

## Esquema inicial

Archivo: sql/001_initial_schema.sql

Debe ejecutarse una sola vez por base de datos nueva.

Las modificaciones futuras deben utilizar nuevas migraciones.

## Transacciones

La creación y edición utilizan BEGIN, COMMIT y ROLLBACK.

Si falla una operación de condiciones o acciones,
la transacción completa se revierte.

## Seguridad

El usuario de aplicación:

- No es superusuario.
- No puede crear bases de datos.
- No administra el esquema.
- Utiliza consultas parametrizadas.

Solo en notification_rules_test_db se otorga permiso
DELETE sobre notification_rules para limpiar pruebas.

## Preparación de pruebas

Crear notification_rules_test_db como propietario postgres.

Revocar permisos públicos y otorgar CONNECT al usuario
notification_rules_app.

Aplicar sql/001_initial_schema.sql.

Otorgar DELETE sobre public.notification_rules
únicamente en notification_rules_test_db.

No ejecutar pruebas sobre notification_rules_db.

## Ejecución

```bash id="bcvjoe"
npm run typecheck
npm run build
npm test
```

Las pruebas utilizan DB_NAME=notification_rules_test_db,
comprueban la base conectada y eliminan únicamente sus reglas.

## Estado

Persistencia PostgreSQL operativa.
Integración con React pendiente de la siguiente etapa.
