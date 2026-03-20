export interface AgentStatus {
  id: string;
  agent_name: string;
  status: "healthy" | "warning" | "error";
  last_run: string | null;
  next_run: string | null;
  run_count: number;
  error_count: number;
  updated_at: string;
}

export interface RagDocument {
  id: string;
  file_path: string;
  ingestion_status: "pending" | "ingested" | "failed" | "skipped";
  ingested_at: string | null;
  file_size: number | null;
  priority: number;
  updated_at: string;
}

export interface LifeLogEntry {
  id: string;
  timestamp: string;
  category: string;
  entry: string;
  source: string | null;
  created_at: string;
}

export interface TaskRun {
  id: string;
  task_name: string;
  started_at: string;
  completed_at: string | null;
  status: "success" | "failed" | "skipped";
  notes: string | null;
  usage_at_start: number | null;
}

export interface TelegramMessage {
  id: string;
  direction: "inbound" | "outbound";
  message_text: string;
  sender: string;
  timestamp: string;
  processed: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "done";
  source: string | null;
  created_at: string;
  due_date: string | null;
}
