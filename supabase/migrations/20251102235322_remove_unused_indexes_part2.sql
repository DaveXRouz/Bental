/*
  # Remove Unused Indexes - Part 2

  1. Performance Improvement
    - Continue removing unused indexes
    - Focus on remaining tables

  2. Indexes Removed
    - Fee accruals/schedules/transactions
    - Market bars
    - Messages
    - Navigation analytics
    - Notification campaigns/templates
    - Orders
    - Payout methods
    - Profiles
    - Risk tiers
    - Sim sessions/balances
    - Suitability assessments
    - Withdrawals

  Important Notes:
  - All these indexes show zero usage
  - Keeping primary keys and unique constraints
  - Foreign key indexes kept (from part 1)
*/

-- Fee Accruals
DROP INDEX IF EXISTS public.idx_fee_accruals_account_id;
DROP INDEX IF EXISTS public.idx_fee_accruals_fee_schedule_id;
DROP INDEX IF EXISTS public.idx_fee_accruals_status;
DROP INDEX IF EXISTS public.idx_fee_accruals_period;

-- Fee Schedules
DROP INDEX IF EXISTS public.idx_fee_schedules_fee_type;
DROP INDEX IF EXISTS public.idx_fee_schedules_is_active;
DROP INDEX IF EXISTS public.idx_fee_schedules_effective_dates;

-- Fee Transactions
DROP INDEX IF EXISTS public.idx_fee_transactions_account_id;
DROP INDEX IF EXISTS public.idx_fee_transactions_fee_accrual_id;
DROP INDEX IF EXISTS public.idx_fee_transactions_processed_at;

-- Market Bars
DROP INDEX IF EXISTS public.idx_market_bars_symbol;
DROP INDEX IF EXISTS public.idx_market_bars_timestamp;
DROP INDEX IF EXISTS public.idx_market_bars_symbol_interval_timestamp;

-- Messages
DROP INDEX IF EXISTS public.idx_messages_sender_id;
DROP INDEX IF EXISTS public.idx_messages_recipient_id;

-- Navigation Analytics
DROP INDEX IF EXISTS public.idx_navigation_analytics_user_id;

-- Notification Campaigns
DROP INDEX IF EXISTS public.idx_notification_campaigns_status;
DROP INDEX IF EXISTS public.idx_notification_campaigns_scheduled_at;

-- Notification Queue
DROP INDEX IF EXISTS public.idx_notification_recipient;

-- Notification Templates
DROP INDEX IF EXISTS public.idx_notification_templates_key;
DROP INDEX IF EXISTS public.idx_notification_templates_is_active;

-- Orders
DROP INDEX IF EXISTS public.idx_orders_account_id;

-- Payout Methods
DROP INDEX IF EXISTS public.idx_payout_methods_user_id;
DROP INDEX IF EXISTS public.idx_payout_methods_status;
DROP INDEX IF EXISTS public.idx_payout_methods_type;

-- Profiles
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_profiles_risk_tier;
DROP INDEX IF EXISTS public.idx_profiles_country_code;

-- Risk Tiers
DROP INDEX IF EXISTS public.idx_risk_tiers_tier_code;

-- Sim Balances Daily
DROP INDEX IF EXISTS public.idx_sim_balances_daily_session_id;
DROP INDEX IF EXISTS public.idx_sim_balances_daily_date;

-- Sim Sessions
DROP INDEX IF EXISTS public.idx_sim_sessions_session_type;
DROP INDEX IF EXISTS public.idx_sim_sessions_created_by;

-- Suitability Assessments
DROP INDEX IF EXISTS public.idx_suitability_user_id;

-- Withdrawals
DROP INDEX IF EXISTS public.idx_withdrawals_user_id;
DROP INDEX IF EXISTS public.idx_withdrawals_account_id;
DROP INDEX IF EXISTS public.idx_withdrawals_payout_method_id;
DROP INDEX IF EXISTS public.idx_withdrawals_approval_state;
DROP INDEX IF EXISTS public.idx_withdrawals_created_at;
