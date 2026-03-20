"use client";

import { useState } from "react";
import {
  Scale,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Users,
  FileText,
} from "lucide-react";
import type { EstateItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface EstateTabProps {
  estateItems: EstateItem[];
}

const ESTATES = {
  ingersoll: {
    name: "Ernest Ingersoll (Dad)",
    status: "closed",
    caseNo: "192025CP000023CPAXMX",
    court: "Palm Beach County, FL",
    attorney: "Nicole Loughlin, Loughlin Law P.A.",
    attorneyPhone: "561-921-5751 ext 201",
    summary: "FL Summary Administration complete. Court orders signed Nov 5, 2025. Matter closed Feb 18, 2026.",
    color: "#10b981",
  },
  rogers: {
    name: "Harold Arthur Rogers (Step-Father)",
    status: "active",
    caseNo: "2025-ES-567",
    court: "Houston County, GA",
    attorney: "Gail C. Robinson",
    attorneyPhone: "(478)929-9702",
    summary: "Active probate. Year's Support filing pending. OPM 7+ months no response. Hospital negligence case with Hostle Law.",
    color: "#f59e0b",
  },
};

function EstateCard({
  id,
  estate,
  itemCount,
  openCount,
  onClick,
}: {
  id: string;
  estate: (typeof ESTATES)[keyof typeof ESTATES];
  itemCount: number;
  openCount: number;
  onClick: () => void;
}) {
  const isActive = estate.status === "active";
  return (
    <div
      onClick={onClick}
      className="bg-[#1e1e2e] rounded-xl p-4 mb-2 border cursor-pointer hover:brightness-110 transition-all"
      style={{ border: `1px solid ${estate.color}30` }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${estate.color}15` }}
          >
            <Scale size={18} color={estate.color} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#e2e8f0]">
              {estate.name}
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              Case: {estate.caseNo}
            </div>
          </div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase"
          style={{
            background: isActive
              ? "rgba(245,158,11,0.15)"
              : "rgba(16,185,129,0.15)",
            color: isActive ? "#f59e0b" : "#10b981",
          }}
        >
          {estate.status}
        </span>
      </div>
      <div className="text-xs text-[#94a3b8] leading-relaxed mb-2">
        {estate.summary}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-[11px] text-[#64748b]">
          {itemCount} items · {openCount} open
        </div>
        <ChevronRight size={14} color="#334155" />
      </div>
    </div>
  );
}

function CreditorRow({ item }: { item: EstateItem }) {
  const statusColor =
    item.status === "closed"
      ? "#10b981"
      : item.status === "pending"
        ? "#f59e0b"
        : "#ef4444";
  return (
    <div
      className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 mb-1.5 border border-[#334155]"
      style={{ borderLeft: `3px solid ${statusColor}` }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-[13px] font-medium text-[#e2e8f0]">
            {item.item_title.replace("Creditor: ", "")}
          </div>
          {item.notes && (
            <div className="text-[11px] text-[#94a3b8] mt-0.5 leading-relaxed">
              {item.notes}
            </div>
          )}
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase ml-2"
          style={{
            background: `${statusColor}15`,
            color: statusColor,
          }}
        >
          {item.status}
        </span>
      </div>
      {item.due_date && (
        <div className="text-[10px] text-[#64748b] mt-1">
          Due: {formatDate(item.due_date)}
        </div>
      )}
    </div>
  );
}

type EstateView = "summary" | "ingersoll" | "rogers";

export default function EstateTab({ estateItems }: EstateTabProps) {
  const [view, setView] = useState<EstateView>("summary");

  const rogersItems = estateItems.filter((i) => i.estate === "rogers");
  const ingersollItems = estateItems.filter((i) => i.estate === "ingersoll");
  const rogersOpen = rogersItems.filter((i) => i.status === "open").length;
  const ingersollOpen = ingersollItems.filter((i) => i.status === "open").length;

  if (view !== "summary") {
    const estate = ESTATES[view];
    const items = view === "rogers" ? rogersItems : ingersollItems;
    const openItems = items.filter((i) => i.status === "open");
    const pendingItems = items.filter((i) => i.status === "pending");
    const closedItems = items.filter((i) => i.status === "closed");

    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => setView("summary")}
          className="bg-transparent border-none text-[#6366f1] text-[13px] cursor-pointer mb-4 p-0 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${estate.color}15` }}
          >
            <Scale size={20} color={estate.color} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#e2e8f0] m-0">
              {estate.name}
            </h3>
            <div className="text-[11px] text-[#94a3b8]">
              {estate.court} · Case {estate.caseNo}
            </div>
          </div>
        </div>

        {/* Attorney */}
        <div className="bg-[#1e1e2e] rounded-xl p-3 mb-4 border border-[#334155]">
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} color="#6366f1" />
            <span className="text-[11px] text-[#6366f1] uppercase font-semibold">
              Attorney
            </span>
          </div>
          <div className="text-[13px] text-[#e2e8f0]">{estate.attorney}</div>
          <div className="text-[11px] text-[#94a3b8]">
            {estate.attorneyPhone}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-[#1e1e2e] rounded-xl p-3 mb-4 border border-[#334155]">
          <div className="text-[13px] text-[#94a3b8] leading-relaxed">
            {estate.summary}
          </div>
        </div>

        {/* Items */}
        {items.length > 0 ? (
          <>
            {openItems.length > 0 && (
              <>
                <h4 className="text-[12px] text-[#ef4444] uppercase font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Open ({openItems.length})
                </h4>
                {openItems.map((item) => (
                  <CreditorRow key={item.id} item={item} />
                ))}
              </>
            )}
            {pendingItems.length > 0 && (
              <>
                <h4 className="text-[12px] text-[#f59e0b] uppercase font-semibold mb-2 mt-3 flex items-center gap-1">
                  <Clock size={12} /> Pending ({pendingItems.length})
                </h4>
                {pendingItems.map((item) => (
                  <CreditorRow key={item.id} item={item} />
                ))}
              </>
            )}
            {closedItems.length > 0 && (
              <>
                <h4 className="text-[12px] text-[#10b981] uppercase font-semibold mb-2 mt-3 flex items-center gap-1">
                  <CheckCircle size={12} /> Closed ({closedItems.length})
                </h4>
                {closedItems.map((item) => (
                  <CreditorRow key={item.id} item={item} />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="bg-[rgba(99,102,241,0.08)] border border-dashed border-[rgba(99,102,241,0.3)] rounded-xl p-4 text-center">
            <div className="text-[13px] text-[#818cf8]">
              {estate.status === "closed"
                ? "Estate closed. No active items."
                : "No items tracked yet."}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Summary view
  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#f59e0b]">1</div>
          <div className="text-[9px] text-[#64748b] uppercase">Active</div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#10b981]">1</div>
          <div className="text-[9px] text-[#64748b] uppercase">Closed</div>
        </div>
      </div>

      <EstateCard
        id="rogers"
        estate={ESTATES.rogers}
        itemCount={rogersItems.length}
        openCount={rogersOpen}
        onClick={() => setView("rogers")}
      />
      <EstateCard
        id="ingersoll"
        estate={ESTATES.ingersoll}
        itemCount={ingersollItems.length}
        openCount={ingersollOpen}
        onClick={() => setView("ingersoll")}
      />
    </div>
  );
}
