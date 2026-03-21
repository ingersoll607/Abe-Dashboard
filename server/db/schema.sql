-- ═══════════════════════════════════════════════════════════
-- DIGITAL TWIN — SQLite Schema v1.0
-- "Your life in a database any AI can understand"
-- ═══════════════════════════════════════════════════════════

-- ── META ──
CREATE TABLE IF NOT EXISTS meta_schema (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR REPLACE INTO meta_schema VALUES ('version', '1.0', datetime('now'));
INSERT OR REPLACE INTO meta_schema VALUES ('owner', 'Mike', datetime('now'));
INSERT OR REPLACE INTO meta_schema VALUES ('created', datetime('now'), datetime('now'));

CREATE TABLE IF NOT EXISTS meta_data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- file, api, osascript, mcp, manual
  last_ingested TEXT,
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' -- active, stale, error
);

CREATE TABLE IF NOT EXISTS meta_ingestion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  ingested_at TEXT DEFAULT (datetime('now')),
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  duration_ms INTEGER,
  status TEXT -- success, partial, error
);

-- ── HEALTH: Labs ──
CREATE TABLE IF NOT EXISTS health_labs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_date TEXT,
  test_name TEXT NOT NULL,
  result_value TEXT,
  unit TEXT,
  reference_range TEXT,
  status TEXT CHECK (status IN ('normal','high','low','borderline')),
  panel_group TEXT,
  lab_provider TEXT,
  ordering_provider TEXT,
  source_file TEXT,
  ingested_at TEXT DEFAULT (datetime('now'))
);

-- ── HEALTH: Medications ──
CREATE TABLE IF NOT EXISTS health_medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  prescriber TEXT,
  start_date TEXT,
  end_date TEXT,
  active INTEGER DEFAULT 1,
  purpose TEXT,
  source_file TEXT,
  ingested_at TEXT DEFAULT (datetime('now'))
);

-- ── HEALTH: Vitals ──
CREATE TABLE IF NOT EXISTS health_vitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reading_date TEXT,
  vital_type TEXT NOT NULL, -- bp_systolic, bp_diastolic, heart_rate, weight, spo2, temperature
  value REAL,
  unit TEXT,
  context TEXT, -- resting, active, morning, clinic
  source_file TEXT,
  ingested_at TEXT DEFAULT (datetime('now'))
);

-- ── HEALTH: Conditions ──
CREATE TABLE IF NOT EXISTS health_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  condition_name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, managed, resolved, monitoring
  diagnosed_date TEXT,
  managing_provider TEXT,
  treatment TEXT,
  notes TEXT,
  source_file TEXT,
  ingested_at TEXT DEFAULT (datetime('now'))
);

-- ── HEALTH: Providers ──
CREATE TABLE IF NOT EXISTS health_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_name TEXT NOT NULL,
  specialty TEXT,
  facility TEXT,
  phone TEXT,
  address TEXT,
  last_visit TEXT,
  next_visit TEXT,
  notes TEXT,
  source_file TEXT,
  ingested_at TEXT DEFAULT (datetime('now'))
);

-- ── RECOMMENDATIONS (Trust Ladder) ──
CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL, -- health, finance, estate, legal, property, etc.
  recommendation_text TEXT NOT NULL,
  reasoning TEXT,
  confidence REAL, -- 0.0 to 1.0
  urgency TEXT CHECK (urgency IN ('critical','high','medium','low')),
  suggested_action TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','dismissed','expired','acted')),
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT, -- mike, auto-expired
  outcome_notes TEXT
);

-- ── PATTERNS (Learned Behaviors) ──
CREATE TABLE IF NOT EXISTS patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- health, finance, schedule, relationship, wellness
  pattern_name TEXT NOT NULL,
  description TEXT,
  frequency TEXT, -- daily, weekly, monthly, occasional
  day_of_week TEXT,
  time_of_day TEXT,
  observations INTEGER DEFAULT 1,
  first_observed TEXT,
  last_observed TEXT,
  confidence REAL DEFAULT 0.5, -- grows with observations
  ingested_at TEXT DEFAULT (datetime('now'))
);

-- ── INDEXES ──
CREATE INDEX IF NOT EXISTS idx_labs_date ON health_labs(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_labs_name ON health_labs(test_name);
CREATE INDEX IF NOT EXISTS idx_labs_panel ON health_labs(panel_group);
CREATE INDEX IF NOT EXISTS idx_labs_status ON health_labs(status);
CREATE INDEX IF NOT EXISTS idx_meds_active ON health_medications(active);
CREATE INDEX IF NOT EXISTS idx_vitals_type ON health_vitals(vital_type);
CREATE INDEX IF NOT EXISTS idx_vitals_date ON health_vitals(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_conditions_status ON health_conditions(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_domain ON recommendations(domain);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
