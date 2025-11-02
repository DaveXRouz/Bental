/*
  # Fix Security Issues - Part 1: Unindexed Foreign Keys

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys (14 tables)
    - Improves query performance for JOIN operations
    - Prevents full table scans on foreign key lookups

  2. Tables Updated
    - admin_config (updated_by)
    - approvals (created_by)
    - background_jobs (created_by)
    - backtest_results (created_by)
    - balance_adjustments (applied_by)
    - bot_instances (created_by)
    - fee_transactions (processed_by)
    - leads (assigned_to, converted_to_user_id)
    - notification_campaigns (created_by)
    - profiles (assigned_sales_rep, kyc_verified_by)
    - user_activities (reviewed_by)
    - withdrawals (created_by)

  Important Notes:
  - All indexes use IF NOT EXISTS to prevent errors
  - Indexes are named following convention: idx_[table]_[column]
  - These indexes will significantly improve JOIN performance
*/

-- admin_config: updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_admin_config_updated_by 
ON public.admin_config(updated_by);

-- approvals: created_by foreign key
CREATE INDEX IF NOT EXISTS idx_approvals_created_by 
ON public.approvals(created_by);

-- background_jobs: created_by foreign key
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_by 
ON public.background_jobs(created_by);

-- backtest_results: created_by foreign key
CREATE INDEX IF NOT EXISTS idx_backtest_results_created_by 
ON public.backtest_results(created_by);

-- balance_adjustments: applied_by foreign key
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_applied_by 
ON public.balance_adjustments(applied_by);

-- bot_instances: created_by foreign key (if different from existing)
CREATE INDEX IF NOT EXISTS idx_bot_instances_created_by_fk 
ON public.bot_instances(created_by);

-- fee_transactions: processed_by foreign key
CREATE INDEX IF NOT EXISTS idx_fee_transactions_processed_by 
ON public.fee_transactions(processed_by);

-- leads: assigned_to foreign key
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to 
ON public.leads(assigned_to);

-- leads: converted_to_user_id foreign key
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_user_id 
ON public.leads(converted_to_user_id);

-- notification_campaigns: created_by foreign key
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_by 
ON public.notification_campaigns(created_by);

-- profiles: assigned_sales_rep foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_sales_rep 
ON public.profiles(assigned_sales_rep);

-- profiles: kyc_verified_by foreign key
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_verified_by 
ON public.profiles(kyc_verified_by);

-- user_activities: reviewed_by foreign key
CREATE INDEX IF NOT EXISTS idx_user_activities_reviewed_by 
ON public.user_activities(reviewed_by);

-- withdrawals: created_by foreign key (if different from user_id index)
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_by_fk 
ON public.withdrawals(created_by);
