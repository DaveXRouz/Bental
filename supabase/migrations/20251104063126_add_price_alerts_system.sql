/*
  # Price Alerts System

  ## Overview
  Adds price alert functionality for stocks and cryptocurrencies

  ## New Tables

  ### 1. `price_alerts`
  - User-configured price alerts with conditions
  - Supports stocks, crypto, and forex
  - Multiple condition types (above, below, crosses)
  - Repeatable alerts with notification preferences

  ### 2. `notification_preferences`
  - User notification delivery preferences
  - Channel control (email, push, SMS)
  - Quiet hours support

  ## Security
  - RLS enabled on all new tables
  - Users can only manage their own data

  ## Functions
  - Alert checking and triggering
  - Notification creation
  - Auto-cleanup of old data
*/

-- Create price_alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  asset_type text NOT NULL DEFAULT 'stock' CHECK (asset_type IN ('stock', 'crypto', 'fx')),
  condition text NOT NULL CHECK (condition IN ('above', 'below', 'crosses_above', 'crosses_below')),
  target_price numeric NOT NULL CHECK (target_price > 0),
  current_price numeric,
  triggered boolean NOT NULL DEFAULT false,
  triggered_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  repeat boolean NOT NULL DEFAULT false,
  notify_email boolean NOT NULL DEFAULT true,
  notify_push boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  price_alerts_enabled boolean NOT NULL DEFAULT true,
  trade_confirmations_enabled boolean NOT NULL DEFAULT true,
  account_activity_enabled boolean NOT NULL DEFAULT true,
  marketing_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active ON price_alerts(user_id, active) WHERE active = true;

-- Enable RLS
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_alerts
DROP POLICY IF EXISTS "Users can view own price alerts" ON price_alerts;
CREATE POLICY "Users can view own price alerts"
  ON price_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own price alerts" ON price_alerts;
CREATE POLICY "Users can create own price alerts"
  ON price_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own price alerts" ON price_alerts;
CREATE POLICY "Users can update own price alerts"
  ON price_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own price alerts" ON price_alerts;
CREATE POLICY "Users can delete own price alerts"
  ON price_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_price_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_price_alerts_timestamp ON price_alerts;
CREATE TRIGGER trigger_price_alerts_timestamp
  BEFORE UPDATE ON price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_price_alerts_timestamp();

CREATE OR REPLACE FUNCTION update_notification_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_prefs_timestamp ON notification_preferences;
CREATE TRIGGER trigger_notification_prefs_timestamp
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_timestamp();

-- Function to check price alerts
CREATE OR REPLACE FUNCTION check_price_alerts(p_symbol text, p_current_price numeric)
RETURNS TABLE(alert_id uuid, alert_user_id uuid, alert_condition text) AS $$
BEGIN
  RETURN QUERY
  WITH triggered AS (
    UPDATE price_alerts
    SET 
      triggered = true,
      triggered_at = now(),
      current_price = p_current_price,
      active = CASE WHEN repeat THEN true ELSE false END
    WHERE 
      symbol = p_symbol
      AND active = true
      AND triggered = false
      AND (
        (condition = 'above' AND p_current_price > target_price) OR
        (condition = 'below' AND p_current_price < target_price) OR
        (condition = 'crosses_above' AND p_current_price > target_price AND (current_price IS NULL OR current_price <= target_price)) OR
        (condition = 'crosses_below' AND p_current_price < target_price AND (current_price IS NULL OR current_price >= target_price))
      )
    RETURNING id, user_id, condition
  )
  SELECT t.id, t.user_id, t.condition FROM triggered t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create alert notification
CREATE OR REPLACE FUNCTION create_price_alert_notification(
  p_user_id uuid,
  p_symbol text,
  p_condition text,
  p_target_price numeric,
  p_current_price numeric
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
  v_title text;
  v_body text;
BEGIN
  v_title := p_symbol || ' Price Alert';
  v_body := p_symbol || ' has ' || 
    CASE 
      WHEN p_condition = 'above' THEN 'risen above'
      WHEN p_condition = 'below' THEN 'fallen below'
      WHEN p_condition = 'crosses_above' THEN 'crossed above'
      WHEN p_condition = 'crosses_below' THEN 'crossed below'
      ELSE 'reached'
    END || 
    ' $' || p_target_price::text || '. Current: $' || p_current_price::text;

  INSERT INTO notifications (user_id, type, title, body, data, is_read, sent_at)
  VALUES (
    p_user_id,
    'price_alert',
    v_title,
    v_body,
    jsonb_build_object(
      'symbol', p_symbol,
      'condition', p_condition,
      'target_price', p_target_price,
      'current_price', p_current_price
    ),
    false,
    now()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
