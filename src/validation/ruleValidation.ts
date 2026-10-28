import type {
  Condition,
  ConditionLogic,
  ConditionOperator,
  RuleAction,
  RuleInput,
  Trigger,
} from '../types/rule.js';

type FieldType = 'text' | 'number';

type ValidationResult =
  | { success: true; data: RuleInput }
  | { success: false; errors: string[] };

const triggerFields: Record<
  Trigger,
  Record<string, FieldType>
> = {
  customer_created: {
    pais: 'text',
    plan: 'text',
  },
  payment_received: {
    monto: 'number',
    moneda: 'text',
  },
  ticket_unanswered: {
    horas_sin_respuesta: 'number',
    prioridad: 'text',
  },
};

const fieldOperators: Record<
  FieldType,
  ConditionOperator[]
> = {
  text: ['equals', 'contains'],
  number: ['equals', 'greater_than', 'less_than'],
};

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

function isValidWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      (url.protocol === 'http:' ||
        url.protocol === 'https:') &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

export function validateRuleInput(
  value: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!isObject(value)) {
    return {
      success: false,
      errors: ['El cuerpo debe ser un objeto JSON.'],
    };
  }

  if (!isNonEmptyString(value.name)) {
    errors.push('name: el nombre es obligatorio.');
  }

  const validTrigger =
    typeof value.trigger === 'string' &&
    Object.hasOwn(triggerFields, value.trigger);

  if (!validTrigger) {
    errors.push('trigger: disparador inválido.');
  }

  const trigger = validTrigger
    ? (value.trigger as Trigger)
    : null;

  if (
    value.conditionLogic !== 'AND' &&
    value.conditionLogic !== 'OR'
  ) {
    errors.push('conditionLogic: utiliza AND u OR.');
  }

  if (!Array.isArray(value.conditions)) {
    errors.push('conditions: debe ser un arreglo.');
  } else {
    const conditionIds = new Set<string>();

    value.conditions.forEach(
      (condition: unknown, index: number) => {
        const path = `conditions[${index}]`;

        if (!isObject(condition)) {
          errors.push(`${path}: condición inválida.`);
          return;
        }

        if (!isNonEmptyString(condition.id)) {
          errors.push(`${path}.id: es obligatorio.`);
        } else if (conditionIds.has(condition.id)) {
          errors.push(`${path}.id: identificador duplicado.`);
        } else {
          conditionIds.add(condition.id);
        }

        if (!isNonEmptyString(condition.field)) {
          errors.push(`${path}.field: es obligatorio.`);
          return;
        }

        if (!trigger) {
          return;
        }

        const fieldType =
          triggerFields[trigger][condition.field];

        if (!fieldType) {
          errors.push(
            `${path}.field: campo no permitido para el disparador.`
          );
          return;
        }

        if (
          typeof condition.operator !== 'string' ||
          !fieldOperators[fieldType].some(
            (operator) => operator === condition.operator
          )
        ) {
          errors.push(`${path}.operator: operador inválido.`);
        }

        if (fieldType === 'number') {
          if (
            typeof condition.value !== 'number' ||
            !Number.isFinite(condition.value)
          ) {
            errors.push(`${path}.value: número inválido.`);
          }
        } else if (!isNonEmptyString(condition.value)) {
          errors.push(`${path}.value: texto obligatorio.`);
        }
      }
    );
  }

  if (!Array.isArray(value.actions)) {
    errors.push('actions: debe ser un arreglo.');
  } else if (value.actions.length === 0) {
    errors.push('actions: agrega al menos una acción.');
  } else {
    const actionIds = new Set<string>();

    value.actions.forEach(
      (action: unknown, index: number) => {
        const path = `actions[${index}]`;

        if (!isObject(action)) {
          errors.push(`${path}: acción inválida.`);
          return;
        }

        if (!isNonEmptyString(action.id)) {
          errors.push(`${path}.id: es obligatorio.`);
        } else if (actionIds.has(action.id)) {
          errors.push(`${path}.id: identificador duplicado.`);
        } else {
          actionIds.add(action.id);
        }

        switch (action.type) {
          case 'email': {
            if (!isNonEmptyString(action.recipient)) {
              errors.push(
                `${path}.recipient: destinatario obligatorio.`
              );
            } else if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                action.recipient
              )
            ) {
              errors.push(
                `${path}.recipient: correo inválido.`
              );
            }

            if (!isNonEmptyString(action.subject)) {
              errors.push(`${path}.subject: asunto obligatorio.`);
            }

            if (!isNonEmptyString(action.body)) {
              errors.push(`${path}.body: mensaje obligatorio.`);
            }

            break;
          }

          case 'sms': {
            if (!isNonEmptyString(action.phoneNumber)) {
              errors.push(
                `${path}.phoneNumber: teléfono obligatorio.`
              );
            } else {
              const digits = action.phoneNumber.replace(
                /\D/g,
                ''
              );

              if (
                !/^\+?[0-9()\s-]+$/.test(action.phoneNumber) ||
                digits.length < 8 ||
                digits.length > 15
              ) {
                errors.push(
                  `${path}.phoneNumber: teléfono inválido.`
                );
              }
            }

            if (!isNonEmptyString(action.message)) {
              errors.push(
                `${path}.message: mensaje obligatorio.`
              );
            } else if (action.message.length > 160) {
              errors.push(
                `${path}.message: máximo 160 caracteres.`
              );
            }

            break;
          }

          case 'webhook': {
            if (!isNonEmptyString(action.url)) {
              errors.push(`${path}.url: URL obligatoria.`);
            } else if (!isValidWebhookUrl(action.url)) {
              errors.push(
                `${path}.url: utiliza HTTP o HTTPS.`
              );
            }

            if (
              action.method !== 'POST' &&
              action.method !== 'PUT'
            ) {
              errors.push(
                `${path}.method: utiliza POST o PUT.`
              );
            }

            break;
          }

          default:
            errors.push(`${path}.type: tipo inválido.`);
        }
      }
    );
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Estos valores ya fueron comprobados en tiempo de ejecución.
  const conditions = (value.conditions as Condition[]).map(
    (condition) => ({
      id: condition.id,
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
    })
  );

  const actions = (value.actions as RuleAction[]).map(
    (action): RuleAction => {
      switch (action.type) {
        case 'email':
          return {
            id: action.id,
            type: 'email',
            recipient: action.recipient.trim(),
            subject: action.subject.trim(),
            body: action.body,
          };

        case 'sms':
          return {
            id: action.id,
            type: 'sms',
            phoneNumber: action.phoneNumber.trim(),
            message: action.message,
          };

        case 'webhook':
          return {
            id: action.id,
            type: 'webhook',
            url: action.url.trim(),
            method: action.method,
          };
      }
    }
  );

  return {
    success: true,
    data: {
      name: (value.name as string).trim(),
      trigger: value.trigger as Trigger,
      conditionLogic: value.conditionLogic as ConditionLogic,
      conditions,
      actions,
    },
  };
}
