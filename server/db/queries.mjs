import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.env.HOME, "Documents/Claude/Memory/digital-twin.db");

let db;
function getDb() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

// ── Health Domain Queries ──

export function getLabResults({ limit = 50, panel, status } = {}) {
  const d = getDb();
  let sql = "SELECT * FROM health_labs WHERE 1=1";
  const params = [];
  if (panel) { sql += " AND panel_group = ?"; params.push(panel); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY test_date DESC LIMIT ?";
  params.push(limit);
  return d.prepare(sql).all(...params);
}

export function getLabPanels() {
  const d = getDb();
  return d.prepare("SELECT DISTINCT panel_group, COUNT(*) as count FROM health_labs WHERE panel_group IS NOT NULL GROUP BY panel_group ORDER BY count DESC").all();
}

export function getFlaggedLabs() {
  const d = getDb();
  return d.prepare("SELECT * FROM health_labs WHERE status IN ('high', 'low', 'borderline') ORDER BY test_date DESC").all();
}

export function getLabTrend(testName) {
  const d = getDb();
  return d.prepare("SELECT test_date, result_value, unit, reference_range, status FROM health_labs WHERE test_name LIKE ? ORDER BY test_date ASC").all(`%${testName}%`);
}

export function getMedications({ activeOnly = false } = {}) {
  const d = getDb();
  if (activeOnly) return d.prepare("SELECT * FROM health_medications WHERE active = 1 ORDER BY medication_name").all();
  return d.prepare("SELECT * FROM health_medications ORDER BY active DESC, medication_name").all();
}

export function getVitals({ type, limit = 50 } = {}) {
  const d = getDb();
  if (type) return d.prepare("SELECT * FROM health_vitals WHERE vital_type = ? ORDER BY reading_date DESC LIMIT ?").all(type, limit);
  return d.prepare("SELECT * FROM health_vitals ORDER BY reading_date DESC LIMIT ?").all(limit);
}

export function getConditions() {
  const d = getDb();
  return d.prepare("SELECT * FROM health_conditions ORDER BY CASE status WHEN 'active' THEN 1 WHEN 'monitoring' THEN 2 WHEN 'managed' THEN 3 ELSE 4 END").all();
}

export function getProviders() {
  const d = getDb();
  return d.prepare("SELECT * FROM health_providers ORDER BY provider_name").all();
}

// ── Health Summary (for the twin's "mirror") ──

export function getHealthSummary() {
  const d = getDb();
  return {
    labCount: d.prepare("SELECT COUNT(*) as c FROM health_labs").get().c,
    flaggedLabCount: d.prepare("SELECT COUNT(*) as c FROM health_labs WHERE status IN ('high','low','borderline')").get().c,
    activeMedCount: d.prepare("SELECT COUNT(*) as c FROM health_medications WHERE active = 1").get().c,
    activeConditionCount: d.prepare("SELECT COUNT(*) as c FROM health_conditions WHERE status IN ('active','monitoring')").get().c,
    providerCount: d.prepare("SELECT COUNT(*) as c FROM health_providers").get().c,
    vitalCount: d.prepare("SELECT COUNT(*) as c FROM health_vitals").get().c,
    latestLabDate: d.prepare("SELECT MAX(test_date) as d FROM health_labs").get().d,
    flaggedLabs: d.prepare("SELECT test_name, result_value, unit, status FROM health_labs WHERE status IN ('high','low','borderline') ORDER BY test_date DESC LIMIT 10").all(),
    activeConditions: d.prepare("SELECT condition_name, status, treatment, notes FROM health_conditions WHERE status IN ('active','monitoring')").all(),
    activeMeds: d.prepare("SELECT medication_name, dosage, frequency FROM health_medications WHERE active = 1").all(),
  };
}

// ── Recommendations ──

export function getRecommendations({ status = "pending", domain } = {}) {
  const d = getDb();
  let sql = "SELECT * FROM recommendations WHERE status = ?";
  const params = [status];
  if (domain) { sql += " AND domain = ?"; params.push(domain); }
  sql += " ORDER BY CASE urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END";
  return d.prepare(sql).all(...params);
}

// ── Patterns ──

export function getPatterns({ category } = {}) {
  const d = getDb();
  if (category) return d.prepare("SELECT * FROM patterns WHERE category = ? ORDER BY confidence DESC").all(category);
  return d.prepare("SELECT * FROM patterns ORDER BY confidence DESC").all();
}

// ── Finance Domain Queries ──

export function getBills({ category } = {}) {
  const d = getDb();
  if (category) return d.prepare("SELECT * FROM finance_bills WHERE category = ? ORDER BY due_day").all(category);
  return d.prepare("SELECT * FROM finance_bills ORDER BY due_day").all();
}

export function getFinanceSummary() {
  const d = getDb();
  const bills = d.prepare("SELECT * FROM finance_bills ORDER BY due_day").all();
  const totalMonthly = bills.reduce((s, b) => s + (b.amount || 0), 0);
  const autoPay = bills.filter(b => b.auto_pay);
  const manual = bills.filter(b => !b.auto_pay);
  return {
    billCount: bills.length,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    autoPayCount: autoPay.length,
    manualCount: manual.length,
    manualBills: manual.map(b => ({ bill_name: b.bill_name, amount: b.amount, due_day: b.due_day })),
    categories: [...new Set(bills.map(b => b.category).filter(Boolean))],
  };
}

// ── Estate Domain Queries ──

export function getEstateItems({ estate, status } = {}) {
  const d = getDb();
  let sql = "SELECT * FROM estate_items WHERE 1=1";
  const params = [];
  if (estate) { sql += " AND estate = ?"; params.push(estate); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY CASE status WHEN 'open' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END";
  return d.prepare(sql).all(...params);
}

export function getEstateSummary() {
  const d = getDb();
  const items = d.prepare("SELECT * FROM estate_items").all();
  const rogers = items.filter(i => i.estate === "rogers");
  const ingersoll = items.filter(i => i.estate === "ingersoll");
  return {
    totalItems: items.length,
    rogersCount: rogers.length,
    rogersOpen: rogers.filter(i => i.status === "open").length,
    ingersollCount: ingersoll.length,
    ingersollOpen: ingersoll.filter(i => i.status === "open").length,
    openItems: items.filter(i => i.status === "open"),
  };
}

// ── Meta ──

export function getDataSources() {
  const d = getDb();
  return d.prepare("SELECT * FROM meta_data_sources ORDER BY source_name").all();
}

export function getDbStats() {
  const d = getDb();
  const tables = d.prepare(`
    SELECT 'health_labs' as tbl, count(*) as cnt FROM health_labs
    UNION ALL SELECT 'health_medications', count(*) FROM health_medications
    UNION ALL SELECT 'health_vitals', count(*) FROM health_vitals
    UNION ALL SELECT 'health_conditions', count(*) FROM health_conditions
    UNION ALL SELECT 'health_providers', count(*) FROM health_providers
    UNION ALL SELECT 'finance_bills', count(*) FROM finance_bills
    UNION ALL SELECT 'estate_items', count(*) FROM estate_items
    UNION ALL SELECT 'patterns', count(*) FROM patterns
    UNION ALL SELECT 'recommendations', count(*) FROM recommendations
  `).all();

  return {
    tables: Object.fromEntries(tables.map(t => [t.tbl, t.cnt])),
    totalRecords: tables.reduce((s, t) => s + t.cnt, 0),
    schemaVersion: d.prepare("SELECT value FROM meta_schema WHERE key = 'version'").get()?.value,
  };
}
