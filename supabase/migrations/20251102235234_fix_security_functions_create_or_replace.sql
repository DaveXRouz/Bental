/*
  # Fix Security Issues - Part 4: Fix Function Search Paths (Safe)

  1. Security Enhancement
    - Set immutable search_path on all functions
    - Use CREATE OR REPLACE for all to avoid dependency issues
    - Prevents search_path hijacking attacks

  2. Functions Updated (11 functions)
    - All functions now have secure search_path = pg_catalog, public

  Important Notes:
  - Uses CREATE OR REPLACE for all functions
  - No dropping required - safe update
  - Maintains all triggers and policies
*/

-- KYC Functions
CREATE OR REPLACE FUNCTION public.auto_verify_user_kyc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.kyc_documents WHERE user_id = NEW.user_id AND status = 'approved') >= 2 THEN
    UPDATE public.profiles SET kyc_status = 'verified' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_kyc_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_kyc_complete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
BEGIN
  IF NEW.kyc_status = 'verified' AND OLD.kyc_status != 'verified' THEN
    INSERT INTO public.user_activities (user_id, activity_type, description)
    VALUES (NEW.id, 'kyc_completed', 'KYC verification completed');
  END IF;
  RETURN NEW;
END;
$$;

-- Job Queue Functions
CREATE OR REPLACE FUNCTION public.enqueue_job(
  p_job_type text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_scheduled_at timestamptz DEFAULT now(),
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE v_job_id uuid;
BEGIN
  INSERT INTO public.background_jobs (job_type, payload, scheduled_at, created_by)
  VALUES (p_job_type, p_payload, p_scheduled_at, p_created_by)
  RETURNING id INTO v_job_id;
  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_pending_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  UPDATE public.background_jobs
  SET status = 'processing', started_at = now()
  WHERE id IN (
    SELECT id FROM public.background_jobs
    WHERE status = 'pending' AND scheduled_at <= now()
    ORDER BY scheduled_at LIMIT 10
    FOR UPDATE SKIP LOCKED
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id uuid,
  p_status text,
  p_result jsonb DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  UPDATE public.background_jobs
  SET status = p_status, result = p_result, error_message = p_error, completed_at = now()
  WHERE id = p_job_id;
  INSERT INTO public.job_executions (job_id, status, result, error_message)
  VALUES (p_job_id, p_status, p_result, p_error);
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  DELETE FROM public.background_jobs
  WHERE completed_at < now() - interval '30 days'
  AND status IN ('completed', 'failed');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_job_statistics()
RETURNS TABLE(total_jobs bigint, pending_jobs bigint, processing_jobs bigint, completed_jobs bigint, failed_jobs bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_jobs
  FROM public.background_jobs;
END;
$$;

-- Lead Scoring
CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_lead_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
DECLARE
  v_score integer := 0;
  v_lead record;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  CASE v_lead.source
    WHEN 'referral' THEN v_score := v_score + 30;
    WHEN 'organic' THEN v_score := v_score + 20;
    WHEN 'paid' THEN v_score := v_score + 10;
    ELSE v_score := v_score + 5;
  END CASE;
  
  IF v_lead.email IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_lead.phone IS NOT NULL THEN v_score := v_score + 10; END IF;
  
  CASE v_lead.status
    WHEN 'qualified' THEN v_score := v_score + 40;
    WHEN 'contacted' THEN v_score := v_score + 20;
    WHEN 'new' THEN v_score := v_score + 10;
  END CASE;
  
  RETURN LEAST(v_score, 100);
END;
$$;

-- Activity Logging
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
DECLARE v_activity_id uuid;
BEGIN
  INSERT INTO public.user_activities (user_id, activity_type, description, metadata)
  VALUES (p_user_id, p_activity_type, p_description, p_metadata)
  RETURNING id INTO v_activity_id;
  RETURN v_activity_id;
END;
$$;

-- Admin Check (CRITICAL - many dependencies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role IN ('admin', 'super_admin')
  );
END;
$$;
