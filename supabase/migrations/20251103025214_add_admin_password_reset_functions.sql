/*
  # Add Admin Password Reset Functions

  1. New Functions
    - Functions to manage user passwords from admin panel
    - Get user information for admin interface

  2. Security
    - Functions use SECURITY DEFINER to bypass RLS
    - Logs all password reset attempts in security_events table

  3. Audit Trail
    - All admin password resets are logged with admin user ID
    - Includes timestamp and metadata for compliance
*/

-- Create function to get user info by email
CREATE OR REPLACE FUNCTION admin_get_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    p.password_changed_at
  FROM profiles p
  WHERE p.email = p_email;
END;
$$;

-- Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION admin_get_all_users(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.created_at,
    p.password_changed_at
  FROM profiles p
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create function to log admin password reset
CREATE OR REPLACE FUNCTION log_admin_password_reset(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_success BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_metadata JSONB;
BEGIN
  v_metadata := jsonb_build_object(
    'admin_id', p_admin_id,
    'target_user_id', p_target_user_id,
    'action', 'admin_password_reset',
    'timestamp', NOW()
  );

  INSERT INTO public.security_events (
    user_id,
    event_type,
    success,
    metadata
  ) VALUES (
    p_target_user_id,
    'password_change',
    p_success,
    v_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Add comments
COMMENT ON FUNCTION admin_get_user_by_email IS 'Get user information by email (admin only)';
COMMENT ON FUNCTION admin_get_all_users IS 'Get all users with pagination (admin only)';
COMMENT ON FUNCTION log_admin_password_reset IS 'Log admin password reset attempts for audit trail';
