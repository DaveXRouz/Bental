/*
  # Onboarding System
  
  Creates tables and functions for tracking user onboarding progress.
  
  1. **New Tables**
     - `user_onboarding` - Tracks onboarding completion status
     - `onboarding_steps` - Defines onboarding steps
     - `user_tutorial_progress` - Tracks individual tutorial completions
  
  2. **Security**
     - Enable RLS on all tables
     - Users can only access their own onboarding data
*/

-- Create onboarding steps table (admin-managed)
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  screen text,
  order_index int NOT NULL,
  required boolean DEFAULT true,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Onboarding steps are viewable by everyone"
  ON onboarding_steps FOR SELECT
  TO authenticated
  USING (true);

-- Create user onboarding progress table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  current_step text,
  completed_steps text[] DEFAULT ARRAY[]::text[],
  skipped boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  last_seen_step text,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
  ON user_onboarding FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON user_onboarding FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON user_onboarding FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create tutorial progress table
CREATE TABLE IF NOT EXISTS user_tutorial_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_key text NOT NULL,
  completed boolean DEFAULT false,
  dismissed boolean DEFAULT false,
  view_count int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tutorial_key)
);

ALTER TABLE user_tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tutorial progress"
  ON user_tutorial_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial progress"
  ON user_tutorial_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutorial progress"
  ON user_tutorial_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default onboarding steps
INSERT INTO onboarding_steps (step_key, title, description, screen, order_index, category)
VALUES
  ('welcome', 'Welcome to the Platform', 'Get started with your trading journey', 'index', 1, 'introduction'),
  ('profile_setup', 'Complete Your Profile', 'Add your details and preferences', 'profile', 2, 'setup'),
  ('first_watchlist', 'Create Your First Watchlist', 'Track stocks you''re interested in', 'markets', 3, 'features'),
  ('explore_bots', 'Explore AI Trading Bots', 'Discover automated trading strategies', 'bot-marketplace', 4, 'features'),
  ('first_trade', 'Make Your First Trade', 'Learn how to buy and sell', 'trade', 5, 'features'),
  ('portfolio_overview', 'View Your Portfolio', 'Monitor your investments', 'portfolio', 6, 'features'),
  ('setup_alerts', 'Set Price Alerts', 'Get notified about price changes', 'alerts', 7, 'features'),
  ('news_feed', 'Stay Informed', 'Read market news and analysis', 'news', 8, 'features')
ON CONFLICT (step_key) DO NOTHING;

-- Function to initialize onboarding for new user
CREATE OR REPLACE FUNCTION initialize_user_onboarding()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_onboarding (user_id, current_step)
  VALUES (NEW.id, 'welcome')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-initialize onboarding when profile is created
DROP TRIGGER IF EXISTS on_profile_created_init_onboarding ON profiles;
CREATE TRIGGER on_profile_created_init_onboarding
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_onboarding();

-- Function to mark onboarding step complete
CREATE OR REPLACE FUNCTION complete_onboarding_step(
  p_user_id uuid,
  p_step_key text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_step text;
  v_all_required_complete boolean;
BEGIN
  -- Add step to completed list
  UPDATE user_onboarding
  SET 
    completed_steps = array_append(
      COALESCE(completed_steps, ARRAY[]::text[]),
      p_step_key
    ),
    last_seen_step = p_step_key,
    last_interaction_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
  AND NOT (p_step_key = ANY(COALESCE(completed_steps, ARRAY[]::text[])));
  
  -- Get next step
  SELECT step_key INTO v_next_step
  FROM onboarding_steps
  WHERE order_index > (
    SELECT order_index FROM onboarding_steps WHERE step_key = p_step_key
  )
  ORDER BY order_index
  LIMIT 1;
  
  -- Update current step
  IF v_next_step IS NOT NULL THEN
    UPDATE user_onboarding
    SET current_step = v_next_step
    WHERE user_id = p_user_id;
  ELSE
    -- Check if all required steps are complete
    SELECT NOT EXISTS (
      SELECT 1 FROM onboarding_steps os
      WHERE os.required = true
      AND NOT (os.step_key = ANY(
        SELECT completed_steps FROM user_onboarding WHERE user_id = p_user_id
      ))
    ) INTO v_all_required_complete;
    
    -- Mark onboarding as complete if all required steps done
    IF v_all_required_complete THEN
      UPDATE user_onboarding
      SET 
        completed = true,
        completed_at = now(),
        current_step = NULL
      WHERE user_id = p_user_id;
    END IF;
  END IF;
END;
$$;

-- Function to skip onboarding
CREATE OR REPLACE FUNCTION skip_onboarding(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_onboarding
  SET 
    skipped = true,
    completed = true,
    completed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Initialize onboarding for existing users
INSERT INTO user_onboarding (user_id, current_step)
SELECT id, 'welcome'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_onboarding WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;
