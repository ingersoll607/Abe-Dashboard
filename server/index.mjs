import express from "express";
import cors from "cors";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import * as queries from "./db/queries.mjs";

const app = express();
const PORT = 3847;
const AUTH_TOKEN = process.env.OPEN_BRAIN_TOKEN || "abe-open-brain-2026";

// Paths
const MEMORY_DIR = path.join(process.env.HOME, "Documents/Claude/Memory");
const HEALTH_DIR = path.join(MEMORY_DIR, "health_extracted");
const DOCUMENTS_DIR = path.join(process.env.HOME, "Documents");

// Middleware
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3847", "https://abe-command-center.vercel.app"] }));
app.use(express.json());

// Auth middleware — all routes require token
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token;
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Helper: run osascript
function osascript(script, timeout = 30000) {
  try {
    return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout,
      encoding: "utf-8",
    }).trim();
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

// Helper: read JSON file safely
function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return null;
  }
}

// Helper: read markdown file
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, "utf-8");
  } catch {
    return null;
  }
}

// ════════════════════════════════════════
// API ENDPOINTS
// ════════════════════════════════════════

// Health check
app.get("/api/health-check", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ── ALERTS: Aggregated critical items across all sources ──
app.get("/api/alerts", (_req, res) => {
  const alerts = [];

  // From Reminders via osascript
  try {
    const reminderScript = `
tell application "Reminders"
  set output to ""
  repeat with reminderList in every list
    set listName to name of reminderList
    repeat with r in (reminders of reminderList whose completed is false)
      set rName to name of r
      try
        set dueDate to due date of r
        set output to output & listName & "|" & rName & "|" & (dueDate as string) & linefeed
      on error
        set output to output & listName & "|" & rName & "|none" & linefeed
      end try
    end repeat
  end repeat
  return output
end tell`;
    const raw = osascript(reminderScript, 15000);
    if (raw && !raw.startsWith("Error")) {
      raw.split("\n").filter(Boolean).forEach(line => {
        const [list, name, due] = line.split("|");
        alerts.push({ source: "reminders", list, text: name, due: due === "none" ? null : due });
      });
    }
  } catch { /* skip if reminders unavailable */ }

  // From estate_status.md — parse key tasks
  const estate = readFile(path.join(MEMORY_DIR, "estate_status.md"));
  if (estate) {
    if (estate.includes("Will & POA") && estate.includes("NONE ON FILE")) {
      alerts.push({ source: "estate", text: "Will & POA — NONE ON FILE", priority: "critical" });
    }
    if (estate.includes("OPM") && estate.includes("7+ months")) {
      alerts.push({ source: "estate", text: "OPM/FERS — 7+ months pending", priority: "critical" });
    }
  }

  res.json({ alerts, count: alerts.length, timestamp: new Date().toISOString() });
});

// ── REMINDERS: All Apple Reminders lists with items ──
app.get("/api/reminders", (_req, res) => {
  const script = `
tell application "Reminders"
  set output to ""
  repeat with reminderList in every list
    set listName to name of reminderList
    set itemCount to count of (reminders of reminderList whose completed is false)
    set output to output & "LIST:" & listName & ":" & (itemCount as string) & linefeed
    repeat with r in (reminders of reminderList whose completed is false)
      set rName to name of r
      try
        set dueDate to due date of r
        set output to output & "  ITEM:" & rName & "|" & (dueDate as string) & linefeed
      on error
        set output to output & "  ITEM:" & rName & "|none" & linefeed
      end try
    end repeat
  end repeat
  return output
end tell`;
  const raw = osascript(script, 20000);
  if (raw.startsWith("Error")) {
    return res.json({ error: raw, lists: [] });
  }

  const lists = [];
  let currentList = null;
  raw.split("\n").filter(Boolean).forEach(line => {
    if (line.startsWith("LIST:")) {
      const [, name, count] = line.split(":");
      currentList = { name, count: parseInt(count) || 0, items: [] };
      lists.push(currentList);
    } else if (line.trim().startsWith("ITEM:") && currentList) {
      const content = line.trim().replace("ITEM:", "");
      const [name, due] = content.split("|");
      currentList.items.push({ name, due: due === "none" ? null : due });
    }
  });

  res.json({ lists, totalItems: lists.reduce((s, l) => s + l.count, 0), timestamp: new Date().toISOString() });
});

// ── CALENDAR: Next 30 days ──
app.get("/api/calendar", (_req, res) => {
  const script = `
tell application "Calendar"
  set today to current date
  set endDate to today + 30 * days
  set output to ""
  repeat with cal in every calendar
    set calName to name of cal
    set calEvents to (every event of cal whose start date ≥ today and start date ≤ endDate)
    repeat with e in calEvents
      set eName to summary of e
      set eStart to start date of e
      set output to output & calName & "|" & eName & "|" & (eStart as string) & linefeed
    end repeat
  end repeat
  return output
end tell`;
  const raw = osascript(script, 20000);
  if (raw.startsWith("Error")) {
    return res.json({ error: raw, events: [] });
  }

  const events = raw.split("\n").filter(Boolean).map(line => {
    const [calendar, name, date] = line.split("|");
    return { calendar, name, date };
  });

  res.json({ events, count: events.length, timestamp: new Date().toISOString() });
});

// ── HEALTH: Full health domain from SQLite ──
app.get("/api/health", (req, res) => {
  console.log("HIT: /api/health SQLite route");
  try {
    const summary = queries.getHealthSummary();
    console.log("SQLite summary keys:", Object.keys(summary));
    res.json({ ...summary, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error("Health endpoint error:", e.message, e.stack);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/health/labs", (req, res) => {
  const { panel, status, limit } = req.query;
  const labs = queries.getLabResults({ panel, status, limit: limit ? parseInt(limit) : 50 });
  res.json({ labs, count: labs.length, timestamp: new Date().toISOString() });
});

app.get("/api/health/labs/flagged", (_req, res) => {
  const flagged = queries.getFlaggedLabs();
  res.json({ flagged, count: flagged.length, timestamp: new Date().toISOString() });
});

app.get("/api/health/labs/panels", (_req, res) => {
  const panels = queries.getLabPanels();
  res.json({ panels, timestamp: new Date().toISOString() });
});

app.get("/api/health/labs/trend", (req, res) => {
  const { test } = req.query;
  if (!test) return res.json({ error: "Missing ?test= parameter" });
  const trend = queries.getLabTrend(test);
  res.json({ test, trend, dataPoints: trend.length, timestamp: new Date().toISOString() });
});

app.get("/api/health/medications", (req, res) => {
  const activeOnly = req.query.active === "true";
  const meds = queries.getMedications({ activeOnly });
  res.json({ medications: meds, count: meds.length, timestamp: new Date().toISOString() });
});

app.get("/api/health/conditions", (_req, res) => {
  const conditions = queries.getConditions();
  res.json({ conditions, count: conditions.length, timestamp: new Date().toISOString() });
});

app.get("/api/health/vitals", (req, res) => {
  const { type, limit } = req.query;
  const vitals = queries.getVitals({ type, limit: limit ? parseInt(limit) : 50 });
  res.json({ vitals, count: vitals.length, timestamp: new Date().toISOString() });
});

app.get("/api/health/providers", (_req, res) => {
  const providers = queries.getProviders();
  res.json({ providers, count: providers.length, timestamp: new Date().toISOString() });
});

// ── RECOMMENDATIONS (Trust Ladder) ──
app.get("/api/recommendations", (req, res) => {
  const { status, domain } = req.query;
  const recs = queries.getRecommendations({ status: status || "pending", domain });
  res.json({ recommendations: recs, count: recs.length, timestamp: new Date().toISOString() });
});

// ── PATTERNS ──
app.get("/api/patterns", (req, res) => {
  const { category } = req.query;
  const patterns = queries.getPatterns({ category });
  res.json({ patterns, count: patterns.length, timestamp: new Date().toISOString() });
});

// ── DB STATS ──
app.get("/api/stats", (_req, res) => {
  const stats = queries.getDbStats();
  const sources = queries.getDataSources();
  res.json({ ...stats, dataSources: sources, timestamp: new Date().toISOString() });
});

// ── FINANCE: Bills, accounts ──
app.get("/api/finance", (_req, res) => {
  const bills = readJSON(path.join(HEALTH_DIR, "bills_extract.json")) || [];
  const profile = readFile(path.join(MEMORY_DIR, "mike_profile.md")) || "";

  // Extract FICO from profile
  let fico = null;
  const ficoMatch = profile.match(/FICO.*?(\d{3})/);
  if (ficoMatch) fico = parseInt(ficoMatch[1]);

  res.json({ bills, fico, billCount: bills.length, timestamp: new Date().toISOString() });
});

// ── ESTATE: Both estates ──
app.get("/api/estate", (_req, res) => {
  const status = readFile(path.join(MEMORY_DIR, "estate_status.md"));
  const creditors = readJSON(path.join(HEALTH_DIR, "creditors_extract.json")) || [];

  res.json({
    statusMarkdown: status,
    creditors,
    creditorCount: creditors.length,
    timestamp: new Date().toISOString(),
  });
});

// ── PROPERTY: Vehicles, home, maintenance ──
app.get("/api/property", (_req, res) => {
  const profile = readFile(path.join(MEMORY_DIR, "mike_profile.md")) || "";
  const infra = readFile(path.join(MEMORY_DIR, "infrastructure.md")) || "";

  res.json({
    profileMarkdown: profile,
    infraMarkdown: infra,
    timestamp: new Date().toISOString(),
  });
});

// ── INFRA: Agent status from Supabase (non-PII) ──
app.get("/api/infra", async (_req, res) => {
  try {
    const response = await fetch(
      "https://pfqwhbytrcyubegdijwl.supabase.co/rest/v1/agent_status?select=*&order=agent_name",
      {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXdoYnl0cmN5dWJlZ2RpandsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjcwNjAsImV4cCI6MjA4OTYwMzA2MH0.RkDpDNeG3PxYOYYm3hDsqOyPxl7mF9ZLIrix9PFVNf0",
        },
      }
    );
    const agents = await response.json();
    res.json({ agents, count: agents.length, timestamp: new Date().toISOString() });
  } catch (e) {
    res.json({ agents: [], error: e.message, timestamp: new Date().toISOString() });
  }
});

// ── COMMS: Email unread count ──
app.get("/api/comms", (_req, res) => {
  const script = `
tell application "Mail"
  set unreadCount to unread count of inbox
  return unreadCount as string
end tell`;
  const unread = osascript(script, 10000);

  res.json({
    email: { unreadCount: parseInt(unread) || 0 },
    timestamp: new Date().toISOString(),
  });
});

// ── SEARCH: Placeholder for RAG semantic search ──
app.get("/api/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ error: "Missing ?q= parameter", results: [] });

  // TODO: Wire to local-rag MCP query_documents
  res.json({
    query,
    results: [],
    note: "RAG search integration pending — will connect to local-rag MCP",
    timestamp: new Date().toISOString(),
  });
});

// ── CORRECT: Write corrections back to data store ──
app.post("/api/correct", (req, res) => {
  const { target, field, value, source } = req.body;
  if (!target || !field || !value) {
    return res.status(400).json({ error: "Missing target, field, or value" });
  }

  // TODO: Implement write-back to specific data stores
  // For now, log corrections to a file
  const correction = {
    target,
    field,
    value,
    source: source || "open-brain-ui",
    timestamp: new Date().toISOString(),
  };

  const correctionsFile = path.join(MEMORY_DIR, "corrections.json");
  const existing = readJSON(correctionsFile) || [];
  existing.push(correction);
  fs.writeFileSync(correctionsFile, JSON.stringify(existing, null, 2));

  res.json({ status: "logged", correction });
});

// ════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Open Brain API running at http://localhost:${PORT}`);
  console.log(`Auth token: ${AUTH_TOKEN}`);
  console.log(`Memory dir: ${MEMORY_DIR}`);
});
