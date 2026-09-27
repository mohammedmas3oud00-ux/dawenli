import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { SupabaseRepository, emptySnapshot } from '../src/data/repository.ts';

const url = process.env.VITE_SUPABASE_URL;
const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!url || !managementToken) throw new Error('VITE_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required');
const ref = new URL(url).hostname.split('.')[0];

const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
  headers: { Authorization: `Bearer ${managementToken}` },
});
if (!keysResponse.ok) throw new Error(`Could not fetch API keys: ${keysResponse.status}`);
const keys = await keysResponse.json();
const anonKey = keys.find((item) => item.name === 'anon')?.api_key;
const serviceRoleKey = keys.find((item) => item.name === 'service_role')?.api_key;
if (!anonKey || !serviceRoleKey) throw new Error('Required Supabase keys were not returned');

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const email = `sync-check-${Date.now()}@example.com`;
const password = `Sync-${randomUUID()}-9!`;
const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createError || !created.user) throw createError ?? new Error('Test user was not created');

try {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: signedIn, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError || !signedIn.user) throw signInError ?? new Error('Test user could not sign in');
  const userId = signedIn.user.id;
  const repository = new SupabaseRepository(client, userId);
  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  const pillarId = randomUUID();
  const goalId = randomUUID();
  const projectId = randomUUID();
  const taskId = randomUUID();
  const habitId = randomUUID();
  const worshipId = randomUUID();
  const logId = randomUUID();

  const snapshot = {
    ...emptySnapshot(),
    pillars: [{ id: pillarId, title: 'Sync pillar', description: '', pillar_group: 'Growth', purpose: '', priority: 1, show_on_home: true, status: 'active', progress: 0, created_at: now }],
    goals: [{ id: goalId, pillar_id: pillarId, vision_id: null, title: 'Sync goal', description: '', status: 'in_progress', target_date: null, progress: 0, created_at: now }],
    projects: [{ id: projectId, goal_id: goalId, title: 'Sync project', description: '', status: 'in_progress', progress: 0, start_date: date, due_date: null, custom_fields: {}, created_at: now }],
    tasks: [{ id: taskId, project_id: projectId, title: 'Sync task', description: '', status: 'todo', priority: 'medium', due_date: null, completed_at: null, custom_fields: {}, created_at: now }],
    habits: [{ id: habitId, pillar_id: pillarId, title: 'Sync habit', description: '', frequency: 'daily', target_days_per_week: 7, custom_days: [], time_of_day: 'morning', current_streak: 2, longest_streak: 5, completed_dates: [date], is_active: true, created_at: now }],
    inboxItems: [{ id: randomUUID(), title: 'Sync inbox', content: '', source_type: 'idea', status: 'inbox', converted_to: null, converted_entity_id: null, created_at: now }],
    vaults: [{ id: randomUUID(), pillar_id: pillarId, project_id: null, title: 'Sync vault', vault_type: 'notes', summary: '', content: '', tags: [], status: 'active', created_at: now }],
    worshipDefinitions: [{ id: worshipId, pillar_id: pillarId, vision_id: null, goal_id: null, title: 'Sync worship', category: 'custom_dua', tracking_type: 'checkbox', frequency: 'daily', scheduled_days: [], scheduled_hijri_days: [], settings_history: [], is_active: true, sort_order: 0, created_at: now }],
    worshipLogs: [{ id: logId, worship_id: worshipId, date, is_completed: true, count: null, amount: null, pages_read: null, performance: null, congregation: null, sunnah_completed: null, rakaat_count: null, performed_at_time: null, fasting_type: null, notes: null, completed_at: now, created_at: now }],
  };

  await repository.save(snapshot);
  const loaded = await repository.load();
  if (loaded.projects.length !== 1 || loaded.tasks.length !== 1 || loaded.inboxItems.length !== 1 || loaded.vaults.length !== 1) throw new Error('Core collections did not round-trip');
  if (loaded.habits[0]?.longest_streak !== 5 || loaded.habits[0]?.completed_dates?.[0] !== date) throw new Error('Habit data did not round-trip');
  if (loaded.worshipDefinitions.length !== 1 || loaded.worshipLogs[0]?.is_completed !== true) throw new Error('Ibadat data did not round-trip');

  const updated = { ...loaded, habits: [{ ...loaded.habits[0], current_streak: 3, longest_streak: 6 }], worshipLogs: [{ ...loaded.worshipLogs[0], notes: 'updated' }] };
  await repository.save(updated);
  const reloaded = await repository.load();
  if (reloaded.habits[0]?.current_streak !== 3 || reloaded.habits[0]?.longest_streak !== 6) throw new Error('Habit update did not persist');
  if (reloaded.worshipLogs[0]?.notes !== 'updated') throw new Error('Ibadat update did not persist');

  await repository.clear();
  const cleared = await repository.load();
  if (cleared.pillars.length || cleared.habits.length || cleared.worshipDefinitions.length || cleared.worshipLogs.length) throw new Error('Snapshot clear did not persist');
  console.log('Authenticated Supabase round-trip passed for core, habits, and Ibadat data.');
} finally {
  await admin.auth.admin.deleteUser(created.user.id);
}
