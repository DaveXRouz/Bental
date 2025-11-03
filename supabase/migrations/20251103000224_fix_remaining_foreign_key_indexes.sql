/*
  # Fix Remaining Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for 38 additional unindexed foreign keys
    - Improves JOIN performance and prevents full table scans

  2. Tables Updated
    - admin_audit, admin_notifications, ai_requests
    - audit_log, backtest_results, backtest_trades
    - balance_adjustments, bank_accounts, bot_activity_log
    - bot_instances, bot_trades, bots, documents
    - fee_accruals, fee_transactions, job_executions
    - kyc_documents, messages, navigation_analytics
    - notification_queue, orders, payout_methods
    - sim_balances_daily, sim_sessions
    - suitability_assessments, user_activities, withdrawals

  Important Notes:
  - All indexes use IF NOT EXISTS for safety
  - Indexes follow naming convention: idx_[table]_[column]_fk
*/

-- admin_audit
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_id_fk 
ON public.admin_audit(actor_id);

-- admin_notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id_fk 
ON public.admin_notifications(user_id);

-- ai_requests
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id_fk 
ON public.ai_requests(user_id);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id_fk 
ON public.audit_log(actor_id);

-- backtest_results (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_backtest_results_sim_session_id_fk 
ON public.backtest_results(sim_session_id);

CREATE INDEX IF NOT EXISTS idx_backtest_results_template_id_fk 
ON public.backtest_results(template_id);

-- backtest_trades
CREATE INDEX IF NOT EXISTS idx_backtest_trades_backtest_id_fk 
ON public.backtest_trades(backtest_id);

-- balance_adjustments (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_account_id_fk 
ON public.balance_adjustments(account_id);

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_created_by_fk 
ON public.balance_adjustments(created_by);

-- bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id_fk 
ON public.bank_accounts(user_id);

-- bot_activity_log (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_bot_activity_log_bot_allocation_id_fk 
ON public.bot_activity_log(bot_allocation_id);

CREATE INDEX IF NOT EXISTS idx_bot_activity_log_trade_id_fk 
ON public.bot_activity_log(trade_id);

-- bot_instances (3 foreign keys)
CREATE INDEX IF NOT EXISTS idx_bot_instances_account_id_fk 
ON public.bot_instances(account_id);

CREATE INDEX IF NOT EXISTS idx_bot_instances_template_id_fk 
ON public.bot_instances(template_id);

CREATE INDEX IF NOT EXISTS idx_bot_instances_user_id_fk 
ON public.bot_instances(user_id);

-- bot_trades
CREATE INDEX IF NOT EXISTS idx_bot_trades_bot_allocation_id_fk 
ON public.bot_trades(bot_allocation_id);

-- bots
CREATE INDEX IF NOT EXISTS idx_bots_created_by_fk 
ON public.bots(created_by);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id_fk 
ON public.documents(user_id);

-- fee_accruals (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_fee_accruals_account_id_fk 
ON public.fee_accruals(account_id);

CREATE INDEX IF NOT EXISTS idx_fee_accruals_fee_schedule_id_fk 
ON public.fee_accruals(fee_schedule_id);

-- fee_transactions (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_fee_transactions_account_id_fk 
ON public.fee_transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_fee_transactions_fee_accrual_id_fk 
ON public.fee_transactions(fee_accrual_id);

-- job_executions
CREATE INDEX IF NOT EXISTS idx_job_executions_job_id_fk 
ON public.job_executions(job_id);

-- kyc_documents (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_kyc_documents_reviewed_by_fk 
ON public.kyc_documents(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id_fk 
ON public.kyc_documents(user_id);

-- messages (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id_fk 
ON public.messages(recipient_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id_fk 
ON public.messages(sender_id);

-- navigation_analytics
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_user_id_fk 
ON public.navigation_analytics(user_id);

-- notification_queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient_id_fk 
ON public.notification_queue(recipient_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_account_id_fk 
ON public.orders(account_id);

-- payout_methods
CREATE INDEX IF NOT EXISTS idx_payout_methods_user_id_fk 
ON public.payout_methods(user_id);

-- sim_balances_daily
CREATE INDEX IF NOT EXISTS idx_sim_balances_daily_sim_session_id_fk 
ON public.sim_balances_daily(sim_session_id);

-- sim_sessions
CREATE INDEX IF NOT EXISTS idx_sim_sessions_created_by_fk 
ON public.sim_sessions(created_by);

-- suitability_assessments
CREATE INDEX IF NOT EXISTS idx_suitability_assessments_user_id_fk 
ON public.suitability_assessments(user_id);

-- user_activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id_fk 
ON public.user_activities(user_id);

-- withdrawals (3 foreign keys)
CREATE INDEX IF NOT EXISTS idx_withdrawals_account_id_fk 
ON public.withdrawals(account_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_payout_method_id_fk 
ON public.withdrawals(payout_method_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id_fk 
ON public.withdrawals(user_id);
