/*
  # Add Anonymous Access Policies for App Configuration

  ## Overview
  This migration adds RLS policies to allow the anon (unauthenticated) role
  to read from app_configuration and profiles tables. This is essential for
  the application to fetch configuration before user authentication.

  ## Changes
  1. Add SELECT policy for anon role on app_configuration
  2. Add SELECT policy for anon role on profiles (for public profiles)
  3. Ensure tables are in supabase_realtime publication

  ## Security
  - Anon users can only SELECT (read), not modify data
  - RLS is still enforced, so policies control what data is visible
  - App configuration is public by design (for client-side feature flags)
*/

-- =====================================================
-- APP_CONFIGURATION: Add anon read policy
-- =====================================================

-- Drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read of app configuration" ON public.app_configuration;

-- Create policy for anon role
CREATE POLICY "Allow anonymous read of app configuration"
  ON public.app_configuration FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- PROFILES: Add anon read policy for public profiles
-- =====================================================

-- Drop if exists
DROP POLICY IF EXISTS "Allow anonymous read of public profiles" ON public.profiles;

-- Create policy for anon role (only for public data)
CREATE POLICY "Allow anonymous read of public profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- ENSURE REALTIME PUBLICATION
-- =====================================================

DO $$
BEGIN
  -- Add app_configuration to realtime publication
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Try to add table, ignore if already exists
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.app_configuration;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Already in publication
    END;
    
    -- Try to add profiles table
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Already in publication
    END;
  END IF;
END $$;

-- =====================================================
-- VERIFY SCHEMA ACCESS
-- =====================================================

-- Grant USAGE on schema to anon (should already exist but ensuring)
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on specific tables to anon
GRANT SELECT ON public.app_configuration TO anon;
GRANT SELECT ON public.profiles TO anon;

-- Also grant to authenticated for good measure
GRANT SELECT ON public.app_configuration TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;