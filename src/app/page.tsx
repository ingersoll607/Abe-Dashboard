import { createAdminClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import type { AgentStatus, ActionItem, LifeLogEntry } from "@/lib/types";

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

export default async function Home() {
  const [agents, actionItems, lifeLog, ragStats] = await Promise.all([
    getAgentStatus(),
    getActionItems(),
    getLifeLog(),
    getRagStats(),
  ]);

  return (
    <Dashboard
      agents={agents}
      actionItems={actionItems}
      lifeLog={lifeLog}
      ragStats={ragStats}
    />
  );
}
