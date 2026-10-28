# Notification Rules Backend

API REST para el proyecto Notification Rules Builder.

## Tecnologías

- Node.js 22.19.0
- Express
- TypeScript
- PostgreSQL 17
- node-postgres (pg)
- Node.js Test Runner

## Configuración

```bash id="u1dhwg"
npm install
cp .env.example .env
```

Configurar las variables DB_* en .env con las credenciales
del usuario de aplicación.

El archivo .env no debe subirse a Git.

## Desarrollo

```bash id="lxy0l5"
npm run dev
```

Servidor local: http://localhost:3001

## Validación

```bash id="c1jxkp"
npm run typecheck
npm run build
npm test
```

Las pruebas usan exclusivamente notification_rules_test_db
y limpian los registros que ellas mismas crean.

Antes de ejecutar npm test, crear esa base y aplicar
el esquema siguiendo docs/DATABASE.md.

## Endpoints

- GET /api/health
- GET /api/rules
- GET /api/rules/:ruleId
- POST /api/rules
- PUT /api/rules/:ruleId
- PATCH /api/rules/:ruleId/status

Contrato completo: docs/API_CONTRACT.md

## Persistencia

Las reglas, condiciones y acciones se almacenan en PostgreSQL.

Las operaciones de creación y edición utilizan transacciones
para mantener la integridad de los datos.

Esquema: sql/001_initial_schema.sql

Documentación: docs/DATABASE.md

## Repositorio

Backend independiente del frontend Notification Rules Builder.
