/*
  # Auto-Create Profile on User Signup
  
  Creates a database trigger that automatically creates a profile record
  when a new user signs up via auth.users, bypassing PostgREST cache issues.
  
  1. Changes
    - Add trigger function to auto-create profile on auth.users insert
    - Trigger fires AFTER INSERT on auth.users table
    - Extracts email and creates basic profile automatically
  
  2. Benefits
    - Works around PostgREST schema cache issues
    - Ensures every user has a profile
    - No client-side changes needed
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create default account for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default account for new user
  INSERT INTO public.accounts (user_id, account_type, name, balance, currency, is_active)
  VALUES (
    NEW.id,
    'demo_cash',
    'Main Account',
    100000.00,
    'USD',
    true
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for accounts
DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;
CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_account();
