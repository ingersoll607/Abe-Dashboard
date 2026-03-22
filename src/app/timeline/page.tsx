"use client";

import { useState, useEffect } from "react";
import { Clock, Heart, DollarSign, Scale, Shield, Users, Brain, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

const API_BASE = "http://localhost:3847";
const TOKEN = "abe-open-brain-2026";

const DOMAIN_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  health: Heart,
  finance: DollarSign,
  estate: Scale,
  legal: FileText,
  personal: Users,
  infra: Shield,
};

const DOMAIN_COLORS: Record<string, string> = {
  health: "#ef4444",
  finance: "#6366f1",
  estate: "#f59e0b",
  legal: "#8b5cf6",
  personal: "#10b981",
  infra: "#3b82f6",
};

interface ActivityEvent {
  id: number;
  timestamp: string;
  domain: string;
  action: string;
  detail: string;
  source: string;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/timeline?limit=100`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setIsLive(true); })
      .catch(() => setIsLive(false));
  }, []);

  const domains = ["all", ...new Set(events.map(e => e.domain).filter(Boolean))];
  const filtered = filter === "all" ? events : events.filter(e => e.domain === filter);

  // Group by date
  const grouped: Record<string, ActivityEvent[]> = {};
  filtered.forEach(e => {
    const date = new Date(e.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(e);
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#e2e8f0] font-sans">
      <div className="max-w-3xl mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] tracking-[3px] text-[#6366f1] uppercase mb-1">Digital Twin</div>
            <h1 className="text-2xl font-bold text-[#e2e8f0]">Timeline</h1>
            <div className="text-[12px] text-[#64748b] mt-1">
              Everything that happened, in order.
              {isLive ? <span className="ml-2 text-[#10b981]">● Live</span> : <span className="ml-2 text-[#64748b]">○ Offline</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#818cf8] text-[11px] font-semibold no-underline">Dashboard</Link>
            <Link href="/brain" className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#818cf8] text-[11px] font-semibold no-underline flex items-center gap-1">
              <Brain size={12} /> Brain
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className="py-1 px-3 rounded-md border-none cursor-pointer text-[11px] font-semibold capitalize transition-all"
              style={{
                background: filter === d ? (DOMAIN_COLORS[d] || "#6366f1") : "#1e1e2e",
                color: filter === d ? "#fff" : "#94a3b8",
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <div key={date} className="mb-6">
            <div className="text-[11px] text-[#64748b] uppercase tracking-wider mb-3 sticky top-0 bg-[#0a0e1a] py-1 z-10">
              {date}
            </div>
            <div className="border-l border-[#1e293b] ml-3 pl-6 space-y-3">
              {dayEvents.map(event => {
                const Icon = DOMAIN_ICONS[event.domain] || Clock;
                const color = DOMAIN_COLORS[event.domain] || "#64748b";
                return (
                  <div key={event.id} className="relative">
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-[29px] w-3 h-3 rounded-full border-2 border-[#0a0e1a]"
                      style={{ background: color }}
                    />
                    <div className="bg-[#1e1e2e] rounded-lg p-3 border border-[#334155]">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={12} color={color} />
                        <span className="text-[12px] font-semibold text-[#e2e8f0]">{event.action}</span>
                        <span className="text-[9px] text-[#475569] ml-auto">
                          {new Date(event.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#94a3b8] leading-relaxed">{event.detail}</div>
                      <div className="text-[9px] text-[#334155] mt-1 capitalize">via {event.source}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-12 text-[#64748b]">
            {isLive ? "No activity yet." : "Start the Express server to see your timeline."}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#1e293b] mt-6">
          <div className="text-[10px] text-[#334155]">
            A changelog for your life data
          </div>
        </div>
      </div>
    </div>
  );
}
