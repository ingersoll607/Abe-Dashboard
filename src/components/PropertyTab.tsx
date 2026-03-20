"use client";

import { useState } from "react";
import {
  Home,
  Car,
  Wrench,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { VehicleMaintenance } from "@/lib/types";

interface PropertyTabProps {
  maintenance: VehicleMaintenance[];
}

const PROPERTIES = [
  {
    id: "home",
    name: "1603 Bobwhite Ct",
    type: "Home",
    icon: Home,
    color: "#10b981",
    details: {
      location: "Greenville, NC 27858",
      mortgage: "Bank OZK — $751.91/mo",
      balance: "$93,302 remaining (11% paid)",
      term: "20yr, opened Feb 2022",
      utilities: "Greenville Utilities, Eastern Pines Water, Spectrum",
      storage: "CubeSmart Unit F17 — $181/mo",
    },
  },
  {
    id: "rv",
    name: "2022 Alliance Paradigm",
    type: "RV/Camper",
    icon: Car,
    color: "#8b5cf6",
    details: {
      lot: "Lucky Properties LLC — $352-426/mo",
      warranty: "Platinum Ultimate Plus",
      insurance: "Progressive — $61.34/mo + $85.91/mo",
      repairs: "7 pending: rear AC, canopy, dark tank valve, bedroom pop-out ceiling, awning struts, small bathroom ceiling",
    },
  },
  {
    id: "hyundai",
    name: "Hyundai (Mike's vehicle)",
    type: "Vehicle",
    icon: Car,
    color: "#3b82f6",
    details: {
      loan: "Hyundai Motor Finance — $659.38/mo",
      balance: "$10,983 remaining (70% paid)",
      term: "60mo, opened Jul 2022",
      insurance: "USAA Auto — ~$365/mo (combined)",
    },
  },
  {
    id: "palisade",
    name: "2024 Hyundai Palisade",
    type: "Vehicle",
    icon: Car,
    color: "#6366f1",
    details: {
      driver: "Chrissy drives",
      loan: "USAA FSB — $736.99/mo",
      balance: "$38,532 remaining (14% paid)",
      term: "72mo, opened Feb 2025",
      reimbursement: "Chrissy reimburses $1,000/mo via Zelle",
      note: "MVA 1/31/2025 — settlement pending (subrogation issue)",
    },
  },
  {
    id: "motorcycle",
    name: "Motorcycle",
    type: "Vehicle",
    icon: Car,
    color: "#f59e0b",
    details: {
      status: "NC registration needed",
    },
  },
];

function PropertyCard({
  property,
  maintCount,
  onClick,
}: {
  property: (typeof PROPERTIES)[number];
  maintCount: number;
  onClick: () => void;
}) {
  const Icon = property.icon;
  return (
    <div
      onClick={onClick}
      className="bg-[#1e1e2e] rounded-xl p-4 mb-2 border border-[#334155] cursor-pointer hover:brightness-110 transition-all flex justify-between items-center"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${property.color}15` }}
        >
          <Icon size={18} color={property.color} />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[#e2e8f0]">
            {property.name}
          </div>
          <div className="text-[11px] text-[#94a3b8]">{property.type}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {maintCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#f59e0b] font-semibold">
            {maintCount} items
          </span>
        )}
        <ChevronRight size={14} color="#334155" />
      </div>
    </div>
  );
}

function MaintenanceRow({ item }: { item: VehicleMaintenance }) {
  const statusColor =
    item.status === "completed"
      ? "#10b981"
      : item.status === "scheduled"
        ? "#6366f1"
        : "#f59e0b";
  const StatusIcon =
    item.status === "completed"
      ? CheckCircle
      : item.status === "scheduled"
        ? Clock
        : AlertTriangle;
  return (
    <div className="bg-[#1e1e2e] rounded-lg px-3.5 py-2.5 mb-1.5 border border-[#334155] flex justify-between items-center">
      <div className="flex items-center gap-2">
        <StatusIcon size={12} color={statusColor} />
        <div>
          <div className="text-[13px] text-[#e2e8f0]">{item.item}</div>
          {item.notes && (
            <div className="text-[10px] text-[#94a3b8]">{item.notes}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <span
          className="text-[10px] font-semibold capitalize"
          style={{ color: statusColor }}
        >
          {item.status}
        </span>
        {item.cost_estimate && (
          <div className="text-[10px] text-[#64748b]">
            ~${item.cost_estimate}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyTab({ maintenance }: PropertyTabProps) {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  if (selectedProperty) {
    const property = PROPERTIES.find((p) => p.id === selectedProperty);
    if (!property) return null;
    const Icon = property.icon;
    const propertyMaint = maintenance.filter(
      (m) =>
        m.vehicle.toLowerCase().includes(selectedProperty) ||
        m.vehicle.toLowerCase().includes(property.name.toLowerCase())
    );

    return (
      <div className="animate-fadeIn">
        <button
          onClick={() => setSelectedProperty(null)}
          className="bg-transparent border-none text-[#6366f1] text-[13px] cursor-pointer mb-4 p-0 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${property.color}15` }}
          >
            <Icon size={20} color={property.color} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#e2e8f0] m-0">
              {property.name}
            </h3>
            <div className="text-[11px] text-[#94a3b8]">{property.type}</div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#1e1e2e] rounded-xl p-3 mb-4 border border-[#334155]">
          {Object.entries(property.details).map(([key, val]) => (
            <div key={key} className="flex justify-between py-1.5 border-b border-[#1e293b] last:border-0">
              <span className="text-[11px] text-[#64748b] capitalize">
                {key.replace(/_/g, " ")}
              </span>
              <span className="text-[12px] text-[#e2e8f0] text-right max-w-[60%]">
                {val}
              </span>
            </div>
          ))}
        </div>

        {/* Maintenance */}
        {propertyMaint.length > 0 && (
          <>
            <h4 className="text-[12px] text-[#f59e0b] uppercase font-semibold mb-2 flex items-center gap-1">
              <Wrench size={12} /> Maintenance ({propertyMaint.length})
            </h4>
            {propertyMaint.map((item) => (
              <MaintenanceRow key={item.id} item={item} />
            ))}
          </>
        )}
      </div>
    );
  }

  // Summary
  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#10b981]">1</div>
          <div className="text-[9px] text-[#64748b] uppercase">Home</div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#3b82f6]">3</div>
          <div className="text-[9px] text-[#64748b] uppercase">Vehicles</div>
        </div>
        <div className="bg-[#1e1e2e] rounded-xl py-3 px-2.5 text-center border border-[#334155]">
          <div className="text-lg font-bold text-[#f59e0b]">
            {maintenance.filter((m) => m.status === "needed").length || 7}
          </div>
          <div className="text-[9px] text-[#64748b] uppercase">Repairs</div>
        </div>
      </div>

      {PROPERTIES.map((property) => {
        const mCount = maintenance.filter(
          (m) =>
            m.vehicle.toLowerCase().includes(property.id) ||
            m.vehicle.toLowerCase().includes(property.name.toLowerCase())
        ).length;
        return (
          <PropertyCard
            key={property.id}
            property={property}
            maintCount={mCount}
            onClick={() => setSelectedProperty(property.id)}
          />
        );
      })}
    </div>
  );
}
