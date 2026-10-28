import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';

import express from 'express';

import { app } from '../dist/app.js';
import {
  handleApiError,
} from '../dist/middleware/errorHandlers.js';

let server;
let baseUrl;

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

const validRuleInput = {
  name: 'Notificación de pagos de prueba',
  trigger: 'payment_received',
  conditionLogic: 'AND',
  conditions: [
    {
      id: 'condition-test-1',
      field: 'monto',
      operator: 'greater_than',
      value: 1500,
    },
  ],
  actions: [
    {
      id: 'action-test-1',
      type: 'email',
      recipient: 'cliente@ejemplo.com',
      subject: 'Pago recibido',
      body: 'Se recibió un pago.',
    },
  ],
};

before(async () => {
  const started = await startTestServer(app);

  server = started.server;
  baseUrl = started.url;
});

after(async () => {
  if (server) {
    await stopTestServer(server);
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

test('Una ruta inexistente responde JSON con HTTP 404', async () => {
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

test('El CRUD permite crear, consultar, editar y desactivar', async () => {
  const createResponse = await requestApi('/api/rules', {
    method: 'POST',
    body: validRuleInput,
  });

  assert.equal(createResponse.status, 201);

  const createdRule = await createResponse.json();

  assert.ok(createdRule.id);
  assert.equal(createdRule.isActive, true);

  const detailResponse = await requestApi(
    `/api/rules/${createdRule.id}`
  );

  assert.equal(detailResponse.status, 200);

  const detailedRule = await detailResponse.json();

  assert.equal(detailedRule.conditions.length, 1);
  assert.equal(detailedRule.actions.length, 1);

  const updateResponse = await requestApi(
    `/api/rules/${createdRule.id}`,
    {
      method: 'PUT',
      body: {
        ...validRuleInput,
        name: 'Regla de pagos actualizada',
      },
    }
  );

  assert.equal(updateResponse.status, 200);

  const updatedRule = await updateResponse.json();

  assert.equal(updatedRule.id, createdRule.id);
  assert.equal(updatedRule.name, 'Regla de pagos actualizada');

  const statusResponse = await requestApi(
    `/api/rules/${createdRule.id}/status`,
    {
      method: 'PATCH',
      body: {
        isActive: false,
      },
    }
  );

  assert.equal(statusResponse.status, 200);

  const inactiveRule = await statusResponse.json();

  assert.equal(inactiveRule.isActive, false);

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
    body: {
      ...validRuleInput,
      name: 'REGLA DE PAGOS ACTUALIZADA',
    },
  });

  assert.equal(duplicateResponse.status, 409);

  const duplicateError = await duplicateResponse.json();

  assert.equal(
    duplicateError.error.code,
    'DUPLICATE_RULE_NAME'
  );
});

test('La API rechaza datos incorrectos', async () => {
  const invalidActionsResponse = await requestApi('/api/rules', {
    method: 'POST',
    body: {
      ...validRuleInput,
      name: 'Regla sin acciones',
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

  const invalidBodyResponse = await requestApi('/api/rules', {
    method: 'POST',
    body: [],
  });

  assert.equal(invalidBodyResponse.status, 400);

  const missingRuleResponse = await requestApi(
    '/api/rules/does-not-exist'
  );

  assert.equal(missingRuleResponse.status, 404);

  const missingRuleBody = await missingRuleResponse.json();

  assert.equal(
    missingRuleBody.error.code,
    'RULE_NOT_FOUND'
  );
});

test('Los errores internos no exponen detalles privados', async () => {
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
