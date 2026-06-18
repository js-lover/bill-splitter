-- ──────────────────────────────────────────────────────────────
-- 002_align_schema.sql
-- Aligns the existing manually-created schema to the full spec.
-- Safe to run: uses IF NOT EXISTS / IF EXISTS guards throughout.
-- ──────────────────────────────────────────────────────────────

-- ── GROUPS ───────────────────────────────────────────────────
-- Rename 'name' → 'title' (existing rows: 0, safe)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name'
  ) THEN
    ALTER TABLE groups RENAME COLUMN name TO title;
  END IF;
END $$;

-- Add deleted_at for soft-delete
ALTER TABLE groups ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── USERS ────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS iban         text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kolay_adres  text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS apns_token   text;

-- Unique constraint on phone_number (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_phone_number_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);
  END IF;
END $$;

-- ── EXPENSES ─────────────────────────────────────────────────
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category        text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date            date;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS document_url    text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ocr_raw_text    text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ocr_parsed_data jsonb;

-- ── DEBTS ────────────────────────────────────────────────────
ALTER TABLE debts ADD COLUMN IF NOT EXISTS settled_at          timestamptz;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS overdue_notified_at timestamptz;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();

-- ── GROUP_MEMBERS ────────────────────────────────────────────
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

-- ──────────────────────────────────────────────────────────────
-- NEW TABLES
-- ──────────────────────────────────────────────────────────────

-- GROUP_INVITES
CREATE TABLE IF NOT EXISTS group_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id),
  token      text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  used_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  data       jsonb,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RECURRING_BILL_REMINDERS
CREATE TABLE IF NOT EXISTS recurring_bill_reminders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id),
  group_id             uuid REFERENCES groups(id),
  expense_id           uuid NOT NULL REFERENCES expenses(id),
  category             text NOT NULL,
  vendor_name          text NOT NULL,
  last_amount          numeric(12,2) NOT NULL,
  last_due_date        date NOT NULL,
  next_reminder_date   date NOT NULL,
  reminder_enabled     boolean NOT NULL DEFAULT true,
  reminder_days_before integer NOT NULL DEFAULT 5,
  reminder_hour        time NOT NULL DEFAULT '09:00',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_members_user_id  ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id      ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by       ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date          ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_debts_group_id         ON debts(group_id);
CREATE INDEX IF NOT EXISTS idx_debts_debtor_id        ON debts(debtor_id);
CREATE INDEX IF NOT EXISTS idx_debts_creditor_id      ON debts(creditor_id);
CREATE INDEX IF NOT EXISTS idx_debts_unsettled        ON debts(group_id) WHERE is_settled = false;
CREATE INDEX IF NOT EXISTS idx_debts_overdue_check    ON debts(created_at) WHERE is_settled = false AND overdue_notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_next_date    ON recurring_bill_reminders(next_reminder_date) WHERE reminder_enabled = true;
CREATE INDEX IF NOT EXISTS idx_invites_token          ON group_invites(token);
CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON notifications(user_id) WHERE is_read = false;

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bill_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- users
CREATE POLICY "users_select_own"        ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_select_groupmates" ON users FOR SELECT USING (
  id IN (
    SELECT gm2.user_id FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
  )
);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE  USING (id = auth.uid());

-- groups
CREATE POLICY "groups_select" ON groups FOR SELECT
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_update" ON groups FOR UPDATE  USING (created_by = auth.uid());

-- group_members
CREATE POLICY "members_select" ON group_members FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "members_insert" ON group_members FOR INSERT
  WITH CHECK (group_id IN (SELECT id FROM groups WHERE created_by = auth.uid()));

-- expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT
  WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    AND paid_by = auth.uid()
  );
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (paid_by = auth.uid());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (paid_by = auth.uid());

-- expense_participants
CREATE POLICY "participants_select" ON expense_participants FOR SELECT
  USING (expense_id IN (
    SELECT e.id FROM expenses e
    WHERE e.group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  ));

-- debts (written only by edge functions via service role)
CREATE POLICY "debts_select" ON debts FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

-- group_invites
CREATE POLICY "invites_select" ON group_invites FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "invites_insert" ON group_invites FOR INSERT
  WITH CHECK (created_by = auth.uid()
    AND group_id IN (SELECT id FROM groups WHERE created_by = auth.uid()));

-- notifications
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE  USING (user_id = auth.uid());

-- recurring_bill_reminders
CREATE POLICY "reminders_select" ON recurring_bill_reminders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reminders_insert" ON recurring_bill_reminders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reminders_update" ON recurring_bill_reminders FOR UPDATE  USING (user_id = auth.uid());
