/*
  # Setup Admin Accounts - Final
  
  1. Admin Users
    - michael.chen@demo.com -> admin role
    - jessica.patel@demo.com -> admin role
  
  2. Credentials
    - Email: michael.chen@demo.com
    - Password: Welcome2025!
    - Role: admin
  
  3. Features
    - Full admin panel access
    - User management capabilities
    - System monitoring
*/

-- Promote michael.chen to admin
UPDATE profiles
SET 
  role = 'admin',
  kyc_status = 'verified',
  email_verified = true,
  email_verified_at = NOW(),
  risk_level = 'low',
  risk_tier = 'A'
WHERE email = 'michael.chen@demo.com';

-- Promote jessica.patel to admin
UPDATE profiles
SET 
  role = 'admin',
  kyc_status = 'verified',
  email_verified = true,
  email_verified_at = NOW(),
  risk_level = 'low',
  risk_tier = 'A'
WHERE email = 'jessica.patel@demo.com';

-- Create a comment documenting admin access
COMMENT ON COLUMN profiles.role IS 'User role: user (default), admin (full system access)';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Admin accounts setup completed';
  RAISE NOTICE 'Admin 1: michael.chen@demo.com / Welcome2025!';
  RAISE NOTICE 'Admin 2: jessica.patel@demo.com / Welcome2025!';
END $$;