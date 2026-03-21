import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(process.env.HOME, "Documents/Claude/Memory/digital-twin.db");
const HEALTH_DIR = path.join(process.env.HOME, "Documents/Claude/Memory/health_extracted");
const MEMORY_DIR = path.join(process.env.HOME, "Documents/Claude/Memory");

console.log("═══ Digital Twin — SQLite Migration ═══");
console.log(`Database: ${DB_PATH}`);

// Create/open database
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run schema
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);
console.log("✓ Schema applied\n");

// ── HEALTH LABS ──
const ambulatory = JSON.parse(fs.readFileSync(path.join(HEALTH_DIR, "ambulatory_extract.json"), "utf-8"));
const labs = ambulatory.labs || [];

const insertLab = db.prepare(`
  INSERT INTO health_labs (test_date, test_name, result_value, unit, reference_range, status, panel_group, lab_provider, ordering_provider, source_file)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let labCount = 0;
const insertLabs = db.transaction(() => {
  for (const lab of labs) {
    insertLab.run(
      lab.test_date || null,
      lab.test_name,
      lab.result_value || null,
      lab.unit || null,
      lab.reference_range || null,
      lab.status || null,
      lab.panel_group || null,
      lab.lab_provider || null,
      lab.ordering_provider || null,
      lab.source_file || "AmbulatorySummary_alltime.xml"
    );
    labCount++;
  }
});
insertLabs();
console.log(`✓ health_labs: ${labCount} rows`);

// ── HEALTH MEDICATIONS ──
const meds = ambulatory.medications || [];

const insertMed = db.prepare(`
  INSERT INTO health_medications (medication_name, dosage, frequency, prescriber, start_date, active, source_file)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let medCount = 0;
const insertMeds = db.transaction(() => {
  for (const med of meds) {
    insertMed.run(
      med.medication_name || med.name,
      med.dosage || null,
      med.frequency || null,
      med.prescriber || null,
      med.start_date || null,
      med.active !== undefined ? (med.active ? 1 : 0) : 1,
      med.source_file || "AmbulatorySummary_alltime.xml"
    );
    medCount++;
  }
});
insertMeds();
console.log(`✓ health_medications: ${medCount} rows`);

// ── HEALTH VITALS ──
const vitals = ambulatory.vitals || [];

const insertVital = db.prepare(`
  INSERT INTO health_vitals (reading_date, vital_type, value, unit, source_file)
  VALUES (?, ?, ?, ?, ?)
`);

let vitalCount = 0;
const insertVitals = db.transaction(() => {
  for (const v of vitals) {
    insertVital.run(
      v.date || v.reading_date || null,
      v.type || v.vital_type || v.name || "unknown",
      v.value ? parseFloat(v.value) : null,
      v.unit || null,
      v.source_file || "AmbulatorySummary_alltime.xml"
    );
    vitalCount++;
  }
});
insertVitals();
console.log(`✓ health_vitals: ${vitalCount} rows`);

// ── HEALTH CONDITIONS (from Mike's known conditions) ──
const conditions = [
  { condition_name: "Hypothyroidism", status: "managed", treatment: "Levothyroxine 200mcg daily", managing_provider: "Christine Stallings, NP" },
  { condition_name: "Gout", status: "managed", treatment: "Allopurinol 300mg daily", managing_provider: "Christine Stallings, NP" },
  { condition_name: "Obstructive Sleep Apnea", status: "active", treatment: "CPAP therapy (4-6 hrs/night)", notes: "Compliance needs improvement" },
  { condition_name: "Prediabetes", status: "monitoring", treatment: "Lifestyle modification", notes: "A1C 5.7% — at threshold" },
  { condition_name: "Stage 1 Hypertension", status: "monitoring", treatment: "Monitoring", notes: "BP 139/86 (Feb 2025)" },
  { condition_name: "Elevated Hematocrit", status: "active", notes: "50.2% — above range 38.5-50.0. Phlebotomy may be needed." },
  { condition_name: "Low Free Testosterone", status: "active", treatment: "TRT", notes: "Free T 5.1 — critically low despite TRT. Levothyroxine over-replacement suspected." },
];

const insertCondition = db.prepare(`
  INSERT INTO health_conditions (condition_name, status, treatment, managing_provider, notes, source_file)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertConditions = db.transaction(() => {
  for (const c of conditions) {
    insertCondition.run(c.condition_name, c.status, c.treatment || null, c.managing_provider || null, c.notes || null, "ambulatory_extract + open-brain-node-spec");
  }
});
insertConditions();
console.log(`✓ health_conditions: ${conditions.length} rows`);

// ── HEALTH PROVIDERS ──
const providers = [
  { provider_name: "Christine Stallings, NP", specialty: "Primary Care", facility: "The Carolina Clinic for Health & Wellness", phone: null, address: "Greenville, NC" },
  { provider_name: "ECU Healthcare", specialty: "Emergency/Hospital", facility: "ECU Health Medical Center", address: "Greenville, NC" },
  { provider_name: "Eye Center of Virginia", specialty: "Ophthalmology", facility: null, address: "Virginia" },
  { provider_name: "Oyster Point Family Practice", specialty: "Family Medicine", facility: null, address: "Virginia" },
  { provider_name: "Quest Diagnostics", specialty: "Laboratory", facility: null },
  { provider_name: "Labcorp", specialty: "Laboratory", facility: null },
  { provider_name: "Dr. Lawrence McKinney", specialty: "Primary Care (Historical)", facility: null, address: "TX", notes: "2003-2010" },
  { provider_name: "Virtuox", specialty: "Sleep Medicine", facility: null, notes: "Sleep study/CPAP" },
];

const insertProvider = db.prepare(`
  INSERT INTO health_providers (provider_name, specialty, facility, phone, address, notes, source_file)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertProviders = db.transaction(() => {
  for (const p of providers) {
    insertProvider.run(p.provider_name, p.specialty || null, p.facility || null, p.phone || null, p.address || null, p.notes || null, "open-brain-node-spec");
  }
});
insertProviders();
console.log(`✓ health_providers: ${providers.length} rows`);

// ── PATTERNS ──
const patternsFile = path.join(MEMORY_DIR, "patterns.json");
if (fs.existsSync(patternsFile)) {
  const patternsData = JSON.parse(fs.readFileSync(patternsFile, "utf-8"));
  const insertPattern = db.prepare(`
    INSERT INTO patterns (category, pattern_name, description, frequency, day_of_week, time_of_day, observations, first_observed, last_observed, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPatterns = db.transaction(() => {
    for (const p of patternsData.patterns || []) {
      insertPattern.run(
        p.category, p.routine || p.pattern_name, p.notes || p.description || null,
        p.frequency || null, p.day || null, p.time || null,
        p.observations || 1, p.first_observed || null, p.first_observed || null,
        p.frequency === "observed_once" ? 0.3 : 0.7
      );
    }
  });
  insertPatterns();
  console.log(`✓ patterns: ${(patternsData.patterns || []).length} rows`);
}

// ── DATA SOURCE TRACKING ──
const insertSource = db.prepare(`
  INSERT OR REPLACE INTO meta_data_sources (source_name, source_type, last_ingested, record_count, status)
  VALUES (?, ?, datetime('now'), ?, 'active')
`);

insertSource.run("ambulatory_extract", "file", labCount + medCount + vitalCount);
insertSource.run("conditions_manual", "manual", conditions.length);
insertSource.run("providers_manual", "manual", providers.length);
insertSource.run("patterns_json", "file", 1);

console.log("\n═══ Migration Complete ═══");
console.log(`Database: ${DB_PATH}`);
console.log(`Size: ${(fs.statSync(DB_PATH).size / 1024).toFixed(1)} KB`);

// Summary query
const summary = db.prepare("SELECT 'health_labs' as tbl, count(*) as cnt FROM health_labs UNION ALL SELECT 'health_medications', count(*) FROM health_medications UNION ALL SELECT 'health_vitals', count(*) FROM health_vitals UNION ALL SELECT 'health_conditions', count(*) FROM health_conditions UNION ALL SELECT 'health_providers', count(*) FROM health_providers UNION ALL SELECT 'patterns', count(*) FROM patterns UNION ALL SELECT 'recommendations', count(*) FROM recommendations").all();

console.log("\nTable counts:");
summary.forEach(r => console.log(`  ${r.tbl}: ${r.cnt}`));

db.close();
