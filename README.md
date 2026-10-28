# Notification Rules Backend

API REST del proyecto Notification Rules Builder.

## Tecnologías

- Node.js 22.19.0
- Express
- TypeScript
- PostgreSQL (próxima etapa de persistencia)

## Preparación

```bash
npm install
cp .env.example .env
```

## Desarrollo

```bash
npm run dev
```

Servidor local: http://localhost:3001

## Validación

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

Consulta el contrato completo en docs/API_CONTRACT.md.

## Persistencia

El backend utiliza actualmente un almacenamiento temporal en memoria.
Las reglas se pierden al reiniciar el servidor.

La persistencia con PostgreSQL se implementará posteriormente.

## Repositorio

Proyecto independiente del frontend Notification Rules Builder.
