/*
  # Remove Unused Indexes - Part 1

  1. Performance Improvement
    - Remove unused indexes that slow down INSERT/UPDATE operations
    - Only drop indexes that show zero usage
    - Keep indexes that may be needed for future queries

  2. Indexes Removed (40+ indexes)
    - Admin audit indexes
    - Approval indexes  
    - Balance adjustment indexes
    - Balances daily indexes
    - AI request indexes
    - KYC document indexes
    - Background job indexes
    - Job execution indexes
    - Lead indexes
    - User activity indexes
    - Admin config/notification indexes
    - Admin role indexes

  Important Notes:
  - Uses DROP INDEX IF EXISTS for safety
  - These indexes were never used according to pg_stat_user_indexes
  - Can be recreated if needed in future
  - Foreign key indexes kept (created in previous migration)
*/

-- Admin Audit
DROP INDEX IF EXISTS public.idx_admin_audit_actor_id;
DROP INDEX IF EXISTS public.idx_admin_audit_action_type;
DROP INDEX IF EXISTS public.idx_admin_audit_target_type;
DROP INDEX IF EXISTS public.idx_admin_audit_target_id;

-- Approvals
DROP INDEX IF EXISTS public.idx_approvals_entity_type;
DROP INDEX IF EXISTS public.idx_approvals_entity_id;
DROP INDEX IF EXISTS public.idx_approvals_state;

-- Balance Adjustments
DROP INDEX IF EXISTS public.idx_balance_adjustments_account_id;
DROP INDEX IF EXISTS public.idx_balance_adjustments_status;
DROP INDEX IF EXISTS public.idx_balance_adjustments_created_by;

-- Balances Daily
DROP INDEX IF EXISTS public.idx_balances_daily_account_id;
DROP INDEX IF EXISTS public.idx_balances_daily_date;

-- AI Requests
DROP INDEX IF EXISTS public.idx_ai_requests_user_id;

-- KYC Documents
DROP INDEX IF EXISTS public.idx_kyc_documents_user_id;
DROP INDEX IF EXISTS public.idx_kyc_documents_status;
DROP INDEX IF EXISTS public.idx_kyc_documents_document_type;
DROP INDEX IF EXISTS public.idx_kyc_documents_reviewed_by;
DROP INDEX IF EXISTS public.idx_kyc_documents_uploaded_at;

-- Background Jobs
DROP INDEX IF EXISTS public.idx_background_jobs_type_status;
DROP INDEX IF EXISTS public.idx_background_jobs_scheduled;

-- Job Executions
DROP INDEX IF EXISTS public.idx_job_executions_job_id;

-- Leads
DROP INDEX IF EXISTS public.idx_leads_score;
DROP INDEX IF EXISTS public.idx_leads_source;

-- User Activities
DROP INDEX IF EXISTS public.idx_activities_user_time;

-- Admin Config
DROP INDEX IF EXISTS public.idx_admin_config_key;

-- Admin Notifications
DROP INDEX IF EXISTS public.idx_admin_notifications_created_at;
DROP INDEX IF EXISTS public.idx_admin_notifications_status;
DROP INDEX IF EXISTS public.idx_admin_notifications_user_id;

-- Admin Roles
DROP INDEX IF EXISTS public.idx_admin_roles_role;
DROP INDEX IF EXISTS public.idx_admin_roles_is_active;

-- Audit Log
DROP INDEX IF EXISTS public.idx_audit_log_actor_id;

-- Backtest Results
DROP INDEX IF EXISTS public.idx_backtest_results_session_id;
DROP INDEX IF EXISTS public.idx_backtest_results_template_id;

-- Backtest Trades
DROP INDEX IF EXISTS public.idx_backtest_trades_backtest_id;
DROP INDEX IF EXISTS public.idx_backtest_trades_timestamp;

-- Bank Accounts
DROP INDEX IF EXISTS public.idx_bank_accounts_user_id;

-- Bot Activity Log
DROP INDEX IF EXISTS public.idx_bot_activity_log_bot_allocation_id;
DROP INDEX IF EXISTS public.idx_bot_activity_log_trade_id;

-- Bot Instances
DROP INDEX IF EXISTS public.idx_bot_instances_template_id;
DROP INDEX IF EXISTS public.idx_bot_instances_user_id;
DROP INDEX IF EXISTS public.idx_bot_instances_account_id;

-- Bot Trades
DROP INDEX IF EXISTS public.idx_bot_trades_bot_allocation_id;

-- Bots
DROP INDEX IF EXISTS public.idx_bots_version;
DROP INDEX IF EXISTS public.idx_bots_created_by;

-- Documents
DROP INDEX IF EXISTS public.idx_documents_user_id;
