// Open Brain API Client — connects to localhost Express server
// Falls back to null if server isn't running (Vercel deployment uses mock data)

const API_BASE = "http://localhost:3847";
const API_TOKEN = "abe-open-brain-2026";

async function apiFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      signal: AbortSignal.timeout(3000), // 3s timeout
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    // Server not running or network error — return null for mock fallback
    return null;
  }
}

export interface HealthSummary {
  labCount: number;
  flaggedLabCount: number;
  activeMedCount: number;
  activeConditionCount: number;
  providerCount: number;
  vitalCount: number;
  latestLabDate: string | null;
  flaggedLabs: Array<{
    test_name: string;
    result_value: string;
    unit: string;
    status: string;
  }>;
  activeConditions: Array<{
    condition_name: string;
    status: string;
    treatment: string;
    notes: string;
  }>;
  activeMeds: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
  }>;
}

export interface DbStats {
  tables: Record<string, number>;
  totalRecords: number;
  schemaVersion: string;
}

export async function getHealthSummary(): Promise<HealthSummary | null> {
  return apiFetch<HealthSummary>("/api/health");
}

export async function getHealthConditions() {
  return apiFetch<{ conditions: Array<Record<string, unknown>> }>("/api/health/conditions");
}

export async function getFlaggedLabs() {
  return apiFetch<{ flagged: Array<Record<string, unknown>> }>("/api/health/labs/flagged");
}

export async function getDbStats(): Promise<DbStats | null> {
  return apiFetch<DbStats>("/api/stats");
}

export interface FinanceSummary {
  billCount: number;
  totalMonthly: number;
  autoPayCount: number;
  manualCount: number;
  manualBills: Array<{ bill_name: string; amount: number; due_day: number }>;
  fico: number | null;
}

export interface EstateSummary {
  totalItems: number;
  rogersCount: number;
  rogersOpen: number;
  ingersollCount: number;
  ingersollOpen: number;
}

export async function getFinanceSummary(): Promise<FinanceSummary | null> {
  return apiFetch<FinanceSummary>("/api/finance");
}

export async function getEstateSummary(): Promise<EstateSummary | null> {
  return apiFetch<EstateSummary>("/api/estate");
}

export interface NetWorth {
  assets: number;
  debts: number;
  netWorth: number;
}

export interface TaxSummary {
  year: number;
  total: number;
  have: number;
  need: number;
  pending: number;
}

export async function getNetWorth(): Promise<NetWorth | null> {
  return apiFetch<NetWorth>("/api/net-worth");
}

export async function getTaxSummary(): Promise<TaxSummary | null> {
  return apiFetch<TaxSummary>("/api/tax-status");
}

export interface Recommendation {
  id: number;
  domain: string;
  recommendation_text: string;
  reasoning: string | null;
  confidence: number | null;
  urgency: string;
  status: string;
}

export async function getRecommendations(): Promise<{ recommendations: Recommendation[] } | null> {
  return apiFetch<{ recommendations: Recommendation[] }>("/api/recommendations");
}

export async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health-check`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      signal: AbortSignal.timeout(1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
