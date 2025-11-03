/*
  # Add Trading Passport Support

  1. Schema Changes
    - Add `trading_passport_number` column to profiles table (unique identifier)
    - Add `passport_prefix` for country-based prefixing (optional)
    - Add index for fast trading passport lookups
    
  2. Functions
    - Create function to generate unique trading passport numbers
    - Format: TP-XXXX-XXXX-XXXX (where X is alphanumeric)
    
  3. Security
    - RLS policies already cover this column via existing profile policies
    - Ensure trading passport numbers are searchable for authentication
*/

-- Add trading_passport_number column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trading_passport_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trading_passport_number TEXT UNIQUE;
  END IF;
END $$;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_trading_passport 
ON public.profiles(trading_passport_number);

-- Function to generate unique trading passport number
CREATE OR REPLACE FUNCTION generate_trading_passport()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_passport TEXT;
  passport_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: TP-XXXX-XXXX-XXXX
    new_passport := 'TP-' || 
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4)) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4)) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
    
    -- Check if passport already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE trading_passport_number = new_passport
    ) INTO passport_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT passport_exists;
  END LOOP;
  
  RETURN new_passport;
END;
$$;

-- Trigger to auto-generate trading passport on profile creation
CREATE OR REPLACE FUNCTION auto_generate_trading_passport()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.trading_passport_number IS NULL THEN
    NEW.trading_passport_number := generate_trading_passport();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_auto_generate_trading_passport ON public.profiles;
CREATE TRIGGER trigger_auto_generate_trading_passport
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_trading_passport();

-- Backfill existing profiles with trading passport numbers
UPDATE public.profiles
SET trading_passport_number = generate_trading_passport()
WHERE trading_passport_number IS NULL;

COMMENT ON COLUMN public.profiles.trading_passport_number IS 'Unique trading passport identifier for alternative login method';
COMMENT ON FUNCTION generate_trading_passport() IS 'Generates a unique trading passport number in format TP-XXXX-XXXX-XXXX';
