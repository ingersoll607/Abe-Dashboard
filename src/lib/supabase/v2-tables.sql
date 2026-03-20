-- Dashboard V2 — Deep Drill-Down Tables
-- Run in Supabase SQL Editor

-- exec_sql RPC for future DDL from Cowork
CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE query; END; $$;

-- Health: Lab Results
CREATE TABLE IF NOT EXISTS health_labs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  test_date date,
  test_name text NOT NULL,
  result_value text,
  unit text,
  reference_range text,
  status text CHECK (status IN ('normal','high','low','borderline')),
  lab_provider text,
  ordering_provider text,
  panel_group text,
  source_file text,
  created_at timestamptz DEFAULT now()
);

-- Health: Medications
CREATE TABLE IF NOT EXISTS health_medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  prescriber text,
  start_date date,
  active boolean DEFAULT true,
  source_file text,
  created_at timestamptz DEFAULT now()
);

-- Health: Providers
CREATE TABLE IF NOT EXISTS health_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name text NOT NULL,
  specialty text,
  facility text,
  phone text,
  last_visit date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Finance: Bills
CREATE TABLE IF NOT EXISTS finance_bills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_name text NOT NULL,
  amount numeric,
  due_day int,
  category text,
  auto_pay boolean DEFAULT false,
  account text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Estate: Action Items / Milestones
CREATE TABLE IF NOT EXISTS estate_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  estate text CHECK (estate IN ('rogers','ingersoll')),
  item_title text NOT NULL,
  status text CHECK (status IN ('open','pending','closed')) DEFAULT 'open',
  priority text,
  assigned_to text,
  due_date date,
  notes text,
  last_updated timestamptz DEFAULT now(),
  source_file text,
  created_at timestamptz DEFAULT now()
);

-- Vehicle / Property Maintenance
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle text NOT NULL,
  item text NOT NULL,
  status text CHECK (status IN ('needed','scheduled','completed')) DEFAULT 'needed',
  priority text,
  cost_estimate numeric,
  notes text,
  due_date date,
  created_at timestamptz DEFAULT now()
);

-- RLS + Policies
ALTER TABLE health_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE estate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON health_labs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON health_medications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON health_providers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON finance_bills FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON estate_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON vehicle_maintenance FOR SELECT TO anon USING (true);

CREATE POLICY "service_all" ON health_labs FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON health_medications FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON health_providers FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON finance_bills FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON estate_items FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON vehicle_maintenance FOR ALL TO service_role USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_labs_date ON health_labs(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_labs_name ON health_labs(test_name);
CREATE INDEX IF NOT EXISTS idx_health_labs_panel ON health_labs(panel_group);
CREATE INDEX IF NOT EXISTS idx_health_meds_active ON health_medications(active);
CREATE INDEX IF NOT EXISTS idx_estate_items_estate ON estate_items(estate);
CREATE INDEX IF NOT EXISTS idx_estate_items_status ON estate_items(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maint_vehicle ON vehicle_maintenance(vehicle);
CREATE INDEX IF NOT EXISTS idx_finance_bills_category ON finance_bills(category);
