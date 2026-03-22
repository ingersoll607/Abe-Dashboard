import type { BrainGraph, BrainNode, BrainEdge } from "./graph-types";

const nodes: BrainNode[] = [
  // Center
  { id: "mike", label: "Mike", domain: "center", type: "center", status: "good", urgency: 1, freshness: 1, summary: "Everything Abe knows about Mike — 10 domains, 1,139 docs indexed." },

  // Domain: Health
  { id: "d-health", label: "Health", domain: "health", type: "domain", status: "attention", urgency: 0.7, freshness: 0.7, summary: "Hematocrit elevated. Free T critically low. A1C prediabetic. 8 providers on file.", children: ["health-hematocrit","health-testosterone","health-a1c","health-bp","health-cpap","health-hypothyroid","health-gout","health-provider"] },
  { id: "health-hematocrit", label: "Hematocrit 50.2%", domain: "health", type: "entity", status: "critical", urgency: 0.9, freshness: 0.5, summary: "Flag HIGH. Range 38.5-50.0. Phlebotomy may be needed." },
  { id: "health-testosterone", label: "Free T: 5.1", domain: "health", type: "entity", status: "critical", urgency: 0.9, freshness: 0.5, summary: "Critically low despite TRT. Levothyroxine over-replacement suspected." },
  { id: "health-a1c", label: "A1C 5.7%", domain: "health", type: "entity", status: "attention", urgency: 0.6, freshness: 0.5, summary: "Prediabetic threshold. Trending up." },
  { id: "health-bp", label: "BP 139/86", domain: "health", type: "entity", status: "attention", urgency: 0.6, freshness: 0.4, summary: "Stage 1 Hypertension. Feb 2025." },
  { id: "health-cpap", label: "CPAP Compliance", domain: "health", type: "entity", status: "attention", urgency: 0.5, freshness: 0.6, summary: "4-6 hrs/night. Needs improvement." },
  { id: "health-hypothyroid", label: "Hypothyroidism", domain: "health", type: "entity", status: "good", urgency: 0.3, freshness: 0.6, summary: "Managed. Levothyroxine 200mcg daily." },
  { id: "health-gout", label: "Gout", domain: "health", type: "entity", status: "good", urgency: 0.2, freshness: 0.6, summary: "Managed. Allopurinol 300mg daily." },
  { id: "health-provider", label: "Primary Care NP", domain: "health", type: "entity", status: "neutral", urgency: 0.2, freshness: 0.5, summary: "Primary care provider on file." },

  // Domain: Finance
  { id: "d-finance", label: "Finance", domain: "finance", type: "domain", status: "good", urgency: 0.4, freshness: 0.9, summary: "FICO 836. 36 bills. $4,200/mo. 4% utilization. 2 manual payments.", children: ["fin-fico","fin-usaa-checking","fin-usaa-savings","fin-chase","fin-ozk-loan","fin-hyundai","fin-chase-cc","fin-verizon","fin-cubesmart"] },
  { id: "fin-fico", label: "FICO 836", domain: "finance", type: "entity", status: "good", urgency: 0.1, freshness: 0.9, summary: "Exceptional. Zero late payments. 4% utilization." },
  { id: "fin-usaa-checking", label: "USAA Checking", domain: "finance", type: "entity", status: "good", urgency: 0.2, freshness: 0.8, summary: "Primary banking, auto-pay source." },
  { id: "fin-usaa-savings", label: "USAA Savings", domain: "finance", type: "entity", status: "good", urgency: 0.1, freshness: 0.7, summary: "Emergency fund." },
  { id: "fin-chase", label: "Chase Checking", domain: "finance", type: "entity", status: "good", urgency: 0.2, freshness: 0.8, summary: "Debit 4069. CubeSmart auto-pay." },
  { id: "fin-ozk-loan", label: "OZK RV Loan", domain: "finance", type: "entity", status: "neutral", urgency: 0.4, freshness: 0.7, summary: "RV loan active. Monthly payment." },
  { id: "fin-hyundai", label: "Palisade Loan", domain: "finance", type: "entity", status: "neutral", urgency: 0.4, freshness: 0.7, summary: "Auto loan active. Monthly payment. Partner reimburses." },
  { id: "fin-chase-cc", label: "Chase CC Manual", domain: "finance", type: "entity", status: "attention", urgency: 0.6, freshness: 0.9, summary: "Manual payment ~18th monthly." },
  { id: "fin-verizon", label: "Verizon $245-267", domain: "finance", type: "entity", status: "good", urgency: 0.2, freshness: 0.9, summary: "ACH Chase 8622. Auto." },
  { id: "fin-cubesmart", label: "CubeSmart $181", domain: "finance", type: "entity", status: "good", urgency: 0.2, freshness: 0.9, summary: "Auto-pay Chase 4069." },

  // Domain: Estate Rogers
  { id: "d-estate-rogers", label: "Estate: Rogers", domain: "estate", type: "domain", status: "attention", urgency: 0.8, freshness: 0.7, summary: "ACTIVE probate. Year's Support pending. OPM 7+ months. Hospital negligence.", children: ["er-opm","er-herman","er-years-support","er-whitty","er-mom-accounts","er-mom-loan"] },
  { id: "er-opm", label: "OPM/FERS Benefit", domain: "estate", type: "entity", status: "critical", urgency: 1, freshness: 0.3, summary: "7+ months pending. No response. Congressional inquiry needed." },
  { id: "er-herman", label: "Estate Attorney", domain: "estate", type: "entity", status: "critical", urgency: 0.8, freshness: 0.3, summary: "No follow-up since Feb 6. Hospital negligence." },
  { id: "er-years-support", label: "Year's Support", domain: "estate", type: "entity", status: "attention", urgency: 0.7, freshness: 0.6, summary: "Petition status unknown. Fact reference sent to Gail." },
  { id: "er-whitty", label: "Jake Whitley / Hostel Law", domain: "estate", type: "entity", status: "attention", urgency: 0.7, freshness: 0.5, summary: "Stepdad's hospital negligence case (fell and broke neck). Callback needed." },
  { id: "er-mom-accounts", label: "Cancel Art's Accounts", domain: "estate", type: "entity", status: "attention", urgency: 0.5, freshness: 0.4, summary: "Mom's to-do." },
  { id: "er-mom-loan", label: "Home Loan Transfer", domain: "estate", type: "entity", status: "attention", urgency: 0.5, freshness: 0.4, summary: "Get out of Art's name." },

  // Domain: Estate Ingersoll
  { id: "d-estate-ingersoll", label: "Estate: Ingersoll", domain: "estate", type: "domain", status: "attention", urgency: 0.5, freshness: 0.7, summary: "Court CLOSED. Admin tasks remain. Final taxes due Mar 28.", children: ["ei-taxes","ei-life-ins","ei-chase-dc","ei-excellus"] },
  { id: "ei-taxes", label: "Final Taxes Mar 28", domain: "estate", type: "entity", status: "critical", urgency: 1, freshness: 0.8, summary: "Ernest final taxes due Mar 28. URGENT." },
  { id: "ei-life-ins", label: "Life Insurance Claim", domain: "estate", type: "entity", status: "attention", urgency: 0.6, freshness: 0.4, summary: "Need Kathy's death certificate." },
  { id: "ei-chase-dc", label: "Chase Death Cert", domain: "estate", type: "entity", status: "attention", urgency: 0.4, freshness: 0.4, summary: "Drop off death certificate at Chase." },
  { id: "ei-excellus", label: "Excellus/BCBS", domain: "estate", type: "entity", status: "attention", urgency: 0.4, freshness: 0.4, summary: "Send paperwork." },

  // Domain: Legal / Personal
  { id: "d-legal", label: "Personal & Legal", domain: "legal", type: "domain", status: "critical", urgency: 0.9, freshness: 0.5, summary: "Will & POA MISSING. Divorce pending. MVA settlement unresolved.", children: ["legal-will","legal-divorce","legal-mva","legal-nc-atty"] },
  { id: "legal-will", label: "Will & POA", domain: "legal", type: "entity", status: "critical", urgency: 1, freshness: 0, summary: "NONE ON FILE. Must create ASAP. Attorney offered discount on estate planning." },
  { id: "legal-divorce", label: "Divorce", domain: "legal", type: "entity", status: "attention", urgency: 0.7, freshness: 0.6, summary: "Attorney TBD. Research & consult scheduled 3/24." },
  { id: "legal-mva", label: "MVA Settlement", domain: "legal", type: "entity", status: "attention", urgency: 0.7, freshness: 0.5, summary: "$3K + $8K medical. Rawlings/BCBS subrogation. DO NOT SIGN YET." },
  { id: "legal-nc-atty", label: "Divorce Attorney", domain: "legal", type: "entity", status: "attention", urgency: 0.6, freshness: 0.5, summary: "VA jurisdiction (separation agreement signed in VA). Research scheduled 3/24." },

  // Domain: Property
  { id: "d-property", label: "Property", domain: "property", type: "domain", status: "attention", urgency: 0.6, freshness: 0.6, summary: "Home, RV (7 repairs), Palisade, motorcycle. Storage unit.", children: ["prop-home","prop-rv","prop-palisade","prop-motorcycle","prop-storage","prop-rv-lot"] },
  { id: "prop-home", label: "Home Address", domain: "property", type: "entity", status: "good", urgency: 0.3, freshness: 0.7, summary: "Primary residence. Mortgage active." },
  { id: "prop-rv", label: "RV Paradigm 2022", domain: "property", type: "entity", status: "attention", urgency: 0.7, freshness: 0.5, summary: "7 repairs pending. Rear AC, canopy, dark tank valve, ceiling, awning, bathroom." },
  { id: "prop-palisade", label: "2024 Palisade", domain: "property", type: "entity", status: "attention", urgency: 0.5, freshness: 0.6, summary: "Partner drives. MVA settlement pending." },
  { id: "prop-motorcycle", label: "Motorcycle", domain: "property", type: "entity", status: "attention", urgency: 0.4, freshness: 0.4, summary: "NC registration needed." },
  { id: "prop-storage", label: "CubeSmart F17", domain: "property", type: "entity", status: "attention", urgency: 0.4, freshness: 0.5, summary: "$181/mo. Items need removal." },
  { id: "prop-rv-lot", label: "Treeside Lot 13B", domain: "property", type: "entity", status: "neutral", urgency: 0.2, freshness: 0.5, summary: "RV lot lease. $352-426/mo." },

  // Domain: Infrastructure
  { id: "d-infra", label: "Infrastructure", domain: "infra", type: "domain", status: "good", urgency: 0.2, freshness: 1, summary: "All systems operational. 12 tasks active. Firewall ON. FileVault ON.", children: ["infra-tasks","infra-rag","infra-mcp","infra-firewall","infra-filevault","infra-agents"] },
  { id: "infra-tasks", label: "12 Scheduled Tasks", domain: "infra", type: "entity", status: "good", urgency: 0.2, freshness: 1, summary: "Morning briefing, email sweep, backup, security audit, etc." },
  { id: "infra-rag", label: "RAG Engine", domain: "infra", type: "entity", status: "good", urgency: 0.2, freshness: 0.9, summary: "1,139 docs. 133K chunks. Hybrid search. 99% coverage." },
  { id: "infra-mcp", label: "7 MCP Servers", domain: "infra", type: "entity", status: "good", urgency: 0.1, freshness: 1, summary: "apple-life, local-rag, host-bridge, telegram, claude-bridge, scheduled-tasks, session-info." },
  { id: "infra-firewall", label: "Firewall ON", domain: "infra", type: "entity", status: "good", urgency: 0.1, freshness: 1, summary: "macOS firewall enabled. Stealth mode ON." },
  { id: "infra-filevault", label: "FileVault ON", domain: "infra", type: "entity", status: "good", urgency: 0.1, freshness: 1, summary: "Full disk encryption active." },
  { id: "infra-agents", label: "7 VP Agents", domain: "infra", type: "entity", status: "good", urgency: 0.2, freshness: 1, summary: "Health, Finance, Estate, Life, Ops, Dev, Knowledge. 22 sub-agents." },

  // Domain: Communications
  { id: "d-comms", label: "Communications", domain: "comms", type: "domain", status: "good", urgency: 0.3, freshness: 1, summary: "5 email accounts. Telegram active. Auto-filing every 4hrs.", children: ["comms-icloud","comms-gmail-home","comms-gmail-work","comms-telegram","comms-unread"] },
  { id: "comms-icloud", label: "iCloud Mail", domain: "comms", type: "entity", status: "good", urgency: 0.1, freshness: 1, summary: "****@icloud.com. Primary personal." },
  { id: "comms-gmail-home", label: "Gmail (Home)", domain: "comms", type: "entity", status: "good", urgency: 0.1, freshness: 1, summary: "****@gmail.com." },
  { id: "comms-gmail-work", label: "Gmail (Work)", domain: "comms", type: "entity", status: "good", urgency: 0.1, freshness: 1, summary: "****@work.com. DoD." },
  { id: "comms-telegram", label: "Telegram Bot", domain: "comms", type: "entity", status: "good", urgency: 0.2, freshness: 1, summary: "@Abe_mike_bot. Alerts + briefings." },
  { id: "comms-unread", label: "2 Unread Emails", domain: "comms", type: "entity", status: "attention", urgency: 0.4, freshness: 1, summary: "Check inbox." },
];

const edges: BrainEdge[] = [
  // Center to domains
  { source: "mike", target: "d-health", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-finance", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-estate-rogers", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-estate-ingersoll", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-legal", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-property", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-infra", relationship: "domain", strength: 1 },
  { source: "mike", target: "d-comms", relationship: "domain", strength: 1 },

  // Health parent-child
  { source: "d-health", target: "health-hematocrit", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-testosterone", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-a1c", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-bp", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-cpap", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-hypothyroid", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-gout", relationship: "contains", strength: 0.8 },
  { source: "d-health", target: "health-provider", relationship: "contains", strength: 0.8 },

  // Finance parent-child
  { source: "d-finance", target: "fin-fico", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-usaa-checking", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-usaa-savings", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-chase", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-ozk-loan", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-hyundai", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-chase-cc", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-verizon", relationship: "contains", strength: 0.8 },
  { source: "d-finance", target: "fin-cubesmart", relationship: "contains", strength: 0.8 },

  // Estate Rogers parent-child
  { source: "d-estate-rogers", target: "er-opm", relationship: "contains", strength: 0.8 },
  { source: "d-estate-rogers", target: "er-herman", relationship: "contains", strength: 0.8 },
  { source: "d-estate-rogers", target: "er-years-support", relationship: "contains", strength: 0.8 },
  { source: "d-estate-rogers", target: "er-whitty", relationship: "contains", strength: 0.8 },
  { source: "d-estate-rogers", target: "er-mom-accounts", relationship: "contains", strength: 0.8 },
  { source: "d-estate-rogers", target: "er-mom-loan", relationship: "contains", strength: 0.8 },

  // Estate Ingersoll parent-child
  { source: "d-estate-ingersoll", target: "ei-taxes", relationship: "contains", strength: 0.8 },
  { source: "d-estate-ingersoll", target: "ei-life-ins", relationship: "contains", strength: 0.8 },
  { source: "d-estate-ingersoll", target: "ei-chase-dc", relationship: "contains", strength: 0.8 },
  { source: "d-estate-ingersoll", target: "ei-excellus", relationship: "contains", strength: 0.8 },

  // Legal parent-child
  { source: "d-legal", target: "legal-will", relationship: "contains", strength: 0.8 },
  { source: "d-legal", target: "legal-divorce", relationship: "contains", strength: 0.8 },
  { source: "d-legal", target: "legal-mva", relationship: "contains", strength: 0.8 },
  { source: "d-legal", target: "legal-nc-atty", relationship: "contains", strength: 0.8 },

  // Property parent-child
  { source: "d-property", target: "prop-home", relationship: "contains", strength: 0.8 },
  { source: "d-property", target: "prop-rv", relationship: "contains", strength: 0.8 },
  { source: "d-property", target: "prop-palisade", relationship: "contains", strength: 0.8 },
  { source: "d-property", target: "prop-motorcycle", relationship: "contains", strength: 0.8 },
  { source: "d-property", target: "prop-storage", relationship: "contains", strength: 0.8 },
  { source: "d-property", target: "prop-rv-lot", relationship: "contains", strength: 0.8 },

  // Infra parent-child
  { source: "d-infra", target: "infra-tasks", relationship: "contains", strength: 0.8 },
  { source: "d-infra", target: "infra-rag", relationship: "contains", strength: 0.8 },
  { source: "d-infra", target: "infra-mcp", relationship: "contains", strength: 0.8 },
  { source: "d-infra", target: "infra-firewall", relationship: "contains", strength: 0.8 },
  { source: "d-infra", target: "infra-filevault", relationship: "contains", strength: 0.8 },
  { source: "d-infra", target: "infra-agents", relationship: "contains", strength: 0.8 },

  // Comms parent-child
  { source: "d-comms", target: "comms-icloud", relationship: "contains", strength: 0.8 },
  { source: "d-comms", target: "comms-gmail-home", relationship: "contains", strength: 0.8 },
  { source: "d-comms", target: "comms-gmail-work", relationship: "contains", strength: 0.8 },
  { source: "d-comms", target: "comms-telegram", relationship: "contains", strength: 0.8 },
  { source: "d-comms", target: "comms-unread", relationship: "contains", strength: 0.8 },

  // Cross-domain insight edges
  { source: "fin-hyundai", target: "prop-palisade", relationship: "finances", strength: 0.6 },
  { source: "fin-ozk-loan", target: "prop-rv", relationship: "finances", strength: 0.6 },
  { source: "fin-cubesmart", target: "prop-storage", relationship: "pays_for", strength: 0.5 },
  { source: "legal-mva", target: "health-hematocrit", relationship: "medical_followup", strength: 0.5 },
  { source: "legal-mva", target: "prop-palisade", relationship: "vehicle_in", strength: 0.6 },
  { source: "legal-divorce", target: "legal-nc-atty", relationship: "requires", strength: 0.7 },
  { source: "legal-will", target: "er-opm", relationship: "estate_gap", strength: 0.5 },
  { source: "legal-will", target: "ei-life-ins", relationship: "estate_gap", strength: 0.5 },
  { source: "ei-taxes", target: "fin-fico", relationship: "impacts", strength: 0.4 },
  { source: "health-hypothyroid", target: "health-testosterone", relationship: "drug_interaction", strength: 0.7 },
  { source: "prop-rv", target: "prop-rv-lot", relationship: "located_at", strength: 0.6 },
  { source: "infra-rag", target: "er-opm", relationship: "indexed", strength: 0.3 },
  { source: "er-whitty", target: "er-herman", relationship: "same_firm", strength: 0.7 },
];

// Alerts — critical and high-priority items across all domains
export const ALERTS = [
  { text: "Will & POA — NONE ON FILE", domain: "Legal", priority: "critical" as const, nodeId: "legal-will" },
  { text: "Ernest final taxes due Mar 28", domain: "Estate", priority: "critical" as const, nodeId: "ei-taxes" },
  { text: "Free Testosterone critically low", domain: "Health", priority: "critical" as const, nodeId: "health-testosterone" },
  { text: "Hematocrit elevated (50.2%)", domain: "Health", priority: "critical" as const, nodeId: "health-hematocrit" },
  { text: "OPM/FERS — 7+ months pending", domain: "Estate", priority: "high" as const, nodeId: "er-opm" },
  { text: "Estate attorney — no follow-up", domain: "Estate", priority: "high" as const, nodeId: "er-herman" },
  { text: "Divorce — no attorney retained, research 3/24", domain: "Legal", priority: "high" as const, nodeId: "legal-divorce" },
];

export const MOCK_GRAPH: BrainGraph = {
  nodes,
  edges,
  metadata: {
    lastRefreshed: new Date().toISOString(),
    nodeCount: nodes.length,
    domainCounts: Object.fromEntries(
      [...new Set(nodes.filter(n => n.type === "domain").map(n => n.domain))].map(d => [
        d, nodes.filter(n => n.domain === d).length
      ])
    ),
    criticalCount: nodes.filter(n => n.status === "critical").length,
    attentionCount: nodes.filter(n => n.status === "attention").length,
  },
};
