/*
  # Create Notifications Table

  1. New Table: notifications
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to profiles)
    - `type` (text) - notification type: price_alert, trade_execution, news, insight, system
    - `title` (text) - notification title
    - `body` (text) - notification body/message
    - `data` (jsonb) - additional metadata
    - `is_read` (boolean) - read status
    - `created_at` (timestamptz) - creation timestamp

  2. Indexes
    - user_id for fast user lookups
    - is_read for filtering unread notifications
    - created_at for sorting by date

  3. Security
    - Enable RLS
    - Users can view their own notifications
    - Users can update their own notifications (mark as read)
    - Users can delete their own notifications
    - Admins can create and manage all notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('price_alert', 'trade_execution', 'news', 'insight', 'system', 'trades', 'alerts', 'account')),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- RLS Policy: Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policy: Admins can create notifications for any user
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
        AND r.name IN ('super_admin', 'admin')
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    )
  );

-- RLS Policy: Admins can view all notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
        AND r.name IN ('super_admin', 'admin')
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    )
  );

-- RLS Policy: Admins can update all notifications
DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;
CREATE POLICY "Admins can update all notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
        AND r.name IN ('super_admin', 'admin')
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    )
  );

-- RLS Policy: Admins can delete all notifications
DROP POLICY IF EXISTS "Admins can delete all notifications" ON public.notifications;
CREATE POLICY "Admins can delete all notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid())
        AND r.name IN ('super_admin', 'admin')
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    )
  );
