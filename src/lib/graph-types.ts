// Open Brain — Knowledge Graph Types

export interface BrainNode {
  id: string;
  label: string;
  domain: string; // health, finance, estate, property, personal, legal, infra, comms
  type: "center" | "domain" | "entity" | "sub-entity";
  status: "good" | "attention" | "critical" | "neutral";
  urgency: number; // 0-1, maps to node size
  freshness: number; // 0-1, maps to pulse/opacity (1 = fresh, 0 = stale)
  summary: string; // short description for tooltip/sidebar
  detail?: Record<string, unknown>; // full data for detail panel
  lastUpdated?: string;
  children?: string[]; // IDs of child nodes (for expand/collapse)
  expanded?: boolean;

  // D3 simulation properties (added at runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface BrainEdge {
  source: string; // node ID
  target: string; // node ID
  relationship: string; // e.g. "mortgage", "treats", "filed_by", "insures"
  strength: number; // 0-1, affects edge visibility/thickness
}

export interface BrainGraph {
  nodes: BrainNode[];
  edges: BrainEdge[];
  metadata: {
    lastRefreshed: string;
    nodeCount: number;
    domainCounts: Record<string, number>;
    criticalCount: number;
    attentionCount: number;
  };
}

// Domain color mapping
export const DOMAIN_COLORS: Record<string, string> = {
  health: "#ef4444",
  finance: "#6366f1",
  estate: "#f59e0b",
  property: "#10b981",
  personal: "#ec4899",
  legal: "#8b5cf6",
  infra: "#3b82f6",
  comms: "#14b8a6",
  center: "#ffffff",
};

// Status color mapping
export const STATUS_COLORS: Record<string, string> = {
  good: "#10b981",
  attention: "#f59e0b",
  critical: "#ef4444",
  neutral: "#64748b",
};

// Node size scale (min/max radius)
export const NODE_SIZE = {
  center: 30,
  domain: 20,
  entity: { min: 6, max: 14 }, // scaled by urgency
  "sub-entity": { min: 4, max: 8 },
};
