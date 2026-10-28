import { Router } from 'express';

import type { Response } from 'express';

import {
  listRules,
  getRuleById,
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
ruleRouter.get('/', async (_request, response, next) => {
  try {
    const rules = await listRules();

    response.status(200).json(rules);
  } catch (error) {
    next(error);
  }
});

// GET /api/rules/:ruleId
ruleRouter.get('/:ruleId', async (request, response, next) => {
  try {
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

    const rule = await getRuleById(ruleId);

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
  } catch (error) {
    next(error);
  }
});

// POST /api/rules
ruleRouter.post('/', async (request, response, next) => {
  try {
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

    const rule = await createRule(validation.data);

    response
      .location(`/api/rules/${rule.id}`)
      .status(201)
      .json(rule);
  } catch (error) {
    next(error);
  }
});

// PUT /api/rules/:ruleId
ruleRouter.put('/:ruleId', async (request, response, next) => {
  try {
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

    const existingRule = await getRuleById(ruleId);

    if (!existingRule) {
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

    const updatedRule = await updateRule(
      ruleId,
      validation.data
    );

    if (!updatedRule) {
      sendError(
        response,
        404,
        'RULE_NOT_FOUND',
        'La regla solicitada no existe.'
      );
      return;
    }

    response.status(200).json(updatedRule);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/rules/:ruleId/status
ruleRouter.patch(
  '/:ruleId/status',
  async (request, response, next) => {
    try {
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

      const existingRule = await getRuleById(ruleId);

      if (!existingRule) {
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

      const updatedRule = await updateRuleStatus(
        ruleId,
        body.isActive
      );

      if (!updatedRule) {
        sendError(
          response,
          404,
          'RULE_NOT_FOUND',
          'La regla solicitada no existe.'
        );
        return;
      }

      response.status(200).json(updatedRule);
    } catch (error) {
      next(error);
    }
  }
);
