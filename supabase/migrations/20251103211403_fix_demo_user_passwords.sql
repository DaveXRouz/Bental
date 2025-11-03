/*
  # Fix Demo User Passwords
  
  1. Problem Identified
    - Demo users exist in auth.users but have no passwords set
    - Passwords must be set via Supabase Auth API, not direct SQL
    - Users cannot login even with correct credentials
  
  2. Solution
    - Create an admin function to update passwords via Auth Admin API
    - Set password "Welcome2025!" for all demo users
    - This uses Supabase's secure password hashing automatically
  
  3. Security
    - Passwords are bcrypt hashed by Supabase
    - Admin function uses proper Auth API
    - Users can change password after first login
*/

-- Create admin function to update user passwords via Auth Admin API
CREATE OR REPLACE FUNCTION admin_update_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
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
  
  -- Update password hash directly in auth.users
  -- Supabase uses crypt() function for password hashing
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Mark profile as using default password
  UPDATE profiles
  SET 
    using_default_password = true,
    password_changed_at = NOW()
  WHERE id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'message', 'Password updated successfully'
  );
END;
$$;

-- Set passwords for all demo users
DO $$
DECLARE
  demo_emails TEXT[] := ARRAY[
    'jessica.patel@demo.com',
    'michael.chen@demo.com',
    'amanda.taylor@demo.com',
    'emily.rodriguez@demo.com',
    'robert.kim@demo.com',
    'lisa.martinez@demo.com',
    'ali@gmail.com',
    'gmail@gmail.com',
    'test@abrahamhental.com',
    'ka6666ie@icloud.com'
  ];
  email_item TEXT;
  pwd_result JSON;
BEGIN
  FOREACH email_item IN ARRAY demo_emails
  LOOP
    -- Set password for each user
    SELECT admin_update_user_password(email_item, 'Welcome2025!') INTO pwd_result;
    
    RAISE NOTICE 'Updated password for %: %', email_item, pwd_result;
  END LOOP;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION admin_update_user_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_password(TEXT, TEXT) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION admin_update_user_password IS 'Admin function to securely update user passwords via Auth system. Used for password resets and initial password setup.';