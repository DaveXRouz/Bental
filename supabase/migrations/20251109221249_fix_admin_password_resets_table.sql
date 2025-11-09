/*
  # Fix Admin Password Reset Functionality
  
  1. New Tables
    - `admin_password_resets`
      - Logs all admin password reset actions for audit trail
      - Tracks which admin reset which user's password and when
  
  2. Security
    - Enable RLS on admin_password_resets table
    - Only admins can view password reset logs
*/

-- Create admin_password_resets table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id) NOT NULL,
  target_user_email TEXT NOT NULL,
  reset_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE admin_password_resets ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_password_resets_target_user 
  ON admin_password_resets(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_password_resets_admin_user 
  ON admin_password_resets(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_password_resets_reset_at 
  ON admin_password_resets(reset_at DESC);

-- RLS Policies: Only admins can view password reset logs
CREATE POLICY "Admins can view all password resets"
  ON admin_password_resets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow the function to insert (SECURITY DEFINER handles this)
CREATE POLICY "Allow function to insert password resets"
  ON admin_password_resets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
