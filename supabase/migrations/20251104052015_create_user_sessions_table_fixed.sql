/*
  # Create User Sessions Table

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key) - Session identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `device_name` (text) - Name of the device
      - `device_id` (text) - Unique device identifier
      - `trusted` (boolean) - Whether device is trusted
      - `ip_address` (text, nullable) - IP address of the session
      - `last_active` (timestamptz) - Last activity timestamp
      - `created_at` (timestamptz) - Session creation time
      - `expires_at` (timestamptz) - Session expiration time
  
  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for users to manage their own sessions
  
  3. Indexes
    - Add index on user_id for faster queries
    - Add unique constraint on (user_id, device_id) combination
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_id text NOT NULL,
  trusted boolean DEFAULT false,
  ip_address text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CONSTRAINT user_sessions_user_device_unique UNIQUE (user_id, device_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON public.user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
ON public.user_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Users can view own sessions'
  ) THEN
    CREATE POLICY "Users can view own sessions"
      ON public.user_sessions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can insert their own sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Users can create own sessions'
  ) THEN
    CREATE POLICY "Users can create own sessions"
      ON public.user_sessions
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can update their own sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Users can update own sessions'
  ) THEN
    CREATE POLICY "Users can update own sessions"
      ON public.user_sessions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can delete their own sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Users can delete own sessions'
  ) THEN
    CREATE POLICY "Users can delete own sessions"
      ON public.user_sessions
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;