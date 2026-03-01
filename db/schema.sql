-- PostgreSQL schema for AI Risk & Compliance Triage System
-- Designed to work with Supabase (use UUIDs or BIGINT IDs depending on your preference)

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  account_status text not null default 'ACTIVE', -- e.g. ACTIVE, FROZEN, REVIEW
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric(18,2) not null,
  currency text not null,
  merchant text not null,
  location text,
  device text,
  timestamp timestamptz not null default now(),
  status text not null default 'COMPLETED' -- e.g. COMPLETED, PENDING, DECLINED
);

create index if not exists idx_transactions_account_id
  on transactions(account_id);

create index if not exists idx_transactions_timestamp
  on transactions(timestamp desc);

create table if not exists ai_risk_analysis (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  risk_level text not null, -- LOW | MEDIUM | HIGH
  risk_score numeric(5,2) not null,
  flags text[] not null,
  explanation text not null, -- can store a detailed investigation report
  recommended_action text not null, -- ALLOW | MONITOR | ESCALATE_TO_HUMAN
  confidence numeric(3,2) not null,
  created_at timestamptz not null default now(),
  -- Hybrid risk engine (rules + AI)
  rule_score numeric(5,2),
  rule_flags text[],
  combined_score numeric(5,2),
  decision_engine_action text -- ALLOW | MONITOR | ESCALATE_TO_HUMAN | FREEZE_ACCOUNT
);

create unique index if not exists idx_ai_risk_analysis_transaction_id
  on ai_risk_analysis(transaction_id);

create table if not exists compliance_reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  human_decision text not null, -- APPROVE_TRANSACTION | FREEZE_ACCOUNT | REQUEST_INVESTIGATION
  reviewer_notes text,
  reviewed_at timestamptz not null default now()
);

create index if not exists idx_compliance_reviews_transaction_id
  on compliance_reviews(transaction_id);

