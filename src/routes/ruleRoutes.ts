import { Router } from 'express';

import type { Response } from 'express';

import {
  listRules,
  getRuleById,
  isRuleNameTaken,
  createRule,
  updateRule,
  updateRuleStatus,
} from '../data/ruleStore.js';

import {
  validateRuleInput,
} from '../validation/ruleValidation.js';

export const ruleRouter = Router();

function sendError(
  response: Response,
  status: number,
  code: string,
  message: string,
  details?: string[]
): void {
  response.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

function isJsonObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

// GET /api/rules
ruleRouter.get('/', (_request, response) => {
  response.status(200).json(listRules());
});

// GET /api/rules/:ruleId
ruleRouter.get('/:ruleId', (request, response) => {
  const ruleId = request.params.ruleId;

  if (typeof ruleId !== 'string') {
    sendError(
      response,
      400,
      'BAD_REQUEST',
      'Identificador inválido.'
    );
    return;
  }

  const rule = getRuleById(ruleId);

  if (!rule) {
    sendError(
      response,
      404,
      'RULE_NOT_FOUND',
      'La regla solicitada no existe.'
    );
    return;
  }

  response.status(200).json(rule);
});

// POST /api/rules
ruleRouter.post('/', (request, response) => {
  const body: unknown = request.body;

  if (!isJsonObject(body)) {
    sendError(
      response,
      400,
      'BAD_REQUEST',
      'Se requiere un objeto JSON.'
    );
    return;
  }

  const validation = validateRuleInput(body);

  if (!validation.success) {
    sendError(
      response,
      422,
      'VALIDATION_ERROR',
      'Los datos de la regla son inválidos.',
      validation.errors
    );
    return;
  }

  if (isRuleNameTaken(validation.data.name)) {
    sendError(
      response,
      409,
      'DUPLICATE_RULE_NAME',
      'Ya existe una regla con este nombre.'
    );
    return;
  }

  const rule = createRule(validation.data);

  response
    .location(`/api/rules/${rule.id}`)
    .status(201)
    .json(rule);
});

// PUT /api/rules/:ruleId
ruleRouter.put('/:ruleId', (request, response) => {
  const ruleId = request.params.ruleId;

  if (typeof ruleId !== 'string') {
    sendError(
      response,
      400,
      'BAD_REQUEST',
      'Identificador inválido.'
    );
    return;
  }

  if (!getRuleById(ruleId)) {
    sendError(
      response,
      404,
      'RULE_NOT_FOUND',
      'La regla solicitada no existe.'
    );
    return;
  }

  const body: unknown = request.body;

  if (!isJsonObject(body)) {
    sendError(
      response,
      400,
      'BAD_REQUEST',
      'Se requiere un objeto JSON.'
    );
    return;
  }

  const validation = validateRuleInput(body);

  if (!validation.success) {
    sendError(
      response,
      422,
      'VALIDATION_ERROR',
      'Los datos de la regla son inválidos.',
      validation.errors
    );
    return;
  }

  if (isRuleNameTaken(validation.data.name, ruleId)) {
    sendError(
      response,
      409,
      'DUPLICATE_RULE_NAME',
      'Ya existe una regla con este nombre.'
    );
    return;
  }

  const updatedRule = updateRule(
    ruleId,
    validation.data
  );

  response.status(200).json(updatedRule);
});

// PATCH /api/rules/:ruleId/status
ruleRouter.patch(
  '/:ruleId/status',
  (request, response) => {
    const ruleId = request.params.ruleId;

    if (typeof ruleId !== 'string') {
      sendError(
        response,
        400,
        'BAD_REQUEST',
        'Identificador inválido.'
      );
      return;
    }

    if (!getRuleById(ruleId)) {
      sendError(
        response,
        404,
        'RULE_NOT_FOUND',
        'La regla solicitada no existe.'
      );
      return;
    }

    const body: unknown = request.body;

    if (!isJsonObject(body)) {
      sendError(
        response,
        400,
        'BAD_REQUEST',
        'Se requiere un objeto JSON.'
      );
      return;
    }

    if (typeof body.isActive !== 'boolean') {
      sendError(
        response,
        422,
        'VALIDATION_ERROR',
        'isActive debe ser true o false.'
      );
      return;
    }

    const updatedRule = updateRuleStatus(
      ruleId,
      body.isActive
    );

    response.status(200).json(updatedRule);
  }
);
