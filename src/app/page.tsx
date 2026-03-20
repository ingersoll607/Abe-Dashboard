import { createAdminClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import type {
  AgentStatus,
  ActionItem,
  LifeLogEntry,
  HealthLab,
  HealthMedication,
  HealthProvider,
  FinanceBill,
} from "@/lib/types";

export const revalidate = 30;

async function getAgentStatus(): Promise<AgentStatus[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agent_status")
    .select("*")
    .order("agent_name");
  if (error) console.error("agent_status error:", error.message);
  return data || [];
}

async function getActionItems(): Promise<ActionItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("action_items")
    .select("*")
    .neq("status", "done")
    .order("created_at", { ascending: false });
  if (error) console.error("action_items error:", error.message);
  return data || [];
}

async function getLifeLog(): Promise<LifeLogEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("life_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);
  if (error) console.error("life_log error:", error.message);
  return data || [];
}

async function getRagStats() {
  const supabase = createAdminClient();
  const { count: totalDocs } = await supabase
    .from("rag_documents")
    .select("*", { count: "exact", head: true });
  const { count: ingestedDocs } = await supabase
    .from("rag_documents")
    .select("*", { count: "exact", head: true })
    .eq("ingestion_status", "ingested");
  return { total: totalDocs || 0, ingested: ingestedDocs || 0 };
}

async function getHealthLabs(): Promise<HealthLab[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("health_labs")
    .select("*")
    .order("test_date", { ascending: false })
    .limit(100);
  if (error && !error.message.includes("does not exist"))
    console.error("health_labs error:", error.message);
  return data || [];
}

async function getHealthMedications(): Promise<HealthMedication[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("health_medications")
    .select("*")
    .order("active", { ascending: false })
    .order("medication_name");
  if (error && !error.message.includes("does not exist"))
    console.error("health_medications error:", error.message);
  return data || [];
}

async function getHealthProviders(): Promise<HealthProvider[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("health_providers")
    .select("*")
    .order("provider_name");
  if (error && !error.message.includes("does not exist"))
    console.error("health_providers error:", error.message);
  return data || [];
}

async function getFinanceBills(): Promise<FinanceBill[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("finance_bills")
    .select("*")
    .order("due_day");
  if (error && !error.message.includes("does not exist"))
    console.error("finance_bills error:", error.message);
  return data || [];
}

export default async function Home() {
  const [
    agents,
    actionItems,
    lifeLog,
    ragStats,
    healthLabs,
    healthMedications,
    healthProviders,
    financeBills,
  ] = await Promise.all([
    getAgentStatus(),
    getActionItems(),
    getLifeLog(),
    getRagStats(),
    getHealthLabs(),
    getHealthMedications(),
    getHealthProviders(),
    getFinanceBills(),
  ]);

  return (
    <Dashboard
      agents={agents}
      actionItems={actionItems}
      lifeLog={lifeLog}
      ragStats={ragStats}
      healthLabs={healthLabs}
      healthMedications={healthMedications}
      healthProviders={healthProviders}
      financeBills={financeBills}
    />
  );
}
