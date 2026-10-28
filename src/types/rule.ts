export type Trigger =
  | 'customer_created'
  | 'payment_received'
  | 'ticket_unanswered';

export type ConditionOperator =
  | 'equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

export type ConditionLogic = 'AND' | 'OR';

export type Condition = {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number;
};

export type EmailAction = {
  id: string;
  type: 'email';
  recipient: string;
  subject: string;
  body: string;
};

export type SmsAction = {
  id: string;
  type: 'sms';
  phoneNumber: string;
  message: string;
};

export type WebhookAction = {
  id: string;
  type: 'webhook';
  url: string;
  method: 'POST' | 'PUT';
};

export type RuleAction =
  | EmailAction
  | SmsAction
  | WebhookAction;

export type RuleSummary = {
  id: string;
  name: string;
  trigger: Trigger;
  isActive: boolean;
};

export type Rule = RuleSummary & {
  conditionLogic: ConditionLogic;
  conditions: Condition[];
  actions: RuleAction[];
};

export type RuleInput = Pick<
  Rule,
  | 'name'
  | 'trigger'
  | 'conditionLogic'
  | 'conditions'
  | 'actions'
>;

export type RuleStatusInput = Pick<Rule, 'isActive'>;
