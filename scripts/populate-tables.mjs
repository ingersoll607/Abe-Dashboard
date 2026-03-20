import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://pfqwhbytrcyubegdijwl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXdoYnl0cmN5dWJlZ2RpandsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAyNzA2MCwiZXhwIjoyMDg5NjAzMDYwfQ.eupHZu_surVczwK1pNITD5n1b9yqrt8rKECV0MPBZlU'
);

const DATA_DIR = '/Users/mikeingersoll/Documents/Claude/Memory/health_extracted';

async function insertBatch(table, rows, batchSize = 50) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  Error inserting into ${table}: ${error.message}`);
      return inserted;
    }
    inserted += batch.length;
  }
  return inserted;
}

async function main() {
  console.log('=== Populating Supabase Tables ===\n');

  // 1. Bills
  const bills = JSON.parse(fs.readFileSync(`${DATA_DIR}/bills_extract.json`, 'utf-8'));
  const billCount = await insertBatch('finance_bills', bills);
  console.log(`finance_bills: ${billCount} rows inserted`);

  // 2. Labs
  const health = JSON.parse(fs.readFileSync(`${DATA_DIR}/ambulatory_extract.json`, 'utf-8'));
  const labs = health.labs || [];
  const labCount = await insertBatch('health_labs', labs);
  console.log(`health_labs: ${labCount} rows inserted`);

  // 3. Medications
  const meds = (health.medications || []).map(m => ({
    medication_name: m.medication_name || m.name,
    dosage: m.dosage || null,
    frequency: m.frequency || null,
    prescriber: m.prescriber || null,
    start_date: m.start_date || null,
    active: m.active !== undefined ? m.active : true,
    source_file: m.source_file || 'AmbulatorySummary_alltime.xml'
  }));
  const medCount = await insertBatch('health_medications', meds);
  console.log(`health_medications: ${medCount} rows inserted`);

  // 4. Creditors → estate_items
  const creditors = JSON.parse(fs.readFileSync(`${DATA_DIR}/creditors_extract.json`, 'utf-8'));
  const estateItems = creditors.map(c => ({
    estate: c.estate || 'rogers',
    item_title: `Creditor: ${c.creditor_name}`,
    status: c.status || 'open',
    priority: 'medium',
    notes: `Amount: $${c.amount_claimed}. ${c.collection_agency ? 'Agency: ' + c.collection_agency + '. ' : ''}${c.notes || ''}`,
    source_file: 'CREDITORS_EXTRACTED.csv'
  }));
  const estateCount = await insertBatch('estate_items', estateItems);
  console.log(`estate_items: ${estateCount} rows inserted`);

  console.log('\n=== Done ===');
}

main().catch(console.error);
