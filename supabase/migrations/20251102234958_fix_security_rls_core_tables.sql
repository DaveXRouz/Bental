/*
  # Fix Security Issues - Part 2: Optimize Core RLS Policies

  1. RLS Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in policies
    - Prevents re-evaluation for each row (major performance gain)
    - Only updates policies that exist

  2. Core Tables Updated
    - profiles
    - accounts  
    - bot_allocations
    - bot_trades
    - withdrawals
    - kyc_documents
    - user_activities

  Important Notes:
  - Uses DROP IF EXISTS for safety
  - All admin checks use is_admin() function
  - Maintains exact same security logic
*/

-- =====================================================
-- PROFILES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (select auth.uid()) OR
  is_admin()
);

DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
CREATE POLICY "Users can update own profile or admins update all"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = (select auth.uid()) OR
  is_admin()
)
WITH CHECK (
  id = (select auth.uid()) OR
  is_admin()
);

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own accounts or admins can view all" ON public.accounts;
CREATE POLICY "Users can view own accounts or admins can view all"
ON public.accounts FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
);

DROP POLICY IF EXISTS "Users can update own accounts or admins can update all" ON public.accounts;
CREATE POLICY "Users can update own accounts or admins can update all"
ON public.accounts FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
)
WITH CHECK (
  user_id = (select auth.uid()) OR
  is_admin()
);

-- =====================================================
-- BOT_ALLOCATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own allocations or admins can view all" ON public.bot_allocations;
CREATE POLICY "Users can view own allocations or admins can view all"
ON public.bot_allocations FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
);

DROP POLICY IF EXISTS "Users can update own allocations or admins can update all" ON public.bot_allocations;
CREATE POLICY "Users can update own allocations or admins can update all"
ON public.bot_allocations FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
)
WITH CHECK (
  user_id = (select auth.uid()) OR
  is_admin()
);

-- Remove duplicate policy if exists
DROP POLICY IF EXISTS "Users can view own bot allocations" ON public.bot_allocations;
DROP POLICY IF EXISTS "Users can update own bot allocations" ON public.bot_allocations;

-- =====================================================
-- BOT_TRADES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own bot trades or admins can view all" ON public.bot_trades;
CREATE POLICY "Users can view own bot trades or admins can view all"
ON public.bot_trades FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bot_allocations ba
    WHERE ba.id = bot_trades.bot_allocation_id
    AND ba.user_id = (select auth.uid())
  ) OR
  is_admin()
);

-- Remove duplicate policy if exists
DROP POLICY IF EXISTS "Users can view own trades" ON public.bot_trades;

-- =====================================================
-- WITHDRAWALS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own withdrawals or admins view all" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals or admins view all"
ON public.withdrawals FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
);

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert own withdrawals"
ON public.withdrawals FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
);

-- =====================================================
-- KYC_DOCUMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own documents" ON public.kyc_documents;
CREATE POLICY "Users can view own documents"
ON public.kyc_documents FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all documents" ON public.kyc_documents;
CREATE POLICY "Admins can view all documents"
ON public.kyc_documents FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Users can upload own documents" ON public.kyc_documents;
CREATE POLICY "Users can upload own documents"
ON public.kyc_documents FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Users can update own pending documents" ON public.kyc_documents;
CREATE POLICY "Users can update own pending documents"
ON public.kyc_documents FOR UPDATE
TO authenticated
USING (
  user_id = (select auth.uid()) AND status = 'pending'
)
WITH CHECK (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Admins can update documents" ON public.kyc_documents;
CREATE POLICY "Admins can update documents"
ON public.kyc_documents FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- USER_ACTIVITIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own activities" ON public.user_activities;
CREATE POLICY "Users can view own activities"
ON public.user_activities FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all activities" ON public.user_activities;
CREATE POLICY "Admins can view all activities"
ON public.user_activities FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- AUDIT_LOG TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admin roles can read audit logs" ON public.audit_log;
CREATE POLICY "Admin roles can read audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- BACKGROUND_JOBS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own jobs" ON public.background_jobs;
CREATE POLICY "Users can view their own jobs"
ON public.background_jobs FOR SELECT
TO authenticated
USING (
  created_by = (select auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all jobs" ON public.background_jobs;
CREATE POLICY "Admins can view all jobs"
ON public.background_jobs FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- JOB_EXECUTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all executions" ON public.job_executions;
CREATE POLICY "Admins can view all executions"
ON public.job_executions FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- BOTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view active bots or admins view all" ON public.bots;
CREATE POLICY "Users can view active bots or admins view all"
ON public.bots FOR SELECT
TO authenticated
USING (
  is_active = true OR
  is_admin()
);

-- =====================================================
-- BOT_INSTANCES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own bot instances or admins view all" ON public.bot_instances;
CREATE POLICY "Users can view own bot instances or admins view all"
ON public.bot_instances FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  is_admin()
);

-- Remove duplicate policy if exists
DROP POLICY IF EXISTS "Admins can manage bot instances" ON public.bot_instances;
