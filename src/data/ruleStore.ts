import type { PoolClient } from 'pg';

import { pool } from '../db/pool.js';

import type {
  Rule,
  RuleInput,
  RuleSummary,
} from '../types/rule.js';

const validUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const selectCompleteRuleSql = `
  SELECT
    rule.id,
    rule.name,
    rule.trigger_type AS "trigger",
    rule.condition_logic AS "conditionLogic",
    rule.is_active AS "isActive",

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', condition.id,
            'field', condition.field_name,
            'operator', condition.comparison_operator,
            'value', condition.value
          )
          ORDER BY condition.sort_order
        )
        FROM public.notification_rule_conditions AS condition
        WHERE condition.rule_id = rule.id
      ),
      '[]'::jsonb
    ) AS conditions,

    COALESCE(
      (
        SELECT jsonb_agg(
          action.payload ||
          jsonb_build_object(
            'id', action.id,
            'type', action.action_type
          )
          ORDER BY action.sort_order
        )
        FROM public.notification_rule_actions AS action
        WHERE action.rule_id = rule.id
      ),
      '[]'::jsonb
    ) AS actions

  FROM public.notification_rules AS rule
  WHERE rule.id = $1
`;

async function getRuleFromClient(
  client: PoolClient,
  ruleId: string
): Promise<Rule | null> {
  const result = await client.query<Rule>(
    selectCompleteRuleSql,
    [ruleId]
  );

  return result.rows[0] ?? null;
}

async function insertRuleDetails(
  client: PoolClient,
  ruleId: string,
  input: RuleInput
): Promise<void> {
  for (const [index, condition] of input.conditions.entries()) {
    await client.query(
      `
        INSERT INTO public.notification_rule_conditions (
          rule_id,
          id,
          sort_order,
          field_name,
          comparison_operator,
          value
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        ruleId,
        condition.id,
        index,
        condition.field,
        condition.operator,
        JSON.stringify(condition.value),
      ]
    );
  }

  for (const [index, action] of input.actions.entries()) {
    await client.query(
      `
        INSERT INTO public.notification_rule_actions (
          rule_id,
          id,
          sort_order,
          action_type,
          payload
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        ruleId,
        action.id,
        index,
        action.type,
        JSON.stringify(action),
      ]
    );
  }
}

export async function listRules(): Promise<RuleSummary[]> {
  const result = await pool.query<RuleSummary>(
    `
      SELECT
        id,
        name,
        trigger_type AS "trigger",
        is_active AS "isActive"
      FROM public.notification_rules
      ORDER BY created_at DESC, id DESC
    `
  );

  return result.rows;
}

export async function getRuleById(
  ruleId: string
): Promise<Rule | null> {
  if (!validUuidPattern.test(ruleId)) {
    return null;
  }

  const result = await pool.query<Rule>(
    selectCompleteRuleSql,
    [ruleId]
  );

  return result.rows[0] ?? null;
}

export async function createRule(
  input: RuleInput
): Promise<Rule> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string }>(
      `
        INSERT INTO public.notification_rules (
          name,
          trigger_type,
          condition_logic
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [
        input.name,
        input.trigger,
        input.conditionLogic,
      ]
    );

    const ruleId = result.rows[0]?.id;

    if (!ruleId) {
      throw new Error('No se pudo generar el ID de la regla.');
    }

    await insertRuleDetails(client, ruleId, input);

    const createdRule = await getRuleFromClient(
      client,
      ruleId
    );

    if (!createdRule) {
      throw new Error('No se pudo consultar la regla creada.');
    }

    await client.query('COMMIT');

    return createdRule;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRule(
  ruleId: string,
  input: RuleInput
): Promise<Rule | null> {
  if (!validUuidPattern.test(ruleId)) {
    return null;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingRule = await client.query(
      `
        SELECT id
        FROM public.notification_rules
        WHERE id = $1
        FOR UPDATE
      `,
      [ruleId]
    );

    if (existingRule.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `
        UPDATE public.notification_rules
        SET
          name = $2,
          trigger_type = $3,
          condition_logic = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        ruleId,
        input.name,
        input.trigger,
        input.conditionLogic,
      ]
    );

    await client.query(
      `
        DELETE FROM public.notification_rule_conditions
        WHERE rule_id = $1
      `,
      [ruleId]
    );

    await client.query(
      `
        DELETE FROM public.notification_rule_actions
        WHERE rule_id = $1
      `,
      [ruleId]
    );

    await insertRuleDetails(client, ruleId, input);

    const updatedRule = await getRuleFromClient(
      client,
      ruleId
    );

    if (!updatedRule) {
      throw new Error('No se pudo consultar la regla actualizada.');
    }

    await client.query('COMMIT');

    return updatedRule;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRuleStatus(
  ruleId: string,
  isActive: boolean
): Promise<Rule | null> {
  if (!validUuidPattern.test(ruleId)) {
    return null;
  }

  const result = await pool.query<{ id: string }>(
    `
      UPDATE public.notification_rules
      SET
        is_active = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [ruleId, isActive]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return getRuleById(ruleId);
}
