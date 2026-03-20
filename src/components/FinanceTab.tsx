"use client";

import { useState } from "react";
import {
  DollarSign,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { FinanceBill } from "@/lib/types";

interface FinanceTabProps {
  bills: FinanceBill[];
}

const STATIC_STATS = {
  fico: 836,
  utilization: "4%",
  monthlyTotal: "$4,200",
};

function BillCard({ bill }: { bill: FinanceBill }) {
  const today = new Date().getDate();
  const isUpcoming =
    bill.due_day !== null &&
    bill.due_day >= today &&
    bill.due_day <= today + 3;
  const isPast = bill.due_day !== null && bill.due_day < today;

  return (
    <div
      className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 mb-1.5 border border-[#334155] flex justify-between items-center"
      style={{
        borderLeft: `3px solid ${isUpcoming ? "#f59e0b" : isPast ? "#10b981" : "#334155"}`,
      }}
    >
      <div className="flex-1">
        <div className="text-[13px] font-medium text-[#e2e8f0]">
          {bill.bill_name}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {bill.category && (
            <span className="text-[10px] text-[#6366f1] uppercase">
              {bill.category}
            </span>
          )}
          {bill.account && (
            <span className="text-[10px] text-[#64748b]">{bill.account}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-semibold text-[#e2e8f0]">
          {bill.amount !== null ? `$${bill.amount.toFixed(2)}` : "—"}
        </div>
        <div className="flex items-center gap-1 justify-end">
          {bill.auto_pay ? (
            <CheckCircle size={10} color="#10b981" />
          ) : (
            <Clock size={10} color="#f59e0b" />
          )}
          <span className="text-[10px] text-[#64748b]">
            {bill.due_day ? `Day ${bill.due_day}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

type FinanceView = "summary" | "bills";

export default function FinanceTab({ bills }: FinanceTabProps) {
  const [view, setView] = useState<FinanceView>("summary");
  const [billFilter, setBillFilter] = useState<string>("all");

  const autoPay = bills.filter((b) => b.auto_pay);
  const manual = bills.filter((b) => !b.auto_pay);
  const totalMonthly = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

  const categories = ["all", ...new Set(bills.map((b) => b.category).filter(Boolean))];
  const filteredBills =
    billFilter === "all"
      ? bills
      : bills.filter((b) => b.category === billFilter);

  // Sort by due day
  const sortedBills = [...filteredBills].sort(
    (a, b) => (a.due_day || 0) - (b.due_day || 0)
  );

  if (bills.length === 0) {
    return (
      <div className="animate-fadeIn">
        {/* Static overview until bills are populated */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
            <div className="text-lg font-bold text-[#10b981]">
              {STATIC_STATS.fico}
            </div>
            <div className="text-[9px] text-[#64748b] uppercase">FICO</div>
          </div>
          <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
            <div className="text-lg font-bold text-[#10b981]">
              {STATIC_STATS.utilization}
            </div>
            <div className="text-[9px] text-[#64748b] uppercase">
              Credit Use
            </div>
          </div>
          <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
            <div className="text-lg font-bold text-[#6366f1]">
              {STATIC_STATS.monthlyTotal}
            </div>
            <div className="text-[9px] text-[#64748b] uppercase">
              Monthly Bills
            </div>
          </div>
        </div>

        <div className="bg-[rgba(99,102,241,0.08)] border border-dashed border-[rgba(99,102,241,0.3)] rounded-xl p-6 text-center">
          <DollarSign size={24} color="#818cf8" className="mx-auto mb-3" />
          <div className="text-[14px] text-[#818cf8] font-medium">
            Finance data loading...
          </div>
          <div className="text-xs text-[#64748b] mt-2">
            Abe is extracting your bill calendar and account data.
          </div>
        </div>
      </div>
    );
  }

  if (view === "bills") {
    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => setView("summary")}
          className="bg-transparent border-none text-[#6366f1] text-[13px] cursor-pointer mb-4 p-0 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3">
          Bill Calendar
        </h3>

        {categories.length > 2 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {categories.map((c) => (
              <button
                key={c || "all"}
                onClick={() => setBillFilter(c || "all")}
                className="py-1 px-3 rounded-md border-none cursor-pointer text-[11px] font-semibold capitalize transition-all"
                style={{
                  background:
                    billFilter === c ? "#6366f1" : "#1e1e2e",
                  color: billFilter === c ? "#fff" : "#94a3b8",
                }}
              >
                {c || "all"}
              </button>
            ))}
          </div>
        )}

        {sortedBills.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </div>
    );
  }

  // Summary view
  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#10b981]">
            {STATIC_STATS.fico}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">FICO</div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#10b981]">
            {STATIC_STATS.utilization}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">Credit Use</div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#6366f1]">
            ${totalMonthly.toLocaleString()}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">
            Monthly Bills
          </div>
        </div>
      </div>

      {/* Manual payments alert */}
      {manual.length > 0 && (
        <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} color="#f59e0b" />
            <span className="text-[13px] font-semibold text-[#fbbf24]">
              {manual.length} Manual Payment{manual.length > 1 ? "s" : ""}
            </span>
          </div>
          {manual.map((bill) => (
            <div
              key={bill.id}
              className="flex justify-between items-center text-[12px] py-1"
            >
              <span className="text-[#e2e8f0]">{bill.bill_name}</span>
              <span className="text-[#f59e0b]">
                {bill.amount ? `$${bill.amount.toFixed(2)}` : "—"} · Day{" "}
                {bill.due_day || "?"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drill-down cards */}
      <div
        onClick={() => setView("bills")}
        className="bg-[#1e1e2e] rounded-xl p-4 mb-2 border border-[#334155] cursor-pointer hover:brightness-110 transition-all flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.1)" }}
          >
            <Calendar size={18} color="#6366f1" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#e2e8f0]">
              Bill Calendar
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              {autoPay.length} auto-pay · {manual.length} manual
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#6366f1]">
            {bills.length}
          </span>
          <CreditCard size={14} color="#334155" />
        </div>
      </div>
    </div>
  );
}
