"use client";

import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Heart,
  DollarSign,
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Lightbulb,
  Brain,
  TrendingUp,
  FileText,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const API_BASE = "http://localhost:3847";
const TOKEN = "abe-open-brain-2026";

async function apiFetch(endpoint: string) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [completeness, setCompleteness] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/brain-data"),
      apiFetch("/api/completeness"),
    ]).then(([brain, comp]) => {
      if (brain) { setData(brain); setIsLive(true); }
      if (comp) setCompleteness(comp);
    });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await apiFetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchResults(results?.results || []);
    setIsSearching(false);
  };

  const health = data?.health as Record<string, unknown> | undefined;
  const finance = data?.finance as Record<string, unknown> | undefined;
  const netWorth = finance?.netWorth as Record<string, unknown> | undefined;
  const taxStatus = finance?.taxStatus as Record<string, unknown> | undefined;
  const estate = data?.estate as Record<string, unknown> | undefined;
  const recommendations = data?.recommendations as Array<Record<string, unknown>> | undefined;
  const relationships = data?.relationships as Array<Record<string, unknown>> | undefined;
  const metadata = data?.metadata as Record<string, unknown> | undefined;
  const score = completeness?.score as number | undefined;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#e2e8f0] font-sans">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] tracking-[3px] text-[#6366f1] uppercase mb-1">
              Digital Twin
            </div>
            <h1 className="text-3xl font-bold">
              {getGreeting()}, <span className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">Mike</span>
            </h1>
            <div className="text-[13px] text-[#64748b] mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {isLive ? (
                <span className="ml-3 text-[#10b981]">● Live from SQLite</span>
              ) : (
                <span className="ml-3 text-[#64748b]">○ Offline — start Express server</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {score !== undefined && (
              <div className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#818cf8] text-[11px] font-semibold">
                Twin: {score}% complete
              </div>
            )}
            <Link href="/timeline" className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#818cf8] text-[11px] font-semibold no-underline flex items-center gap-1">
              <Clock size={12} /> Timeline
            </Link>
            <Link href="/brain" className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#818cf8] text-[11px] font-semibold no-underline flex items-center gap-1">
              <Brain size={12} /> Open Brain
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search everything... (TSP, blood pressure, Crissy, Chase CC...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-[#1e1e2e] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[#6366f1] placeholder-[#475569]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#6366f1] text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1e2e] border border-[#334155] rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
              {searchResults.map((r, i) => (
                <div key={i} className="px-4 py-2.5 border-b border-[#1e293b] last:border-0 hover:bg-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[rgba(99,102,241,0.15)] text-[#818cf8]">{r.domain as string}</span>
                    <span className="text-[12px] text-[#e2e8f0] font-medium">{r.label as string}</span>
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">{r.detail as string}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] text-[#8b5cf6] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
              <Lightbulb size={11} /> Your Twin Recommends
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: (rec.urgency as string) === "high" ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.06)",
                    borderLeft: `3px solid ${(rec.urgency as string) === "high" ? "#8b5cf6" : "#6366f150"}`,
                  }}
                >
                  <div className="text-[12px] text-[#c4b5fd] leading-relaxed">{rec.recommendation_text as string}</div>
                  <div className="text-[9px] text-[#64748b] mt-1 capitalize">{rec.domain as string} · {rec.urgency as string}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Health */}
          <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#334155]">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} color="#ef4444" />
              <span className="text-[11px] text-[#64748b] uppercase">Health</span>
            </div>
            <div className="text-2xl font-bold text-[#ef4444]">{(health?.flaggedLabCount as number) || 0}</div>
            <div className="text-[10px] text-[#64748b]">flagged labs</div>
            <div className="text-[10px] text-[#94a3b8] mt-1">{(health?.activeMedCount as number) || 0} active meds · {(health?.activeConditionCount as number) || 0} conditions</div>
          </div>

          {/* Finance */}
          <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#334155]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} color="#6366f1" />
              <span className="text-[11px] text-[#64748b] uppercase">Net Worth</span>
            </div>
            <div className="text-2xl font-bold text-[#6366f1]">
              ${netWorth ? Math.round((netWorth.netWorth as number) / 1000) : "?"}K
            </div>
            <div className="text-[10px] text-[#64748b]">post-separation</div>
            <div className="text-[10px] text-[#94a3b8] mt-1">${(finance?.totalMonthly as number)?.toLocaleString() || "?"}/mo bills</div>
          </div>

          {/* Tax Prep */}
          <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#334155]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} color="#f59e0b" />
              <span className="text-[11px] text-[#64748b] uppercase">Tax Prep</span>
            </div>
            <div className="text-2xl font-bold text-[#f59e0b]">
              {taxStatus ? `${(taxStatus.have as number)}/${(taxStatus.total as number)}` : "?"}
            </div>
            <div className="text-[10px] text-[#64748b]">docs collected</div>
            <div className="text-[10px] text-[#94a3b8] mt-1">{(taxStatus?.need as number) || 0} still needed</div>
          </div>

          {/* Family */}
          <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#334155]">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} color="#10b981" />
              <span className="text-[11px] text-[#64748b] uppercase">Family</span>
            </div>
            <div className="text-2xl font-bold text-[#10b981]">{relationships?.length || 0}</div>
            <div className="text-[10px] text-[#64748b]">people mapped</div>
            <div className="text-[10px] text-[#94a3b8] mt-1">{metadata?.totalRecords as number || 0} total records</div>
          </div>
        </div>

        {/* Health Alerts */}
        {health && (health.flaggedLabs as Array<Record<string, string>>)?.length > 0 && (
          <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} color="#ef4444" />
              <span className="text-[12px] text-[#fca5a5] font-semibold">Health Alerts — Flagged Lab Values</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(health.flaggedLabs as Array<Record<string, string>>).map((lab, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-[rgba(0,0,0,0.2)] rounded-lg">
                  <span className="text-[12px] text-[#e2e8f0]">{lab.test_name}</span>
                  <span className="text-[12px] font-semibold" style={{ color: lab.status === "high" ? "#ef4444" : lab.status === "low" ? "#3b82f6" : "#f59e0b" }}>
                    {lab.result_value} {lab.unit} [{lab.status}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Conditions */}
        {health && (health.activeConditions as Array<Record<string, string>>)?.length > 0 && (
          <div className="bg-[#1e1e2e] rounded-xl p-4 mb-6 border border-[#334155]">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wider mb-3">Active Conditions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(health.activeConditions as Array<Record<string, string>>).map((c, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-[rgba(0,0,0,0.15)]">
                  <div>
                    <div className="text-[12px] text-[#e2e8f0] font-medium">{c.condition_name}</div>
                    {c.treatment && <div className="text-[10px] text-[#94a3b8]">{c.treatment}</div>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded capitalize" style={{
                    background: c.status === "active" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: c.status === "active" ? "#fca5a5" : "#fbbf24",
                  }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Data */}
        {completeness && (completeness.missing as string[])?.length > 0 && (
          <div className="bg-[#1e1e2e] rounded-xl p-4 mb-6 border border-[#334155]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] text-[#64748b] uppercase tracking-wider">Data Gaps — Help Your Twin Know You Better</div>
              <span className="text-[11px] text-[#6366f1] font-semibold">{score}% complete</span>
            </div>
            <div className="w-full h-2 bg-[#334155] rounded-full mb-3 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" style={{ width: `${score}%` }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {(completeness.missing as string[]).map((item, i) => (
                <div key={i} className="text-[11px] text-[#94a3b8] flex items-center gap-1.5 py-1">
                  <Clock size={10} color="#64748b" /> {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estate Summary */}
        {estate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#334155]">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={14} color="#f59e0b" />
                <span className="text-[12px] font-semibold text-[#e2e8f0]">Rogers Estate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#fbbf24]">ACTIVE</span>
              </div>
              <div className="text-[11px] text-[#94a3b8]">{(estate.rogersCount as number) || 0} items · {(estate.rogersOpen as number) || 0} open</div>
            </div>
            <div className="bg-[#1e1e2e] rounded-xl p-4 border border-[#334155]">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={14} color="#10b981" />
                <span className="text-[12px] font-semibold text-[#e2e8f0]">Ingersoll Estate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10b981]">CLOSED</span>
              </div>
              <div className="text-[11px] text-[#94a3b8]">{(estate.ingersollCount as number) || 0} items · Admin tasks remain</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#1e293b]">
          <div className="text-[10px] text-[#475569]">
            Abe Digital Twin · {metadata?.totalRecords as number || 0} records · {metadata?.tableCount as number || 0} tables · Schema v{metadata?.schemaVersion as string || "1.0"}
          </div>
          <div className="text-[10px] text-[#334155] mt-1">
            "Other AI acts for you. Your twin thinks for you. You still decide."
          </div>
        </div>
      </div>
    </div>
  );
}
