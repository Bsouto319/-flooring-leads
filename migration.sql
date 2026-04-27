-- LeadPilot — Migration: new fields for automation sequences
-- Run this in Supabase SQL Editor

-- New columns on conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS lead_address       TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS followup_d3_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS followup_d7_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_sent_at      TIMESTAMPTZ;

-- New stage values allowed: 'awaiting_address', 'completed', 'no_show'
-- (Supabase TEXT column already accepts any value, no enum change needed)

-- New column on clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS user_id            UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS google_review_link TEXT;

-- Index for cron jobs performance
CREATE INDEX IF NOT EXISTS idx_conversations_stage_scheduled
  ON conversations (stage, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_conversations_stage_created
  ON conversations (stage, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id
  ON conversations (client_id);

-- RLS: contractor can only see their own leads
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "contractor_own_leads"
  ON conversations FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Allow service role (backend) full access
CREATE POLICY IF NOT EXISTS "service_role_full_access"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role');
