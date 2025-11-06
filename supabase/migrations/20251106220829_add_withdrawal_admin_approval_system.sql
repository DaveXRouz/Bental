/*
  # Withdrawal Admin Approval System

  1. Changes to withdrawals table
    - Add `admin_approval_status` (text) - Status of admin review
    - Add `reviewed_by` (uuid) - Admin who reviewed the withdrawal
    - Add `reviewed_at` (timestamptz) - When the review occurred
    - Add `admin_notes` (text) - Admin comments/rejection reasons
    - Add `original_amount` (numeric) - Original requested amount
    - Add `modified_amount` (numeric) - Admin-modified amount (if changed)
    - Add `rejection_reason` (text) - Standardized rejection reason category

  2. New Tables
    - `withdrawal_admin_actions` - Audit log of all admin actions
      - `id` (uuid, primary key)
      - `withdrawal_id` (uuid, references withdrawals)
      - `admin_id` (uuid, references auth.users)
      - `action` (text) - 'approved', 'rejected', 'modified', 'cancelled'
      - `previous_status` (text)
      - `new_status` (text)
      - `amount_before` (numeric)
      - `amount_after` (numeric)
      - `notes` (text)
      - `ip_address` (text)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on audit table
    - Add policies for admin-only access to audit logs
    - Add policies for admin approval actions
    - Create function to validate admin role before approval

  4. Indexes
    - Index on admin_approval_status for filtering
    - Index on reviewed_by for admin performance tracking
    - Index on withdrawal_id in audit table
    - Index on created_at for chronological queries

  5. Functions
    - `is_admin(user_id)` - Check if user has admin privileges
    - `log_admin_action()` - Automatically log admin actions
    - Update `process_withdrawal()` to only work after admin approval
*/

-- Add new columns to withdrawals table
DO $$
BEGIN
  -- Admin approval status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'admin_approval_status'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN admin_approval_status text NOT NULL DEFAULT 'pending_review' 
      CHECK (admin_approval_status IN ('pending_review', 'approved', 'rejected', 'cancelled'));
  END IF;

  -- Reviewed by (admin user)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN reviewed_by uuid REFERENCES auth.users(id);
  END IF;

  -- Review timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN reviewed_at timestamptz;
  END IF;

  -- Admin notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN admin_notes text;
  END IF;

  -- Original amount (before admin modification)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'original_amount'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN original_amount numeric;
  END IF;

  -- Modified amount (if admin changes it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'modified_amount'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN modified_amount numeric;
  END IF;

  -- Rejection reason category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN rejection_reason text
      CHECK (rejection_reason IN ('insufficient_verification', 'suspicious_activity', 'incorrect_details', 'insufficient_funds', 'other'));
  END IF;
END $$;

-- Create withdrawal admin actions audit table
CREATE TABLE IF NOT EXISTS withdrawal_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES withdrawals(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'modified', 'cancelled', 'reviewed')),
  previous_status text,
  new_status text,
  amount_before numeric,
  amount_after numeric,
  notes text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE withdrawal_admin_actions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_admin_approval_status ON withdrawals(admin_approval_status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_reviewed_by ON withdrawals(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_withdrawals_reviewed_at ON withdrawals(reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_admin_actions_withdrawal_id ON withdrawal_admin_actions(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_admin_actions_admin_id ON withdrawal_admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_admin_actions_created_at ON withdrawal_admin_actions(created_at DESC);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has admin role in profiles table
  -- Adjust this based on your actual admin role structure
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND (email LIKE '%@admin.%' OR email IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    ))
  );
END;
$$;

-- RLS Policies for withdrawal_admin_actions
CREATE POLICY "Admins can view all withdrawal actions"
  ON withdrawal_admin_actions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert withdrawal actions"
  ON withdrawal_admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) AND admin_id = auth.uid());

-- Update the process_withdrawal function to require admin approval
CREATE OR REPLACE FUNCTION process_withdrawal(p_withdrawal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals;
  v_current_balance numeric;
  v_withdrawal_amount numeric;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  -- Check admin approval status
  IF v_withdrawal.admin_approval_status != 'approved' THEN
    RAISE EXCEPTION 'Withdrawal must be approved by admin before processing. Current status: %', v_withdrawal.admin_approval_status;
  END IF;

  IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
    RAISE EXCEPTION 'Withdrawal cannot be processed in current status: %', v_withdrawal.status;
  END IF;

  -- Determine withdrawal amount (use modified amount if set, otherwise original)
  v_withdrawal_amount := COALESCE(v_withdrawal.modified_amount, v_withdrawal.amount);

  -- Check account balance
  SELECT balance INTO v_current_balance FROM accounts WHERE id = v_withdrawal.account_id;

  IF v_current_balance < v_withdrawal_amount THEN
    -- Mark as failed
    UPDATE withdrawals
    SET status = 'failed',
        admin_approval_status = 'rejected',
        notes = COALESCE(notes || E'\n', '') || 'Insufficient funds at processing time',
        updated_at = now()
    WHERE id = p_withdrawal_id;
    RAISE EXCEPTION 'Insufficient funds for withdrawal';
  END IF;

  -- Update account balance
  UPDATE accounts
  SET balance = balance - v_withdrawal_amount,
      updated_at = now()
  WHERE id = v_withdrawal.account_id;

  -- Update withdrawal status
  UPDATE withdrawals
  SET status = 'completed',
      processed_at = now(),
      updated_at = now()
  WHERE id = p_withdrawal_id;
END;
$$;

-- Function to approve withdrawal (admin only)
CREATE OR REPLACE FUNCTION admin_approve_withdrawal(
  p_withdrawal_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL,
  p_modified_amount numeric DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals;
  v_result json;
  v_final_amount numeric;
BEGIN
  -- Verify admin privileges
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'User does not have admin privileges';
  END IF;

  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.admin_approval_status != 'pending_review' THEN
    RAISE EXCEPTION 'Withdrawal is not in pending_review status. Current status: %', v_withdrawal.admin_approval_status;
  END IF;

  -- Store original amount if not already set
  IF v_withdrawal.original_amount IS NULL THEN
    UPDATE withdrawals SET original_amount = amount WHERE id = p_withdrawal_id;
  END IF;

  -- Determine final amount
  v_final_amount := COALESCE(p_modified_amount, v_withdrawal.amount);

  -- Validate modified amount if provided
  IF p_modified_amount IS NOT NULL THEN
    IF p_modified_amount <= 0 THEN
      RAISE EXCEPTION 'Modified amount must be greater than zero';
    END IF;
    IF p_modified_amount > v_withdrawal.amount THEN
      RAISE EXCEPTION 'Modified amount cannot exceed original requested amount';
    END IF;
  END IF;

  -- Check account balance
  DECLARE
    v_current_balance numeric;
  BEGIN
    SELECT balance INTO v_current_balance FROM accounts WHERE id = v_withdrawal.account_id;
    
    IF v_current_balance < v_final_amount THEN
      RAISE EXCEPTION 'Insufficient funds in account. Available: %, Requested: %', v_current_balance, v_final_amount;
    END IF;
  END;

  -- Update withdrawal record
  UPDATE withdrawals
  SET admin_approval_status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      admin_notes = p_notes,
      modified_amount = p_modified_amount,
      status = 'processing',
      updated_at = now()
  WHERE id = p_withdrawal_id;

  -- Log admin action
  INSERT INTO withdrawal_admin_actions (
    withdrawal_id,
    admin_id,
    action,
    previous_status,
    new_status,
    amount_before,
    amount_after,
    notes
  ) VALUES (
    p_withdrawal_id,
    p_admin_id,
    CASE WHEN p_modified_amount IS NOT NULL THEN 'modified' ELSE 'approved' END,
    v_withdrawal.admin_approval_status,
    'approved',
    v_withdrawal.amount,
    v_final_amount,
    p_notes
  );

  -- Process the withdrawal (deduct funds)
  PERFORM process_withdrawal(p_withdrawal_id);

  v_result := json_build_object(
    'success', true,
    'withdrawal_id', p_withdrawal_id,
    'original_amount', v_withdrawal.amount,
    'final_amount', v_final_amount,
    'modified', p_modified_amount IS NOT NULL
  );

  RETURN v_result;
END;
$$;

-- Function to reject withdrawal (admin only)
CREATE OR REPLACE FUNCTION admin_reject_withdrawal(
  p_withdrawal_id uuid,
  p_admin_id uuid,
  p_rejection_reason text,
  p_notes text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals;
  v_result json;
BEGIN
  -- Verify admin privileges
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'User does not have admin privileges';
  END IF;

  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.admin_approval_status != 'pending_review' THEN
    RAISE EXCEPTION 'Withdrawal is not in pending_review status. Current status: %', v_withdrawal.admin_approval_status;
  END IF;

  -- Validate rejection reason
  IF p_rejection_reason NOT IN ('insufficient_verification', 'suspicious_activity', 'incorrect_details', 'insufficient_funds', 'other') THEN
    RAISE EXCEPTION 'Invalid rejection reason';
  END IF;

  -- Update withdrawal record
  UPDATE withdrawals
  SET admin_approval_status = 'rejected',
      status = 'cancelled',
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      rejection_reason = p_rejection_reason,
      admin_notes = p_notes,
      updated_at = now()
  WHERE id = p_withdrawal_id;

  -- Log admin action
  INSERT INTO withdrawal_admin_actions (
    withdrawal_id,
    admin_id,
    action,
    previous_status,
    new_status,
    notes
  ) VALUES (
    p_withdrawal_id,
    p_admin_id,
    'rejected',
    v_withdrawal.admin_approval_status,
    'rejected',
    format('Reason: %s - %s', p_rejection_reason, p_notes)
  );

  v_result := json_build_object(
    'success', true,
    'withdrawal_id', p_withdrawal_id,
    'rejection_reason', p_rejection_reason
  );

  RETURN v_result;
END;
$$;

-- Function for users to cancel their own pending withdrawal
CREATE OR REPLACE FUNCTION user_cancel_withdrawal(
  p_withdrawal_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawals;
  v_result json;
BEGIN
  -- Get withdrawal details and verify ownership
  SELECT * INTO v_withdrawal 
  FROM withdrawals 
  WHERE id = p_withdrawal_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or access denied';
  END IF;

  -- Can only cancel if pending review
  IF v_withdrawal.admin_approval_status != 'pending_review' THEN
    RAISE EXCEPTION 'Can only cancel withdrawals that are pending review. Current status: %', v_withdrawal.admin_approval_status;
  END IF;

  -- Update withdrawal record
  UPDATE withdrawals
  SET admin_approval_status = 'cancelled',
      status = 'cancelled',
      notes = COALESCE(notes || E'\n', '') || 'Cancelled by user',
      updated_at = now()
  WHERE id = p_withdrawal_id;

  v_result := json_build_object(
    'success', true,
    'withdrawal_id', p_withdrawal_id,
    'message', 'Withdrawal cancelled successfully'
  );

  RETURN v_result;
END;
$$;

-- Add comment to admin_approval_status column
COMMENT ON COLUMN withdrawals.admin_approval_status IS 'Admin review status: pending_review (awaiting admin), approved (admin approved, processing), rejected (admin denied), cancelled (user or admin cancelled)';
