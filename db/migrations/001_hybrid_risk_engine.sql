-- Add columns for Hybrid Risk Engine (rules + AI) and Decision Engine


alter table ai_risk_analysis
  add column if not exists rule_score numeric(5,2),
  add column if not exists rule_flags text[],
  add column if not exists combined_score numeric(5,2),
  add column if not exists decision_engine_action text;

comment on column ai_risk_analysis.rule_score is '0-100 from deterministic rules';
comment on column ai_risk_analysis.rule_flags is 'e.g. HIGH_TRANSACTION_AMOUNT, NEW_DEVICE';
comment on column ai_risk_analysis.combined_score is 'weighted combination of rule_score and AI score';
comment on column ai_risk_analysis.decision_engine_action is 'ALLOW | MONITOR | ESCALATE_TO_HUMAN | FREEZE_ACCOUNT';
