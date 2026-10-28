BEGIN;

-- Tabla principal de reglas.
CREATE TABLE public.notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,

  trigger_type TEXT NOT NULL,

  condition_logic TEXT NOT NULL DEFAULT 'AND',

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rule_name_required
    CHECK (LENGTH(BTRIM(name)) > 0),

  CONSTRAINT valid_trigger_type
    CHECK (
      trigger_type IN (
        'customer_created',
        'payment_received',
        'ticket_unanswered'
      )
    ),

  CONSTRAINT valid_condition_logic
    CHECK (condition_logic IN ('AND', 'OR'))
);

-- Unicidad del nombre, ignorando mayúsculas y espacios externos.
CREATE UNIQUE INDEX unique_normalized_rule_name
  ON public.notification_rules (
    LOWER(BTRIM(name))
  );

-- Condiciones asociadas a cada regla.
CREATE TABLE public.notification_rule_conditions (
  rule_id UUID NOT NULL
    REFERENCES public.notification_rules(id)
    ON DELETE CASCADE,

  id TEXT NOT NULL,

  sort_order INTEGER NOT NULL,

  field_name TEXT NOT NULL,

  comparison_operator TEXT NOT NULL,

  value JSONB NOT NULL,

  PRIMARY KEY (rule_id, id),

  UNIQUE (rule_id, sort_order),

  CONSTRAINT condition_id_required
    CHECK (LENGTH(BTRIM(id)) > 0),

  CONSTRAINT condition_order_valid
    CHECK (sort_order >= 0),

  CONSTRAINT condition_value_valid
    CHECK (JSONB_TYPEOF(value) IN ('string', 'number')),

  CONSTRAINT condition_operator_valid
    CHECK (
      comparison_operator IN (
        'equals',
        'contains',
        'greater_than',
        'less_than'
      )
    )
);

-- Acciones configuradas para cada regla.
CREATE TABLE public.notification_rule_actions (
  rule_id UUID NOT NULL
    REFERENCES public.notification_rules(id)
    ON DELETE CASCADE,

  id TEXT NOT NULL,

  sort_order INTEGER NOT NULL,

  action_type TEXT NOT NULL,

  payload JSONB NOT NULL,

  PRIMARY KEY (rule_id, id),

  UNIQUE (rule_id, sort_order),

  CONSTRAINT action_id_required
    CHECK (LENGTH(BTRIM(id)) > 0),

  CONSTRAINT action_order_valid
    CHECK (sort_order >= 0),

  CONSTRAINT action_type_valid
    CHECK (
      action_type IN ('email', 'sms', 'webhook')
    ),

  CONSTRAINT action_payload_valid
    CHECK (JSONB_TYPEOF(payload) = 'object')
);

-- El usuario de la aplicación no administra el esquema.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

GRANT USAGE ON SCHEMA public
  TO notification_rules_app;

-- La aplicación puede consultar, crear y actualizar reglas.
GRANT SELECT, INSERT, UPDATE
  ON public.notification_rules
  TO notification_rules_app;

-- Puede reemplazar condiciones y acciones durante una edición.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.notification_rule_conditions,
     public.notification_rule_actions
  TO notification_rules_app;

COMMIT;
