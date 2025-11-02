/*
  # Fix Security Issues - Part 3: Optimize Final RLS Policies (Corrected)

  1. RLS Performance Optimization
    - Replace auth.uid() with (select auth.uid())
    - Remove duplicate policies
    - Use correct column names

  2. Tables Updated
    - payout_methods (user_id)
    - balances_daily (via accounts)
    - fee_accruals (via accounts)
    - fee_transactions (via accounts)
    - notification_queue (recipient_id)
    - admin_notifications
    - messages

  Important Notes:
  - notification_queue uses recipient_id not user_id
  - Removes all duplicate policies
*/

-- =====================================================
-- PAYOUT_METHODS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own payout methods" ON public.payout_methods;

DROP POLICY IF EXISTS "Users can view own payout methods or admins view all" ON public.payout_methods;
CREATE POLICY "Users can view own payout methods or admins view all"
ON public.payout_methods FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
);

DROP POLICY IF EXISTS "Users can insert own payout methods" ON public.payout_methods;
CREATE POLICY "Users can insert own payout methods"
ON public.payout_methods FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
);

-- =====================================================
-- BALANCES_DAILY TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own balances daily" ON public.balances_daily;
CREATE POLICY "Users can view own balances daily"
ON public.balances_daily FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = balances_daily.account_id
    AND accounts.user_id = (select auth.uid())
  )
);

-- =====================================================
-- FEE_ACCRUALS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own fee accruals" ON public.fee_accruals;
CREATE POLICY "Users can view own fee accruals"
ON public.fee_accruals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = fee_accruals.account_id
    AND accounts.user_id = (select auth.uid())
  )
);

-- =====================================================
-- FEE_TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own fee transactions" ON public.fee_transactions;
CREATE POLICY "Users can view own fee transactions"
ON public.fee_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE accounts.id = fee_transactions.account_id
    AND accounts.user_id = (select auth.uid())
  )
);

-- =====================================================
-- NOTIFICATION_QUEUE TABLE (uses recipient_id)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notification_queue;

DROP POLICY IF EXISTS "Users can view own notifications or admins view all" ON public.notification_queue;
CREATE POLICY "Users can view own notifications or admins view all"
ON public.notification_queue FOR SELECT
TO authenticated
USING (
  recipient_id = (select auth.uid()) OR
  is_admin()
);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_queue;
CREATE POLICY "Users can update own notifications"
ON public.notification_queue FOR UPDATE
TO authenticated
USING (
  recipient_id = (select auth.uid())
)
WITH CHECK (
  recipient_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notification_queue;
CREATE POLICY "Admins can manage notifications"
ON public.notification_queue FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- ADMIN_NOTIFICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can create notifications" ON public.admin_notifications;
CREATE POLICY "Admins can create notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.admin_notifications;
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- MESSAGES TABLE (consolidate policies)
-- =====================================================

DROP POLICY IF EXISTS "Users can view received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;

CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  sender_id = (select auth.uid()) OR
  recipient_id = (select auth.uid())
);

-- =====================================================
-- REMOVE DUPLICATE POLICIES
-- =====================================================

-- Approvals
DROP POLICY IF EXISTS "Approvals managed by admins only" ON public.approvals;
DROP POLICY IF EXISTS "Admins can view approvals" ON public.approvals;

-- Balance adjustments
DROP POLICY IF EXISTS "Balance adjustments managed by admins only" ON public.balance_adjustments;

-- Bots
DROP POLICY IF EXISTS "Allow bot creation for seeding" ON public.bots;
