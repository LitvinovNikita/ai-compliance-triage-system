-- Demo data for AI Risk & Compliance Triage System

insert into accounts (id, name, email, account_status)
values
  ('00000000-0000-0000-0000-000000000001', 'John Smith', 'john.smith@example.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'Maria Chen', 'maria.chen@example.com', 'ACTIVE'),
  ('00000000-0000-0000-0000-000000000003', 'Crypto Ventures Ltd', 'ops@cryptoventures.example', 'REVIEW'),
  ('00000000-0000-0000-0000-000000000004', 'Liam Patel', 'liam.patel@example.com', 'ACTIVE')
on conflict (id) do nothing;

-- Small grocery purchases, regular behavior
insert into transactions (account_id, amount, currency, merchant, location, device, timestamp, status)
values
  ('00000000-0000-0000-0000-000000000001', 42.35, 'CAD', 'Metro Grocery', 'Toronto, CA', 'iPhone 15', now() - interval '2 hours', 'COMPLETED'),
  ('00000000-0000-0000-0000-000000000001', 18.99, 'CAD', 'Starbucks', 'Toronto, CA', 'iPhone 15', now() - interval '1 day', 'COMPLETED'),

  -- Regular monthly transfer
  ('00000000-0000-0000-0000-000000000002', 1500.00, 'CAD', 'Wealthsimple Invest', 'Toronto, CA', 'MacBook Pro', now() - interval '3 days', 'COMPLETED'),

  -- Large crypto withdrawals - potential HIGH risk
  ('00000000-0000-0000-0000-000000000003', 25000.00, 'USD', 'Binance', 'New York, US', 'Windows Desktop', now() - interval '1 hour', 'COMPLETED'),
  ('00000000-0000-0000-0000-000000000003', 26000.00, 'USD', 'Binance', 'New York, US', 'Windows Desktop', now() - interval '2 hours', 'COMPLETED'),

  -- Rapid repeated withdrawals
  ('00000000-0000-0000-0000-000000000004', 900.00, 'CAD', 'ATM Withdrawal', 'Vancouver, CA', 'Android Phone', now() - interval '20 minutes', 'COMPLETED'),
  ('00000000-0000-0000-0000-000000000004', 880.00, 'CAD', 'ATM Withdrawal', 'Vancouver, CA', 'Android Phone', now() - interval '15 minutes', 'COMPLETED'),
  ('00000000-0000-0000-0000-000000000004', 870.00, 'CAD', 'ATM Withdrawal', 'Vancouver, CA', 'Android Phone', now() - interval '10 minutes', 'COMPLETED'),

  -- International transfer & new device
  ('00000000-0000-0000-0000-000000000002', 12000.00, 'EUR', 'SEPA Transfer', 'Berlin, DE', 'New Device - iPad', now() - interval '4 hours', 'COMPLETED');

