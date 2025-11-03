/*
  # Remove Newly Reported Unused Indexes

  1. Performance Improvement
    - Remove indexes that were created but show zero usage
    - These are from the first security fix migration

  2. Indexes Removed (14)
    - Indexes created in first migration that remain unused
    - Foreign key relationships can still use other query plans

  Important Notes:
  - These indexes were created but never used
  - Can be recreated if usage patterns change
  - Improves write performance
*/

-- Remove unused indexes from first security migration
DROP INDEX IF EXISTS public.idx_admin_config_updated_by;
DROP INDEX IF EXISTS public.idx_approvals_created_by;
DROP INDEX IF EXISTS public.idx_background_jobs_created_by;
DROP INDEX IF EXISTS public.idx_backtest_results_created_by;
DROP INDEX IF EXISTS public.idx_balance_adjustments_applied_by;
DROP INDEX IF EXISTS public.idx_bot_instances_created_by_fk;
DROP INDEX IF EXISTS public.idx_fee_transactions_processed_by;
DROP INDEX IF EXISTS public.idx_leads_assigned_to;
DROP INDEX IF EXISTS public.idx_leads_converted_to_user_id;
DROP INDEX IF EXISTS public.idx_notification_campaigns_created_by;
DROP INDEX IF EXISTS public.idx_profiles_assigned_sales_rep;
DROP INDEX IF EXISTS public.idx_profiles_kyc_verified_by;
DROP INDEX IF EXISTS public.idx_user_activities_reviewed_by;
DROP INDEX IF EXISTS public.idx_withdrawals_created_by_fk;
