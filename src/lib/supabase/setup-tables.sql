-- Abe Command Center — Supabase Tables
-- Run this in the Supabase SQL Editor

-- Agent Status
CREATE TABLE IF NOT EXISTS agent_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'error')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG Documents
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  ingestion_status TEXT NOT NULL DEFAULT 'pending' CHECK (ingestion_status IN ('pending', 'ingested', 'failed', 'skipped')),
  ingested_at TIMESTAMPTZ,
  file_size BIGINT,
  priority INTEGER DEFAULT 2,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Life Log
CREATE TABLE IF NOT EXISTS life_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  category TEXT NOT NULL,
  entry TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Runs
CREATE TABLE IF NOT EXISTS task_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
  notes TEXT,
  usage_at_start REAL
);

-- Telegram Messages
CREATE TABLE IF NOT EXISTS telegram_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_text TEXT NOT NULL,
  sender TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Action Items
CREATE TABLE IF NOT EXISTS action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE
);

-- Enable Row Level Security (permissive for now — dashboard is private)
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role (anon gets read-only)
CREATE POLICY "anon_read_agent_status" ON agent_status FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_rag_documents" ON rag_documents FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_life_log" ON life_log FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_task_runs" ON task_runs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_telegram_messages" ON telegram_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_action_items" ON action_items FOR SELECT TO anon USING (true);

CREATE POLICY "service_all_agent_status" ON agent_status FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_rag_documents" ON rag_documents FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_life_log" ON life_log FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_task_runs" ON task_runs FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_telegram_messages" ON telegram_messages FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_action_items" ON action_items FOR ALL TO service_role USING (true);

-- Indexes
CREATE INDEX idx_agent_status_name ON agent_status(agent_name);
CREATE INDEX idx_life_log_category ON life_log(category);
CREATE INDEX idx_life_log_timestamp ON life_log(timestamp DESC);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_priority ON action_items(priority);
CREATE INDEX idx_task_runs_name ON task_runs(task_name);
CREATE INDEX idx_rag_documents_status ON rag_documents(ingestion_status);
