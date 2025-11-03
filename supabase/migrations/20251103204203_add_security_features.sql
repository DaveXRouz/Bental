/*
  # Add Security and Activity Tracking Features

  1. New Tables
    - `login_attempts`
      - Track failed login attempts for security
      - Enable account lockout functionality
    
    - `login_history`
      - Track successful logins with device info
      - Audit trail for security monitoring
    
    - `user_devices`
      - Manage trusted devices
      - Enable device-based security features

  2. Security Features
    - Failed login attempt tracking
    - Account lockout after threshold
    - Login history audit trail
    - Device fingerprinting
    - Email verification tracking

  3. Security Policies
    - Enable RLS on all new tables
    - Users can only view their own records
    - Admin override for security monitoring
*/

-- Login Attempts Table (for security monitoring)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempt_time TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempt_time);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

-- Login History Table (successful logins)
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_time TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  device_name TEXT,
  device_type TEXT,
  location_city TEXT,
  location_country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_time ON login_history(login_time DESC);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User Devices Table (trusted devices)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint TEXT UNIQUE NOT NULL,
  device_name TEXT,
  device_type TEXT,
  device_os TEXT,
  browser TEXT,
  is_trusted BOOLEAN DEFAULT false,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  last_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_devices_trusted ON user_devices(is_trusted);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON user_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add security fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_locked'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_locked BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_locked_until'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_locked_until TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_secret'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_secret TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'biometric_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN biometric_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_status BOOLEAN;
  locked_until TIMESTAMPTZ;
BEGIN
  SELECT account_locked, account_locked_until
  INTO locked_status, locked_until
  FROM profiles
  WHERE email = user_email;

  IF locked_status AND locked_until IS NOT NULL THEN
    IF locked_until > now() THEN
      RETURN true;
    ELSE
      UPDATE profiles
      SET account_locked = false,
          account_locked_until = NULL,
          failed_login_attempts = 0
      WHERE email = user_email;
      RETURN false;
    END IF;
  END IF;

  RETURN COALESCE(locked_status, false);
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_attempts INTEGER;
BEGIN
  INSERT INTO login_attempts (email, success, ip_address, user_agent, failure_reason)
  VALUES (p_email, p_success, p_ip_address, p_user_agent, p_failure_reason);

  IF NOT p_success THEN
    UPDATE profiles
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE email = p_email
    RETURNING failed_login_attempts INTO v_failed_attempts;

    IF v_failed_attempts >= 5 THEN
      UPDATE profiles
      SET account_locked = true,
          account_locked_until = now() + INTERVAL '30 minutes'
      WHERE email = p_email;
    END IF;
  ELSE
    UPDATE profiles
    SET failed_login_attempts = 0,
        last_login = now()
    WHERE email = p_email;
  END IF;
END;
$$;

-- Function to record login history
CREATE OR REPLACE FUNCTION record_login_history(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO login_history (
    user_id,
    ip_address,
    user_agent,
    device_name,
    device_type
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_device_name,
    p_device_type
  ) RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;

-- Function to register or update device
CREATE OR REPLACE FUNCTION register_device(
  p_user_id UUID,
  p_device_fingerprint TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_device_os TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_id UUID;
BEGIN
  INSERT INTO user_devices (
    user_id,
    device_fingerprint,
    device_name,
    device_type,
    device_os,
    browser,
    last_ip,
    last_seen
  ) VALUES (
    p_user_id,
    p_device_fingerprint,
    p_device_name,
    p_device_type,
    p_device_os,
    p_browser,
    p_ip_address,
    now()
  )
  ON CONFLICT (device_fingerprint)
  DO UPDATE SET
    last_seen = now(),
    last_ip = p_ip_address,
    updated_at = now()
  RETURNING id INTO v_device_id;

  RETURN v_device_id;
END;
$$;
