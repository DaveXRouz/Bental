/*
  # Add Password Security Features

  1. Schema Changes
    - Add `password_changed_at` column to profiles table to track last password update
    - Create `security_events` table for audit logging of password change attempts
    - Add indexes for efficient security audit queries

  2. Security
    - Enable RLS on security_events table
    - Add policies for users to view only their own security events
    - Add trigger to automatically update password_changed_at timestamp

  3. Audit Trail
    - Track all password change attempts with timestamps and success status
    - Store IP address and device information for security monitoring
    - Implement automatic cleanup of old security events (optional)
*/

-- Add password_changed_at column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_changed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create security_events table for audit logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('password_change', 'password_change_failed', 'login', 'logout')),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);

-- Enable RLS on security_events table
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own security events
CREATE POLICY "Users can view own security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own security events
CREATE POLICY "Users can insert own security events"
  ON public.security_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    success,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_success,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Create function to clean up old security events (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.security_events
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- Add comment to password_changed_at column
COMMENT ON COLUMN public.profiles.password_changed_at IS 'Timestamp of the last password change for security tracking';

-- Add comments to security_events table
COMMENT ON TABLE public.security_events IS 'Audit log for security-related events including password changes';
COMMENT ON COLUMN public.security_events.event_type IS 'Type of security event: password_change, password_change_failed, login, logout';
COMMENT ON COLUMN public.security_events.success IS 'Whether the security event was successful';
COMMENT ON COLUMN public.security_events.ip_address IS 'IP address from which the event originated';
COMMENT ON COLUMN public.security_events.user_agent IS 'Browser/device user agent string';
COMMENT ON COLUMN public.security_events.metadata IS 'Additional event metadata in JSON format';
