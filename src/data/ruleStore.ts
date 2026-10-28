import { randomUUID } from 'node:crypto';

import type {
  Rule,
  RuleInput,
  RuleSummary,
} from '../types/rule.js';

const rules = new Map<string, Rule>();

export function listRules(): RuleSummary[] {
  return Array.from(rules.values(), (rule) => ({
    id: rule.id,
    name: rule.name,
    trigger: rule.trigger,
    isActive: rule.isActive,
  }));
}

export function getRuleById(ruleId: string): Rule | null {
  return rules.get(ruleId) ?? null;
}

export function isRuleNameTaken(
  name: string,
  excludedRuleId?: string
): boolean {
  const normalizedName = name
    .trim()
    .toLocaleLowerCase('es');

  return Array.from(rules.values()).some(
    (rule) =>
      rule.id !== excludedRuleId &&
      rule.name.trim().toLocaleLowerCase('es') ===
        normalizedName
  );
}

export function createRule(input: RuleInput): Rule {
  const rule: Rule = {
    ...input,
    id: randomUUID(),
    name: input.name.trim(),
    isActive: true,
  };

  rules.set(rule.id, rule);

  return rule;
}

export function updateRule(
  ruleId: string,
  input: RuleInput
): Rule | null {
  const existingRule = rules.get(ruleId);

  if (!existingRule) {
    return null;
  }

  const updatedRule: Rule = {
    ...existingRule,
    ...input,
    name: input.name.trim(),
  };

  rules.set(ruleId, updatedRule);

  return updatedRule;
}

export function updateRuleStatus(
  ruleId: string,
  isActive: boolean
): Rule | null {
  const existingRule = rules.get(ruleId);

  if (!existingRule) {
    return null;
  }

  const updatedRule: Rule = {
    ...existingRule,
    isActive,
  };

  rules.set(ruleId, updatedRule);

  return updatedRule;
}
