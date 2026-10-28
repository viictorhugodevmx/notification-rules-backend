import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';

import express from 'express';

import { app } from '../dist/app.js';
import { pool } from '../dist/db/pool.js';

import {
  handleApiError,
} from '../dist/middleware/errorHandlers.js';

// Protección: nunca ejecutar estas pruebas sobre desarrollo.
const testDatabaseName = 'notification_rules_test_db';

if (process.env.DB_NAME !== testDatabaseName) {
  throw new Error(
    `Las pruebas requieren DB_NAME=${testDatabaseName}.`
  );
}

let server;
let baseUrl;

const createdRuleIds = new Set();

async function startTestServer(application) {
  const testServer = application.listen(0, '127.0.0.1');

  await once(testServer, 'listening');

  const address = testServer.address();

  if (!address || typeof address === 'string') {
    throw new Error('No se pudo obtener el puerto de pruebas.');
  }

  return {
    server: testServer,
    url: `http://127.0.0.1:${address.port}`,
  };
}

async function stopTestServer(testServer) {
  await new Promise((resolve, reject) => {
    testServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestApi(
  path,
  { method = 'GET', body, headers = {} } = {}
) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers:
      body === undefined
        ? headers
        : {
            'Content-Type': 'application/json',
            ...headers,
          },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
}

function createValidRuleInput(name) {
  return {
    name,
    trigger: 'payment_received',
    conditionLogic: 'AND',
    conditions: [
      {
        id: 'condition-1',
        field: 'monto',
        operator: 'greater_than',
        value: 1500,
      },
    ],
    actions: [
      {
        id: 'action-1',
        type: 'email',
        recipient: 'cliente@ejemplo.com',
        subject: 'Pago recibido',
        body: 'Se recibió un pago.',
      },
    ],
  };
}

async function createTestRule(input) {
  const response = await requestApi('/api/rules', {
    method: 'POST',
    body: input,
  });

  const body = await response.json();

  if (typeof body.id === 'string') {
    createdRuleIds.add(body.id);
  }

  assert.equal(
    response.status,
    201,
    `Error al crear regla: ${JSON.stringify(body)}`
  );

  return body;
}

before(async () => {
  const databaseResult = await pool.query(`
    SELECT current_database() AS name
  `);

  assert.equal(
    databaseResult.rows[0]?.name,
    testDatabaseName,
    'Las pruebas no están conectadas a su base exclusiva.'
  );

  const started = await startTestServer(app);

  server = started.server;
  baseUrl = started.url;
});

after(async () => {
  try {
    if (server) {
      await stopTestServer(server);
    }

    if (createdRuleIds.size > 0) {
      const ruleIds = [...createdRuleIds];

      const result = await pool.query(
        `
          DELETE FROM public.notification_rules
          WHERE id = ANY($1::uuid[])
        `,
        [ruleIds]
      );

      assert.equal(
        result.rowCount,
        ruleIds.length,
        'No se pudieron limpiar todas las reglas de prueba.'
      );
    }
  } finally {
    await pool.end();
  }
});

test('GET /api/health responde 200 y permite CORS', async () => {
  const response = await requestApi('/api/health', {
    headers: {
      Origin: 'http://localhost:5173',
    },
  });

  assert.equal(response.status, 200);

  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://localhost:5173'
  );

  assert.equal(response.headers.get('x-powered-by'), null);

  const body = await response.json();

  assert.equal(body.status, 'ok');
});

test('Una ruta inexistente responde HTTP 404', async () => {
  const response = await requestApi('/api/unknown');

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
});

test('JSON mal formado responde HTTP 400', async () => {
  const response = await fetch(`${baseUrl}/api/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{"name":',
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(body.error.code, 'INVALID_JSON');
});

test('Un cuerpo demasiado grande responde HTTP 413', async () => {
  const response = await requestApi('/api/rules', {
    method: 'POST',
    body: {
      name: 'x'.repeat(120_000),
    },
  });

  assert.equal(response.status, 413);

  const body = await response.json();

  assert.equal(body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('El CRUD guarda reglas completas en PostgreSQL', async () => {
  const ruleName = `Prueba CRUD ${randomUUID()}`;

  const createdRule = await createTestRule(
    createValidRuleInput(ruleName)
  );

  assert.ok(createdRule.id);
  assert.equal(createdRule.isActive, true);

  const detailResponse = await requestApi(
    `/api/rules/${createdRule.id}`
  );

  assert.equal(detailResponse.status, 200);

  const detailedRule = await detailResponse.json();

  assert.equal(detailedRule.name, ruleName);
  assert.equal(detailedRule.conditions.length, 1);
  assert.equal(detailedRule.actions.length, 1);

  const updatedName = `Regla actualizada ${randomUUID()}`;

  const updatedInput = {
    ...createValidRuleInput(updatedName),
    conditionLogic: 'OR',
    conditions: [
      {
        id: 'condition-1',
        field: 'monto',
        operator: 'greater_than',
        value: 2500,
      },
      {
        id: 'condition-2',
        field: 'moneda',
        operator: 'equals',
        value: 'MXN',
      },
    ],
    actions: [
      {
        id: 'action-1',
        type: 'email',
        recipient: 'cliente@ejemplo.com',
        subject: 'Pago actualizado',
        body: 'El pago se actualizó.',
      },
      {
        id: 'action-2',
        type: 'sms',
        phoneNumber: '5512345678',
        message: 'Pago recibido',
      },
      {
        id: 'action-3',
        type: 'webhook',
        url: 'https://example.com/notifications',
        method: 'POST',
      },
    ],
  };

  const updateResponse = await requestApi(
    `/api/rules/${createdRule.id}`,
    {
      method: 'PUT',
      body: updatedInput,
    }
  );

  assert.equal(updateResponse.status, 200);

  const updatedRule = await updateResponse.json();

  assert.equal(updatedRule.id, createdRule.id);
  assert.equal(updatedRule.name, updatedName);
  assert.equal(updatedRule.conditionLogic, 'OR');
  assert.equal(updatedRule.conditions.length, 2);
  assert.equal(updatedRule.conditions[0].id, 'condition-1');
  assert.equal(updatedRule.conditions[0].value, 2500);
  assert.equal(updatedRule.conditions[1].value, 'MXN');
  assert.equal(updatedRule.actions.length, 3);
  assert.equal(updatedRule.actions[0].type, 'email');
  assert.equal(updatedRule.actions[1].type, 'sms');
  assert.equal(updatedRule.actions[2].type, 'webhook');

  const statusResponse = await requestApi(
    `/api/rules/${createdRule.id}/status`,
    {
      method: 'PATCH',
      body: { isActive: false },
    }
  );

  assert.equal(statusResponse.status, 200);

  const inactiveRule = await statusResponse.json();

  assert.equal(inactiveRule.isActive, false);

  // Verificar directamente en PostgreSQL.
  const databaseResult = await pool.query(
    `
      SELECT
        rule.name,
        rule.is_active AS "isActive",

        (
          SELECT COUNT(*)::integer
          FROM public.notification_rule_conditions
          WHERE rule_id = rule.id
        ) AS "totalConditions",

        (
          SELECT COUNT(*)::integer
          FROM public.notification_rule_actions
          WHERE rule_id = rule.id
        ) AS "totalActions"

      FROM public.notification_rules AS rule
      WHERE rule.id = $1
    `,
    [createdRule.id]
  );

  assert.equal(databaseResult.rows.length, 1);
  assert.equal(databaseResult.rows[0].name, updatedName);
  assert.equal(databaseResult.rows[0].isActive, false);
  assert.equal(databaseResult.rows[0].totalConditions, 2);
  assert.equal(databaseResult.rows[0].totalActions, 3);

  const listResponse = await requestApi('/api/rules');

  assert.equal(listResponse.status, 200);

  const rules = await listResponse.json();

  assert.ok(
    rules.some(
      (rule) =>
        rule.id === createdRule.id &&
        rule.isActive === false
    )
  );

  const duplicateResponse = await requestApi('/api/rules', {
    method: 'POST',
    body: createValidRuleInput(updatedName.toUpperCase()),
  });

  assert.equal(duplicateResponse.status, 409);

  const duplicateBody = await duplicateResponse.json();

  assert.equal(
    duplicateBody.error.code,
    'DUPLICATE_RULE_NAME'
  );
});

test('Permite reglas sin condiciones con SMS y Webhook', async () => {
  const input = {
    name: `Regla sin condiciones ${randomUUID()}`,
    trigger: 'customer_created',
    conditionLogic: 'AND',
    conditions: [],
    actions: [
      {
        id: 'sms-1',
        type: 'sms',
        phoneNumber: '5512345678',
        message: 'Bienvenido',
      },
      {
        id: 'webhook-1',
        type: 'webhook',
        url: 'https://example.com/events',
        method: 'PUT',
      },
    ],
  };

  const createdRule = await createTestRule(input);

  assert.equal(createdRule.conditions.length, 0);
  assert.equal(createdRule.actions.length, 2);
  assert.equal(createdRule.actions[0].type, 'sms');
  assert.equal(createdRule.actions[1].method, 'PUT');
});

test('La API rechaza datos y estados incorrectos', async () => {
  const invalidActionsResponse = await requestApi('/api/rules', {
    method: 'POST',
    body: {
      ...createValidRuleInput(`Sin acciones ${randomUUID()}`),
      actions: [],
    },
  });

  assert.equal(invalidActionsResponse.status, 422);

  const invalidActionsBody =
    await invalidActionsResponse.json();

  assert.equal(
    invalidActionsBody.error.code,
    'VALIDATION_ERROR'
  );

  const invalidConditionResponse = await requestApi(
    '/api/rules',
    {
      method: 'POST',
      body: {
        ...createValidRuleInput(`Campo inválido ${randomUUID()}`),
        trigger: 'customer_created',
      },
    }
  );

  assert.equal(invalidConditionResponse.status, 422);

  const invalidBodyResponse = await requestApi('/api/rules', {
    method: 'POST',
    body: [],
  });

  assert.equal(invalidBodyResponse.status, 400);

  const missingRuleResponse = await requestApi(
    `/api/rules/${randomUUID()}`
  );

  assert.equal(missingRuleResponse.status, 404);

  const missingRuleBody = await missingRuleResponse.json();

  assert.equal(
    missingRuleBody.error.code,
    'RULE_NOT_FOUND'
  );

  const invalidStatusResponse = await requestApi(
    `/api/rules/${randomUUID()}/status`,
    {
      method: 'PATCH',
      body: { isActive: 'false' },
    }
  );

  assert.equal(invalidStatusResponse.status, 404);

  const existingRule = await createTestRule(
    createValidRuleInput(`Validar estado ${randomUUID()}`)
  );

  const existingInvalidStatusResponse = await requestApi(
    `/api/rules/${existingRule.id}/status`,
    {
      method: 'PATCH',
      body: { isActive: 'false' },
    }
  );

  assert.equal(existingInvalidStatusResponse.status, 422);
});

test('Los errores internos no exponen información privada', async () => {
  const testApp = express();

  testApp.get('/fail', () => {
    throw new Error('PRIVATE_INTERNAL_DETAIL');
  });

  testApp.use(handleApiError);

  const started = await startTestServer(testApp);

  try {
    const response = await fetch(`${started.url}/fail`);

    assert.equal(response.status, 500);

    const body = await response.json();

    assert.equal(
      body.error.code,
      'INTERNAL_SERVER_ERROR'
    );

    assert.equal(
      JSON.stringify(body).includes('PRIVATE_INTERNAL_DETAIL'),
      false
    );
  } finally {
    await stopTestServer(started.server);
  }
});
