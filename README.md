# Notification Rules Backend

API REST de Notification Rules Builder, desarrollada con
Express, TypeScript y persistencia en PostgreSQL.

## Producción

**API pública:**
https://notification-rules-backend.onrender.com/api

**Health:**
https://notification-rules-backend.onrender.com/api/health

**Frontend:**
https://notification-rules-demo.netlify.app

## Tecnologías

- Node.js 22.19.0
- Express
- TypeScript
- node-postgres (pg)
- PostgreSQL 17 local / PostgreSQL 18 en Neon
- Node.js Test Runner

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

Configurar las variables DB_* en `.env`.

API local: http://localhost:3001/api

No subir `.env` a Git.

## Despliegue en Render

Repositorio independiente desplegado desde `main`.

Configuración:

- Runtime: Node
- Región: Ohio (US East)
- Build: `npm ci && npm run build`
- Start: `npm start`
- Plan: Free

Variables utilizadas:

| Variable | Propósito |
|---|---|
| NODE_VERSION | 22.19.0 |
| DB_HOST | Host directo de Neon |
| DB_PORT | 5432 |
| DB_NAME | neondb |
| DB_USER | Usuario PostgreSQL de Neon |
| DB_PASSWORD | Contraseña de Neon |
| PGSSLMODE | require |
| CORS_ORIGIN | https://notification-rules-demo.netlify.app |

Las contraseñas se configuran exclusivamente en Render.

Render proporciona el puerto del servidor mediante `PORT`.

## PostgreSQL en Neon

- Proyecto: `notification-rules-demo`
- Región: AWS US East 2 (Ohio)
- Base de datos: `neondb`
- Rama: `production`
- PostgreSQL 18

El esquema base está en:

`sql/001_initial_schema.sql`

Contiene las tablas:

- `notification_rules`
- `notification_rule_conditions`
- `notification_rule_actions`

Para Neon se utilizó el esquema SQL sin los GRANT
específicos del rol local `notification_rules_app`.

Las operaciones de creación y edición utilizan
transacciones SQL.

## Endpoints

| Método | Ruta |
|---|---|
| GET | /api/health |
| GET | /api/rules |
| GET | /api/rules/:ruleId |
| POST | /api/rules |
| PUT | /api/rules/:ruleId |
| PATCH | /api/rules/:ruleId/status |

Contrato completo: `docs/API_CONTRACT.md`

Configuración de base de datos: `docs/DATABASE.md`

## Validaciones

```bash
npm run typecheck
npm run build
npm test
```

Las pruebas automatizadas utilizan exclusivamente
`notification_rules_test_db`, independiente de producción.

## Seguridad y alcance

- El backend no implementa autenticación ni autorización.
- Los endpoints de escritura son públicos.
- Utilizar únicamente datos ficticios de demostración.
- Las acciones configuradas no se ejecutan realmente.
- Las credenciales PostgreSQL no deben versionarse.
- Render Free puede suspender el servicio por inactividad.

El proyecto es una demostración técnica, no un sistema
de producción preparado para datos sensibles.

## Frontend

Repositorio:
https://github.com/viictorhugodevmx/app-react-test

Demo:
https://notification-rules-demo.netlify.app

English version: [README.en.md](README.en.md).
