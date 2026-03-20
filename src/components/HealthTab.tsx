"use client";

import { useState } from "react";
import {
  Stethoscope,
  Pill,
  Activity,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { HealthLab, HealthMedication, HealthProvider } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface HealthTabProps {
  labs: HealthLab[];
  medications: HealthMedication[];
  providers: HealthProvider[];
}

function getStatusColor(status: string | null): string {
  if (status === "normal") return "#10b981";
  if (status === "high") return "#ef4444";
  if (status === "low") return "#3b82f6";
  if (status === "borderline") return "#f59e0b";
  return "#64748b";
}

function StatusIcon({ status }: { status: string | null }) {
  if (status === "high") return <TrendingUp size={12} color="#ef4444" />;
  if (status === "low") return <TrendingDown size={12} color="#3b82f6" />;
  if (status === "borderline") return <AlertTriangle size={12} color="#f59e0b" />;
  return <Minus size={12} color="#10b981" />;
}

function LabCard({ lab }: { lab: HealthLab }) {
  return (
    <div
      className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 mb-1.5 border border-[#334155] flex justify-between items-center"
      style={{ borderLeft: `3px solid ${getStatusColor(lab.status)}` }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <StatusIcon status={lab.status} />
          <span className="text-[13px] font-medium text-[#e2e8f0]">
            {lab.test_name}
          </span>
        </div>
        <div className="text-[11px] text-[#94a3b8] mt-0.5">
          {lab.result_value}
          {lab.unit ? ` ${lab.unit}` : ""}
          {lab.reference_range ? ` (ref: ${lab.reference_range})` : ""}
        </div>
      </div>
      <div className="text-right">
        <div
          className="text-[11px] font-semibold capitalize"
          style={{ color: getStatusColor(lab.status) }}
        >
          {lab.status || "—"}
        </div>
        {lab.test_date && (
          <div className="text-[10px] text-[#64748b]">
            {formatDate(lab.test_date)}
          </div>
        )}
      </div>
    </div>
  );
}

function MedCard({ med }: { med: HealthMedication }) {
  return (
    <div className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 mb-1.5 border border-[#334155] flex justify-between items-center">
      <div>
        <div className="text-[13px] font-medium text-[#e2e8f0]">
          {med.medication_name}
        </div>
        <div className="text-[11px] text-[#94a3b8]">
          {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
        </div>
        {med.prescriber && (
          <div className="text-[10px] text-[#64748b] mt-0.5">
            Rx: {med.prescriber}
          </div>
        )}
      </div>
      <span
        className="text-[10px] px-2 py-0.5 rounded font-semibold"
        style={{
          background: med.active
            ? "rgba(16,185,129,0.15)"
            : "rgba(100,116,139,0.15)",
          color: med.active ? "#10b981" : "#94a3b8",
        }}
      >
        {med.active ? "Active" : "Discontinued"}
      </span>
    </div>
  );
}

function ProviderCard({ provider }: { provider: HealthProvider }) {
  return (
    <div className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 mb-1.5 border border-[#334155]">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[13px] font-medium text-[#e2e8f0]">
            {provider.provider_name}
          </div>
          {provider.specialty && (
            <div className="text-[11px] text-[#6366f1]">
              {provider.specialty}
            </div>
          )}
          {provider.facility && (
            <div className="text-[11px] text-[#94a3b8]">
              {provider.facility}
            </div>
          )}
        </div>
        {provider.last_visit && (
          <div className="text-[10px] text-[#64748b]">
            Last: {formatDate(provider.last_visit)}
          </div>
        )}
      </div>
      {provider.phone && (
        <div className="text-[10px] text-[#64748b] mt-1">{provider.phone}</div>
      )}
    </div>
  );
}

type HealthView = "summary" | "labs" | "medications" | "providers";

export default function HealthTab({
  labs,
  medications,
  providers,
}: HealthTabProps) {
  const [view, setView] = useState<HealthView>("summary");
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);

  const activeMeds = medications.filter((m) => m.active);
  const flaggedLabs = labs.filter(
    (l) => l.status === "high" || l.status === "low" || l.status === "borderline"
  );
  const latestLabDate = labs.length > 0 ? labs[0].test_date : null;

  // Group labs by panel
  const panelGroups = labs.reduce(
    (acc, lab) => {
      const group = lab.panel_group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(lab);
      return acc;
    },
    {} as Record<string, HealthLab[]>
  );

  // Filter labs by selected panel
  const displayLabs = selectedPanel
    ? labs.filter((l) => (l.panel_group || "Other") === selectedPanel)
    : labs;

  if (labs.length === 0 && medications.length === 0 && providers.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-[rgba(99,102,241,0.08)] border border-dashed border-[rgba(99,102,241,0.3)] rounded-xl p-6 text-center">
          <Stethoscope size={24} color="#818cf8" className="mx-auto mb-3" />
          <div className="text-[14px] text-[#818cf8] font-medium">
            Health data loading...
          </div>
          <div className="text-xs text-[#64748b] mt-2">
            Abe is parsing your medical records and lab results.
            <br />
            Data will appear here once populated.
          </div>
        </div>
      </div>
    );
  }

  if (view !== "summary") {
    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => {
            setView("summary");
            setSelectedPanel(null);
          }}
          className="bg-transparent border-none text-[#6366f1] text-[13px] cursor-pointer mb-4 p-0 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {view === "labs" && (
          <>
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">
              Lab Results
              {selectedPanel && (
                <span className="text-[#6366f1] ml-2">— {selectedPanel}</span>
              )}
            </h3>
            {!selectedPanel && Object.keys(panelGroups).length > 1 && (
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {Object.keys(panelGroups).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setSelectedPanel(panel)}
                    className="py-1 px-3 rounded-md border-none cursor-pointer text-[11px] font-semibold bg-[#1e1e2e] text-[#94a3b8] hover:text-[#e2e8f0] transition-all"
                  >
                    {panel} ({panelGroups[panel].length})
                  </button>
                ))}
              </div>
            )}
            {displayLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </>
        )}

        {view === "medications" && (
          <>
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">
              Medications
            </h3>
            {medications.map((med) => (
              <MedCard key={med.id} med={med} />
            ))}
          </>
        )}

        {view === "providers" && (
          <>
            <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">
              Healthcare Providers
            </h3>
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </>
        )}
      </div>
    );
  }

  // Summary view
  return (
    <div className="animate-fadeIn">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#ef4444]">
            {flaggedLabs.length}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">
            Flagged Labs
          </div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#10b981]">
            {activeMeds.length}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">
            Active Meds
          </div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#6366f1]">
            {providers.length}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">Providers</div>
        </div>
      </div>

      {/* Flagged labs alert */}
      {flaggedLabs.length > 0 && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} color="#ef4444" />
            <span className="text-[13px] font-semibold text-[#fca5a5]">
              Flagged Results
            </span>
          </div>
          {flaggedLabs.slice(0, 5).map((lab) => (
            <div
              key={lab.id}
              className="flex justify-between items-center text-[12px] py-1"
            >
              <span className="text-[#e2e8f0]">{lab.test_name}</span>
              <span style={{ color: getStatusColor(lab.status) }}>
                {lab.result_value} {lab.unit} ({lab.status})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drill-down cards */}
      {[
        {
          id: "labs" as HealthView,
          icon: Activity,
          label: "Lab Results",
          count: labs.length,
          sub: latestLabDate ? `Latest: ${formatDate(latestLabDate)}` : "No labs yet",
          color: "#8b5cf6",
        },
        {
          id: "medications" as HealthView,
          icon: Pill,
          label: "Medications",
          count: medications.length,
          sub: `${activeMeds.length} active`,
          color: "#10b981",
        },
        {
          id: "providers" as HealthView,
          icon: Stethoscope,
          label: "Providers",
          count: providers.length,
          sub: `${providers.length} on file`,
          color: "#6366f1",
        },
      ].map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => setView(card.id)}
            className="bg-[#1e1e2e] rounded-xl p-4 mb-2 border border-[#334155] cursor-pointer hover:brightness-110 transition-all flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}15` }}
              >
                <Icon size={18} color={card.color} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#e2e8f0]">
                  {card.label}
                </div>
                <div className="text-[11px] text-[#94a3b8]">{card.sub}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: card.color }}>
                {card.count}
              </span>
              <ChevronRight size={14} color="#334155" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
