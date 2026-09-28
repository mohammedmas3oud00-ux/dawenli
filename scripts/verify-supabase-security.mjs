import 'dotenv/config';
import { readFile } from 'node:fs/promises';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  throw new Error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_ACCESS_TOKEN are required.');
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const query = await readFile(new URL('../supabase/tests/security_integrity.sql', import.meta.url), 'utf8');
const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  throw new Error(`Supabase security query failed (${response.status}): ${await response.text()}`);
}

const checks = await response.json();
if (!Array.isArray(checks)) throw new Error('Supabase security query returned an unexpected response.');
const failed = checks.filter((check) => check?.passed !== true);
if (failed.length) {
  throw new Error(`Supabase security checks failed: ${failed.map((check) => check?.name || 'unknown').join(', ')}`);
}

console.log(`Supabase security checks passed (${checks.length}/${checks.length}).`);
