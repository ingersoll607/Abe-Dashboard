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

// V2 Deep Drill-Down Types

export interface HealthLab {
  id: string;
  test_date: string | null;
  test_name: string;
  result_value: string | null;
  unit: string | null;
  reference_range: string | null;
  status: "normal" | "high" | "low" | "borderline" | null;
  lab_provider: string | null;
  ordering_provider: string | null;
  panel_group: string | null;
  source_file: string | null;
  created_at: string;
}

export interface HealthMedication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  prescriber: string | null;
  start_date: string | null;
  active: boolean;
  source_file: string | null;
  created_at: string;
}

export interface HealthProvider {
  id: string;
  provider_name: string;
  specialty: string | null;
  facility: string | null;
  phone: string | null;
  last_visit: string | null;
  notes: string | null;
  created_at: string;
}

export interface FinanceBill {
  id: string;
  bill_name: string;
  amount: number | null;
  due_day: number | null;
  category: string | null;
  auto_pay: boolean;
  account: string | null;
  notes: string | null;
  created_at: string;
}

export interface EstateItem {
  id: string;
  estate: "rogers" | "ingersoll";
  item_title: string;
  status: "open" | "pending" | "closed";
  priority: string | null;
  assigned_to: string | null;
  due_date: string | null;
  notes: string | null;
  last_updated: string;
  source_file: string | null;
  created_at: string;
}

export interface VehicleMaintenance {
  id: string;
  vehicle: string;
  item: string;
  status: "needed" | "scheduled" | "completed";
  priority: string | null;
  cost_estimate: number | null;
  notes: string | null;
  due_date: string | null;
  created_at: string;
}
