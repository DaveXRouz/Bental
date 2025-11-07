/*
  # Fix Bot Allocations Table Schema
  
  1. Changes
    - Add missing columns to bot_allocations table to match expected schema
    - Columns being added:
      - bot_name (TEXT)
      - strategy (TEXT)
      - account_id (UUID with foreign key)
      - minimum_balance_threshold (DECIMAL)
      - profit_loss (DECIMAL)
      - profit_loss_percent (DECIMAL)
      - total_trades (INTEGER)
      - winning_trades (INTEGER)
      - losing_trades (INTEGER)
      - win_rate (DECIMAL)
      - symbols (TEXT[])
      - is_active (BOOLEAN)
      - notes (TEXT)
      - created_at (TIMESTAMPTZ)
      - activated_at (TIMESTAMPTZ)
      - paused_at (TIMESTAMPTZ)
      - stopped_at (TIMESTAMPTZ)
  
  2. Security
    - No changes to RLS policies needed
    - Foreign key constraint added for account_id
*/

-- Add missing columns to bot_allocations table
DO $$
BEGIN
  -- Add bot_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'bot_name'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN bot_name TEXT;
  END IF;

  -- Add strategy column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'strategy'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN strategy TEXT;
  END IF;

  -- Add account_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;

  -- Add minimum_balance_threshold column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'minimum_balance_threshold'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN minimum_balance_threshold DECIMAL(15, 2);
  END IF;

  -- Add profit_loss column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'profit_loss'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN profit_loss DECIMAL(15, 2) DEFAULT 0;
  END IF;

  -- Add profit_loss_percent column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'profit_loss_percent'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN profit_loss_percent DECIMAL(10, 4) DEFAULT 0;
  END IF;

  -- Add total_trades column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'total_trades'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN total_trades INTEGER DEFAULT 0;
  END IF;

  -- Add winning_trades column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'winning_trades'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN winning_trades INTEGER DEFAULT 0;
  END IF;

  -- Add losing_trades column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'losing_trades'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN losing_trades INTEGER DEFAULT 0;
  END IF;

  -- Add win_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'win_rate'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN win_rate DECIMAL(5, 2) DEFAULT 0;
  END IF;

  -- Add symbols column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'symbols'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN symbols TEXT[] DEFAULT '{}';
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN notes TEXT;
  END IF;

  -- Add created_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add activated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'activated_at'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN activated_at TIMESTAMPTZ;
  END IF;

  -- Add paused_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'paused_at'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN paused_at TIMESTAMPTZ;
  END IF;

  -- Add stopped_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_allocations' AND column_name = 'stopped_at'
  ) THEN
    ALTER TABLE bot_allocations ADD COLUMN stopped_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing records with default values where needed
UPDATE bot_allocations 
SET 
  bot_name = COALESCE(bot_name, 'Default Bot'),
  strategy = COALESCE(strategy, 'momentum'),
  is_active = COALESCE(is_active, true),
  created_at = COALESCE(created_at, NOW())
WHERE bot_name IS NULL OR strategy IS NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_bot_allocations_account ON bot_allocations(account_id);
CREATE INDEX IF NOT EXISTS idx_bot_allocations_is_active ON bot_allocations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bot_allocations_created_at ON bot_allocations(created_at DESC);
