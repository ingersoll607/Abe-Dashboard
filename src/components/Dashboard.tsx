"use client";

import { useState, useCallback } from "react";
import {
  Heart,
  DollarSign,
  Scale,
  Home,
  Shield,
  Cpu,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Bell,
  BookOpen,
  Wrench,
  Car,
  Hammer,
  CreditCard,
  Stethoscope,
  Bookmark,
  Users,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { AgentStatus, ActionItem, LifeLogEntry } from "@/lib/types";
import {
  getHealthColor,
  getHealthBg,
  getPriorityColor,
  formatDate,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Static fallback data for when Supabase tables are empty
const STATIC_AGENTS: Record<
  string,
  {
    name: string;
    icon: string;
    health: string;
    summary: string;
    alerts: string[];
    metrics: Record<string, number | string>;
    lastRun: string | null;
    subAgents: string[];
    builtAgents: string[];
  }
> = {
  "vp-health": {
    name: "Health & Wellness",
    icon: "Heart",
    health: "warning",
    summary:
      "The Coach is live. Exercise, vitals, medical, nutrition pending data integration.",
    alerts: ["No Apple Health data bridge yet"],
    metrics: { built: 1, total: 5 },
    lastRun: null,
    subAgents: [
      "Exercise Tracker",
      "Vitals Monitor",
      "Medical Records",
      "Nutrition",
      "The Coach",
    ],
    builtAgents: ["The Coach"],
  },
  "vp-finance": {
    name: "Financial Health",
    icon: "DollarSign",
    health: "healthy",
    summary:
      "35 bills tracked. FICO 836. Banking monitored. Credit utilization 4%.",
    alerts: [
      "Chase CC manual payment ~18th",
      "Bank OZK manual payment ~25th",
    ],
    metrics: {
      built: 2,
      total: 4,
      fico: 836,
      monthlyBills: "$4,200",
      utilization: "4%",
    },
    lastRun: "2026-03-15",
    subAgents: [
      "Bills & Payments",
      "Banking Monitor",
      "Credit Monitor",
      "Tax & Compliance",
    ],
    builtAgents: ["Bills & Payments", "Banking Monitor"],
  },
  "vp-estate": {
    name: "Estate Administration",
    icon: "Scale",
    health: "warning",
    summary:
      "Both estates active. Year's Support filing pending. OPM 7+ months no response.",
    alerts: [
      "David Herman — no follow-up since Feb 6",
      "Year's Support petition status",
    ],
    metrics: { built: 3, total: 3, rogersItems: 10, ingersollItems: 9 },
    lastRun: "2026-03-15",
    subAgents: ["Ingersoll Estate", "Rogers Estate", "Document Verifier"],
    builtAgents: ["Ingersoll Estate", "Rogers Estate", "Document Verifier"],
  },
  "vp-life": {
    name: "Personal & Legal",
    icon: "Home",
    health: "error",
    summary:
      "Will & POA needed. Divorce attorney search pending. myclaim360 deadline expired.",
    alerts: [
      "Will & POA — NONE ON FILE",
      "NC divorce attorney needed",
      "myclaim360 expired 3/13 — check status",
    ],
    metrics: { built: 0, total: 4, openReminders: 12, camperRepairs: 7 },
    lastRun: null,
    subAgents: ["Home & Property", "Vehicles", "Legal", "Family"],
    builtAgents: [],
  },
  "vp-ops": {
    name: "Infrastructure",
    icon: "Shield",
    health: "healthy",
    summary:
      "All systems operational. Email auto-filing every 4hrs. Daily backups. Weekly security audit.",
    alerts: [],
    metrics: { built: 4, total: 4, scanInbox: 0, lastBackup: "2026-03-16" },
    lastRun: "2026-03-16",
    subAgents: [
      "Email Manager",
      "File Manager",
      "Security Auditor",
      "Backup & Memory",
    ],
    builtAgents: [
      "Email Manager",
      "File Manager",
      "Security Auditor",
      "Backup & Memory",
    ],
  },
  "vp-dev": {
    name: "Dev Team",
    icon: "Cpu",
    health: "healthy",
    summary:
      "4-agent team built. Project queue loaded. Ready for first assignment.",
    alerts: [],
    metrics: { built: 4, total: 4, projectQueue: 4 },
    lastRun: "2026-03-16",
    subAgents: ["Architect", "Builder", "QA", "DevOps"],
    builtAgents: ["Architect", "Builder", "QA", "DevOps"],
  },
  "vp-knowledge": {
    name: "Knowledge Engine",
    icon: "Brain",
    health: "warning",
    summary:
      "629 files indexed. 38K chunks. Semantic search operational. ~4,284 remaining.",
    alerts: ["140 scanned PDFs need OCR", "~4,284 files still need ingesting"],
    metrics: {
      built: 0,
      total: 0,
      indexed: 629,
      total_files: 4913,
      chunks: 38983,
      searchMode: "hybrid",
    },
    lastRun: "2026-03-19",
    subAgents: [],
    builtAgents: [],
  },
};

const STATIC_ACTIONS = [
  {
    id: "1",
    priority: "high" as const,
    title: "Will & POA — None on file",
    description: null,
    source: "Life",
    status: "open" as const,
    due_date: null,
    created_at: "2026-03-15",
  },
  {
    id: "2",
    priority: "high" as const,
    title: "Call back Jake Whitty, Hostle Law (hospital negligence)",
    description: null,
    source: "Estate",
    status: "open" as const,
    due_date: "2026-03-22",
    created_at: "2026-03-15",
  },
  {
    id: "3",
    priority: "high" as const,
    title: "NC divorce attorney research",
    description: null,
    source: "Life",
    status: "open" as const,
    due_date: "2026-03-21",
    created_at: "2026-03-15",
  },
  {
    id: "4",
    priority: "medium" as const,
    title: "Rawlings/BCBS subrogation — awaiting itemization",
    description: null,
    source: "Life",
    status: "open" as const,
    due_date: "2026-03-24",
    created_at: "2026-03-14",
  },
  {
    id: "5",
    priority: "low" as const,
    title: "VA care transfer to Greenville NC",
    description: null,
    source: "Health",
    status: "open" as const,
    due_date: null,
    created_at: "2026-03-15",
  },
];

const QUICK_STATS = [
  { label: "FICO Score", value: "836", color: "#10b981" },
  { label: "Monthly Bills", value: "$4,200", color: "#6366f1" },
  { label: "Credit Usage", value: "4%", color: "#10b981" },
  { label: "Docs Indexed", value: "629", color: "#8b5cf6" },
];

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Heart,
  DollarSign,
  Scale,
  Home,
  Shield,
  Cpu,
  Brain,
};

const categoryIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  vehicle: Car,
  maintenance: Hammer,
  property: Home,
  household: BookOpen,
  financial: CreditCard,
  health: Stethoscope,
  legal: Scale,
  personal: Bookmark,
  family: Users,
};

const categoryColors: Record<string, string> = {
  vehicle: "#3b82f6",
  maintenance: "#f59e0b",
  property: "#10b981",
  household: "#8b5cf6",
  financial: "#6366f1",
  health: "#ef4444",
  legal: "#ec4899",
  personal: "#64748b",
  family: "#14b8a6",
};

const PROJECT_QUEUE = [
  {
    name: "Abe Command Center",
    status: "active",
    desc: "Live dashboard — this app. Connected to Supabase.",
  },
  {
    name: "OCR Preprocessing Module",
    status: "operational",
    desc: "Tesseract.js LSTM for scanned PDFs. 46 files processed.",
  },
  {
    name: "Scheduled Re-indexer",
    status: "planned",
    desc: "Auto-detect and ingest new/changed files into RAG.",
  },
  {
    name: "Slim Finance Data Layer",
    status: "planned",
    desc: "Lightweight personal finance replacing FMP.",
  },
];

interface DashboardProps {
  agents: AgentStatus[];
  actionItems: ActionItem[];
  lifeLog: LifeLogEntry[];
  ragStats: { total: number; ingested: number };
}

function HealthDot({ health }: { health: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-2"
      style={{
        backgroundColor: getHealthColor(health),
        boxShadow: `0 0 6px ${getHealthColor(health)}40`,
      }}
    />
  );
}

function AgentCard({
  id,
  agent,
  onClick,
}: {
  id: string;
  agent: (typeof STATIC_AGENTS)[string];
  onClick: (id: string) => void;
}) {
  const Icon = iconMap[agent.icon] || Activity;
  const total = Number(agent.metrics.total) || 0;
  const built = Number(agent.metrics.built) || 0;
  const indexed = Number(agent.metrics.indexed) || 0;
  const totalFiles = Number(agent.metrics.total_files) || 0;
  const pct =
    total > 0
      ? Math.round((built / total) * 100)
      : id === "vp-knowledge" && totalFiles > 0
        ? Math.round((indexed / totalFiles) * 100)
        : 100;

  return (
    <div
      onClick={() => onClick(id)}
      className="bg-[#1e1e2e] rounded-xl p-4 cursor-pointer transition-all hover:brightness-110"
      style={{
        border: `1px solid ${getHealthColor(agent.health)}30`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: getHealthBg(agent.health) }}
          >
            <Icon size={18} color={getHealthColor(agent.health)} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#e2e8f0]">
              {agent.name}
            </div>
            <div className="text-[11px] text-[#94a3b8]">{id}</div>
          </div>
        </div>
        <HealthDot health={agent.health} />
      </div>
      <div className="text-xs text-[#94a3b8] leading-relaxed mb-2.5">
        {agent.summary}
      </div>
      {agent.alerts.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-[#f59e0b]">
          <AlertTriangle size={12} />
          <span>
            {agent.alerts.length} alert{agent.alerts.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
      {(total > 0 || (id === "vp-knowledge" && totalFiles > 0)) && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
            <span>
              {id === "vp-knowledge"
                ? `${indexed}/${totalFiles} files`
                : `${built}/${total} sub-agents`}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-[3px] bg-[#334155] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: getHealthColor(agent.health),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AgentDetail({
  id,
  agent,
  onBack,
}: {
  id: string;
  agent: (typeof STATIC_AGENTS)[string];
  onBack: () => void;
}) {
  const Icon = iconMap[agent.icon] || Activity;
  return (
    <div className="animate-fadeIn">
      <button
        onClick={onBack}
        className="bg-transparent border-none text-[#6366f1] text-[13px] cursor-pointer mb-4 p-0 flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: getHealthBg(agent.health) }}
        >
          <Icon size={24} color={getHealthColor(agent.health)} />
        </div>
        <div>
          <h2 className="m-0 text-xl text-[#e2e8f0]">{agent.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <HealthDot health={agent.health} />
            <span className="text-xs text-[#94a3b8] capitalize">
              {agent.health}
            </span>
            {agent.lastRun && (
              <span className="text-[11px] text-[#64748b] ml-2">
                Last: {agent.lastRun}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="bg-[#1e1e2e] rounded-xl p-4 mb-4 border border-[#334155]">
        <div className="text-[13px] text-[#94a3b8] leading-relaxed">
          {agent.summary}
        </div>
      </div>
      {agent.alerts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm text-[#f59e0b] mb-2.5 flex items-center gap-1.5">
            <AlertTriangle size={14} /> Alerts
          </h3>
          {agent.alerts.map((a, i) => (
            <div
              key={i}
              className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg px-3.5 py-2.5 mb-1.5 text-[13px] text-[#fbbf24]"
            >
              {a}
            </div>
          ))}
        </div>
      )}
      {agent.subAgents.length > 0 && (
        <div>
          <h3 className="text-sm text-[#e2e8f0] mb-2.5 flex items-center gap-1.5">
            <Users size={14} /> Sub-Agents
          </h3>
          <div className="grid gap-1.5">
            {agent.subAgents.map((sa, i) => {
              const isBuilt = agent.builtAgents.includes(sa);
              return (
                <div
                  key={i}
                  className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 flex justify-between items-center"
                  style={{
                    border: `1px solid ${isBuilt ? "#334155" : "#1e293b"}`,
                  }}
                >
                  <span
                    className="text-[13px]"
                    style={{ color: isBuilt ? "#e2e8f0" : "#64748b" }}
                  >
                    {sa}
                  </span>
                  {isBuilt ? (
                    <span className="text-[11px] text-[#10b981] flex items-center gap-1">
                      <CheckCircle size={12} /> Built
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#64748b] flex items-center gap-1">
                      <Clock size={12} /> Planned
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  agents,
  actionItems,
  lifeLog,
  ragStats,
}: DashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [logFilter, setLogFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleUpdateAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("manual_triggers")
        .insert({ trigger_type: "run_all", status: "pending" })
        .select()
        .single();

      if (error) {
        console.error("Trigger insert failed:", error.message);
        setRefreshing(false);
        return;
      }

      // Poll for completion (check every 3s, timeout after 60s)
      const triggerId = data.id;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: trigger } = await supabase
          .from("manual_triggers")
          .select("status")
          .eq("id", triggerId)
          .single();

        if (trigger?.status === "done" || attempts >= 20) {
          clearInterval(poll);
          setRefreshing(false);
          window.location.reload();
        }
      }, 3000);
    } catch {
      setRefreshing(false);
    }
  }, []);

  // Use live data if available, fall back to static
  const useStaticAgents = agents.length === 0;
  const agentEntries = useStaticAgents
    ? Object.entries(STATIC_AGENTS)
    : Object.entries(STATIC_AGENTS); // Always use static for now until agents are populated

  const displayActions =
    actionItems.length > 0 ? actionItems : STATIC_ACTIONS;

  const greenCount = agentEntries.filter(
    ([, a]) => a.health === "green" || a.health === "healthy"
  ).length;
  const yellowCount = agentEntries.filter(
    ([, a]) => a.health === "yellow" || a.health === "warning"
  ).length;
  const redCount = agentEntries.filter(
    ([, a]) => a.health === "red" || a.health === "error"
  ).length;

  const stats = [...QUICK_STATS];
  if (ragStats.ingested > 0) {
    const docsIdx = stats.findIndex((s) => s.label === "Docs Indexed");
    if (docsIdx >= 0) stats[docsIdx].value = String(ragStats.ingested);
  }

  // Life log
  const logCategories = [
    "all",
    ...new Set(lifeLog.map((e) => e.category)),
  ];
  const filteredLog =
    logFilter === "all"
      ? lifeLog
      : lifeLog.filter((e) => e.category === logFilter);

  if (selectedAgent && STATIC_AGENTS[selectedAgent]) {
    return (
      <div className="max-w-[600px] mx-auto p-5 font-sans">
        <AgentDetail
          id={selectedAgent}
          agent={STATIC_AGENTS[selectedAgent]}
          onBack={() => setSelectedAgent(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto p-5 font-sans">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.3s ease; }`}</style>

      {/* Header */}
      <div className="text-center mb-6 relative">
        <button
          onClick={handleUpdateAll}
          disabled={refreshing}
          className="absolute right-0 top-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: refreshing ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
            color: "#818cf8",
          }}
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Updating..." : "Update All"}
        </button>
        <div className="text-[11px] tracking-[3px] text-[#6366f1] uppercase mb-1">
          Command Center
        </div>
        <h1 className="m-0 text-3xl font-bold bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
          ABE
        </h1>
        <div className="text-[11px] text-[#64748b] mt-1">
          {greenCount} green · {yellowCount} yellow · {redCount} red
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-5 bg-[#1e1e2e] rounded-xl p-1">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "actions", label: "Actions", icon: Bell },
          { id: "lifelog", label: "Life Log", icon: BookOpen },
          { id: "projects", label: "Dev Queue", icon: Wrench },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-2 border-none rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? "bg-[#6366f1] text-white"
                  : "bg-transparent text-[#64748b]"
              }`}
            >
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="animate-fadeIn">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {stats.map((s, i) => (
              <div
                key={i}
                className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]"
              >
                <div
                  className="text-lg font-bold"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div className="text-[9px] text-[#64748b] mt-0.5 uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Knowledge Engine Stats */}
          <div className="bg-[#1e1e2e] rounded-xl p-4 mb-5 border border-[#334155]">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} color="#8b5cf6" />
              <span className="text-sm font-semibold text-[#e2e8f0]">
                Knowledge Engine
              </span>
              <span className="text-[11px] text-[#10b981] ml-auto">
                LIVE
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xl font-bold text-[#8b5cf6]">629</div>
                <div className="text-[10px] text-[#64748b]">
                  Files Indexed
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#6366f1]">38.9K</div>
                <div className="text-[10px] text-[#64748b]">
                  Search Chunks
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#a78bfa]">
                  Hybrid
                </div>
                <div className="text-[10px] text-[#64748b]">Search Mode</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
                <span>Coverage: 629 of 4,913 files (13%)</span>
                <span>~4,284 remaining</span>
              </div>
              <div className="h-1 bg-[#334155] rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: "13%",
                    background:
                      "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Agent Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {agentEntries.map(([id, agent]) => (
              <AgentCard
                key={id}
                id={id}
                agent={agent}
                onClick={setSelectedAgent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === "actions" && (
        <div className="animate-fadeIn">
          <div className="text-[13px] text-[#94a3b8] mb-4">
            Items requiring your attention, sorted by priority.
          </div>
          {displayActions.map((item) => (
            <div
              key={item.id}
              className="bg-[#1e1e2e] rounded-xl py-3.5 px-4 mb-2 border border-[#334155]"
              style={{
                borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-[13px] text-[#e2e8f0] font-medium leading-snug">
                    {item.title}
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] text-[#6366f1] uppercase tracking-wide">
                      {item.source}
                    </span>
                    <span
                      className="text-[10px] uppercase font-semibold"
                      style={{ color: getPriorityColor(item.priority) }}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>
                {item.due_date && (
                  <span className="text-[11px] text-[#94a3b8] whitespace-nowrap ml-3">
                    {formatDate(item.due_date)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Life Log Tab */}
      {activeTab === "lifelog" && (
        <div className="animate-fadeIn">
          <div className="text-[13px] text-[#94a3b8] mb-3">
            Household knowledge, maintenance, and life facts.
          </div>
          {lifeLog.length > 0 ? (
            <>
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {logCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setLogFilter(c)}
                    className="py-1 px-3 rounded-md border-none cursor-pointer text-[11px] font-semibold capitalize transition-all"
                    style={{
                      background:
                        logFilter === c
                          ? categoryColors[c] || "#6366f1"
                          : "#1e1e2e",
                      color: logFilter === c ? "#fff" : "#94a3b8",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {filteredLog.map((entry) => {
                const CatIcon =
                  categoryIcons[entry.category] || Bookmark;
                const color =
                  categoryColors[entry.category] || "#64748b";
                return (
                  <div
                    key={entry.id}
                    className="bg-[#1e1e2e] rounded-xl py-3.5 px-4 mb-2 border border-[#334155]"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2.5 flex-1">
                        <div
                          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                          style={{ background: `${color}15` }}
                        >
                          <CatIcon size={16} color={color} />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#e2e8f0] leading-snug">
                            {entry.entry}
                          </div>
                          {entry.source && (
                            <div className="text-xs text-[#94a3b8] mt-1">
                              {entry.source}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#64748b] whitespace-nowrap ml-3">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="bg-[rgba(99,102,241,0.08)] border border-dashed border-[rgba(99,102,241,0.3)] rounded-xl p-4 text-center">
              <div className="text-[13px] text-[#818cf8] font-medium">
                No life log entries yet.
              </div>
              <div className="text-xs text-[#64748b] mt-1">
                Tell Abe anything — it gets logged here automatically.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dev Queue Tab */}
      {activeTab === "projects" && (
        <div className="animate-fadeIn">
          <div className="text-[13px] text-[#94a3b8] mb-4">
            Dev Team project pipeline. Workflow: Architect → Builder → QA →
            DevOps
          </div>
          {PROJECT_QUEUE.map((proj, i) => (
            <div
              key={i}
              className="bg-[#1e1e2e] rounded-xl py-3.5 px-4 mb-2 border border-[#334155]"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-semibold text-[#e2e8f0]">
                  {proj.name}
                </span>
                <span
                  className="text-[10px] py-0.5 px-2 rounded font-semibold uppercase"
                  style={{
                    background:
                      proj.status === "active"
                        ? "rgba(16,185,129,0.15)"
                        : proj.status === "operational"
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(100,116,139,0.15)",
                    color:
                      proj.status === "active"
                        ? "#10b981"
                        : proj.status === "operational"
                          ? "#818cf8"
                          : "#94a3b8",
                  }}
                >
                  {proj.status}
                </span>
              </div>
              <div className="text-xs text-[#94a3b8] leading-relaxed">
                {proj.desc}
              </div>
            </div>
          ))}
          <div className="bg-[#1e1e2e] rounded-xl p-4 mt-4 border border-[#334155]">
            <h3 className="m-0 mb-3 text-sm text-[#e2e8f0]">
              Dev Team Workflow
            </h3>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[
                "Mike Describes",
                "Architect Designs",
                "Builder Codes",
                "QA Validates",
                "DevOps Deploys",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] rounded-lg py-2 px-3 text-[11px] text-[#818cf8] font-semibold whitespace-nowrap">
                    {step}
                  </div>
                  {i < 4 && <ChevronRight size={14} color="#334155" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-6 pb-2 border-t border-[#1e293b] mt-6">
        <div className="text-[10px] text-[#475569]">
          Abe v2.0 · CEO/Orchestrator · 7 VPs · 22 sub-agents
        </div>
        <div className="text-[10px] text-[#334155] mt-1">
          The Human Door — Both you and your agents read the same data
        </div>
      </div>
    </div>
  );
}
