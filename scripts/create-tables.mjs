import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  'https://pfqwhbytrcyubegdijwl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXdoYnl0cmN5dWJlZ2RpandsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAyNzA2MCwiZXhwIjoyMDg5NjAzMDYwfQ.eupHZu_surVczwK1pNITD5n1b9yqrt8rKECV0MPBZlU'
);

const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'supabase', 'setup-tables.sql'), 'utf-8');

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function main() {
  console.log(`Running ${statements.length} SQL statements...\n`);

  for (const stmt of statements) {
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
      if (error) {
        // Try via direct REST/PostgREST — fallback
        console.log(`  ⚠ ${preview}... — RPC not available, need SQL editor`);
      } else {
        console.log(`  ✓ ${preview}...`);
      }
    } catch (e) {
      console.log(`  ⚠ ${preview}... — ${e.message}`);
    }
  }

  console.log('\nDone. If RPC failed, paste the SQL into Supabase SQL Editor manually.');
}

main();
