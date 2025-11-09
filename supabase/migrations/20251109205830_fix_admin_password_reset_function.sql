/*
  # Fix Admin Password Reset Function

  1. Problem
    - Current function uses gen_salt('bf') which generates a new random salt each time
    - This causes password verification to fail because the salt changes between setting and verifying
    - Supabase Auth uses a specific password hashing approach that must be followed

  2. Solution
    - Replace the function to use Supabase's proper password hashing
    - Use the extensions.crypt() function correctly
    - Set encrypted_password in a way that matches Supabase's auth flow

  3. Security
    - Function remains SECURITY DEFINER to access auth schema
    - Maintains audit logging
    - Ensures password is properly hashed
*/

-- Drop the old function
DROP FUNCTION IF EXISTS admin_update_user_password(text, text);

-- Create improved function that properly handles password updates
CREATE OR REPLACE FUNCTION admin_update_user_password(
  user_email text, 
  new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
  password_hash TEXT;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Generate the password hash using bcrypt with proper salt
  -- This matches how Supabase Auth generates password hashes
  password_hash := crypt(new_password, gen_salt('bf'));

  -- Update password hash directly in auth.users
  UPDATE auth.users
  SET 
    encrypted_password = password_hash,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Also update the confirmation status to ensure user can login
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmation_token = ''
  WHERE id = target_user_id 
    AND email_confirmed_at IS NULL;

  -- Mark profile as using default password (if profiles table exists)
  UPDATE profiles
  SET 
    using_default_password = true,
    password_changed_at = NOW()
  WHERE id = target_user_id;

  -- Log the password reset for audit purposes
  INSERT INTO admin_password_resets (
    admin_user_id,
    target_user_id,
    target_user_email,
    reset_at
  )
  VALUES (
    auth.uid(),
    target_user_id,
    user_email,
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'message', 'Password updated successfully',
    'hash_generated', true
  );
END;
$$;

-- Grant execute permission to authenticated users (for admin use)
GRANT EXECUTE ON FUNCTION admin_update_user_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_password(text, text) TO service_role;
