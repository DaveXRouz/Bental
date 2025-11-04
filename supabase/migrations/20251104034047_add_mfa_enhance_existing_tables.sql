/*
  # Enhance Existing Security Tables and Add MFA Support
  
  Alters existing tables and creates new ones for comprehensive MFA support.
*/

-- Add user_id to login_attempts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'login_attempts' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE login_attempts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
  END IF;
END $$;

-- Create MFA Secrets table
CREATE TABLE IF NOT EXISTS mfa_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret text NOT NULL,
  backup_codes jsonb DEFAULT '[]'::jsonb,
  enabled boolean DEFAULT false,
  method text DEFAULT 'totp' CHECK (method IN ('totp', 'sms')),
  phone_number text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets(user_id);

-- Create User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL DEFAULT 'Unknown Device',
  device_id text NOT NULL,
  trusted boolean DEFAULT false,
  ip_address text,
  last_active timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);

-- Enhance login_history if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'login_history' 
    AND column_name = 'browser'
  ) THEN
    ALTER TABLE login_history ADD COLUMN browser text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE mfa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mfa_secrets
DROP POLICY IF EXISTS "Users view own MFA" ON mfa_secrets;
CREATE POLICY "Users view own MFA"
  ON mfa_secrets FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users update own MFA" ON mfa_secrets;
CREATE POLICY "Users update own MFA"
  ON mfa_secrets FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users insert own MFA" ON mfa_secrets;
CREATE POLICY "Users insert own MFA"
  ON mfa_secrets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users delete own MFA" ON mfa_secrets;
CREATE POLICY "Users delete own MFA"
  ON mfa_secrets FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- RLS Policies for login_attempts
DROP POLICY IF EXISTS "Users view own attempts" ON login_attempts;
CREATE POLICY "Users view own attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- RLS Policies for user_sessions
DROP POLICY IF EXISTS "Users view own sessions" ON user_sessions;
CREATE POLICY "Users view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users update own sessions" ON user_sessions;
CREATE POLICY "Users update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users insert own sessions" ON user_sessions;
CREATE POLICY "Users insert own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users delete own sessions" ON user_sessions;
CREATE POLICY "Users delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- RLS Policies for login_history  
DROP POLICY IF EXISTS "Users view own history" ON login_history;
CREATE POLICY "Users view own history"
  ON login_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System insert history" ON login_history;
CREATE POLICY "System insert history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Helper function for rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email text,
  p_window_minutes integer DEFAULT 15,
  p_max_attempts integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts integer;
  v_lockout_until timestamptz;
BEGIN
  SELECT COUNT(*) INTO v_attempts
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  IF v_attempts >= p_max_attempts THEN
    v_lockout_until := now() + (p_window_minutes || ' minutes')::interval;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'attempts', v_attempts,
      'lockout_until', v_lockout_until,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_lockout_until - now()))::integer
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', v_attempts,
    'remaining', p_max_attempts - v_attempts
  );
END;
$$;

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION update_mfa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mfa_timestamp ON mfa_secrets;
CREATE TRIGGER trigger_mfa_timestamp
  BEFORE UPDATE ON mfa_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_mfa_timestamp();

CREATE OR REPLACE FUNCTION update_session_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_session_active ON user_sessions;
CREATE TRIGGER trigger_session_active
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_active();
