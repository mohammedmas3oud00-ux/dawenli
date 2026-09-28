import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { SupabaseRepository, emptySnapshot, normalizeSnapshotForDatabase } from '../src/data/repository.ts';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
let anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is required');

const hostname = new URL(url).hostname;
const isLocal = hostname === '127.0.0.1' || hostname === 'localhost';
if ((!anonKey || !serviceRoleKey) && !isLocal) {
  if (!managementToken) throw new Error('SUPABASE_ACCESS_TOKEN is required when project API keys are not configured');
  const ref = hostname.split('.')[0];
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${managementToken}` },
  });
  if (!keysResponse.ok) throw new Error(`Could not fetch API keys: ${keysResponse.status}`);
  const keys = await keysResponse.json();
  anonKey ||= keys.find((item) => item.name === 'anon')?.api_key;
  serviceRoleKey ||= keys.find((item) => item.name === 'service_role')?.api_key;
}
if (!anonKey || !serviceRoleKey) throw new Error('SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required');

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const email = `sync-check-${Date.now()}@example.com`;
const secondEmail = `sync-check-second-${Date.now()}@example.com`;
const password = `Sync-${randomUUID()}-9!`;
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createError || !created.user) throw createError ?? new Error('Test user was not created');
const { data: secondCreated, error: secondCreateError } = await admin.auth.admin.createUser({
  email: secondEmail,
  password,
  email_confirm: true,
});
if (secondCreateError || !secondCreated.user) {
  await admin.auth.admin.deleteUser(created.user.id);
  throw secondCreateError ?? new Error('Second test user was not created');
}

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
  const journalId = randomUUID();
  const eventId = randomUUID();

  const snapshot = {
    ...emptySnapshot(),
    pillars: [
      {
        id: pillarId,
        title: 'Sync pillar',
        description: '',
        pillar_group: 'Growth',
        purpose: '',
        priority: 1,
        show_on_home: true,
        status: 'active',
        progress: 0,
        created_at: now,
      },
    ],
    goals: [
      {
        id: goalId,
        pillar_id: pillarId,
        vision_id: null,
        title: 'Sync goal',
        description: '',
        status: 'in_progress',
        target_date: null,
        progress: 0,
        created_at: now,
      },
    ],
    projects: [
      {
        id: projectId,
        goal_id: goalId,
        title: 'Sync project',
        description: '',
        status: 'in_progress',
        progress: 0,
        start_date: date,
        due_date: null,
        custom_fields: {},
        created_at: now,
      },
    ],
    tasks: [
      {
        id: taskId,
        project_id: projectId,
        title: 'Sync task',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: null,
        completed_at: null,
        custom_fields: {},
        created_at: now,
      },
    ],
    habits: [
      {
        id: habitId,
        pillar_id: pillarId,
        title: 'Sync habit',
        description: '',
        frequency: 'daily',
        target_days_per_week: 7,
        custom_days: [],
        time_of_day: 'morning',
        current_streak: 2,
        longest_streak: 5,
        completed_dates: [date],
        is_active: true,
        created_at: now,
      },
    ],
    inboxItems: [
      {
        id: randomUUID(),
        title: 'Sync inbox',
        content: '',
        source_type: 'idea',
        status: 'processed',
        converted_to: 'calendar_event',
        converted_entity_id: eventId,
        created_at: now,
      },
    ],
    vaults: [
      {
        id: randomUUID(),
        pillar_id: pillarId,
        project_id: null,
        title: 'Sync vault',
        vault_type: 'notes',
        summary: '',
        content: '',
        tags: [],
        status: 'active',
        created_at: now,
      },
    ],
    worshipDefinitions: [
      {
        id: worshipId,
        pillar_id: pillarId,
        vision_id: null,
        goal_id: null,
        title: 'Sync worship',
        category: 'custom_dua',
        tracking_type: 'checkbox',
        frequency: 'daily',
        scheduled_days: [],
        scheduled_hijri_days: [],
        settings_history: [],
        is_active: true,
        sort_order: 0,
        created_at: now,
      },
    ],
    worshipLogs: [
      {
        id: logId,
        worship_id: worshipId,
        date,
        is_completed: true,
        count: null,
        amount: null,
        pages_read: null,
        performance: null,
        congregation: null,
        sunnah_completed: null,
        rakaat_count: null,
        performed_at_time: null,
        fasting_type: null,
        notes: null,
        completed_at: now,
        created_at: now,
      },
    ],
    journals: [
      {
        id: journalId,
        title: 'Sync journal',
        content: 'Round-trip text',
        entry_date: date,
        mood: 'good',
        tags: ['sync'],
        pillar_id: pillarId,
        project_id: projectId,
        audio_path: null,
        created_at: now,
        updated_at: now,
      },
    ],
    calendarEvents: [
      {
        id: eventId,
        title: 'Sync event',
        description: '',
        start_at: new Date(Date.now() + 3600000).toISOString(),
        end_at: new Date(Date.now() + 7200000).toISOString(),
        all_day: false,
        timezone: 'UTC',
        recurrence: { frequency: 'weekly', interval: 1, days_of_week: [1], until: null },
        reminder_minutes: 15,
        task_id: taskId,
        project_id: projectId,
        pillar_id: pillarId,
        is_cancelled: false,
        created_at: now,
        updated_at: now,
      },
    ],
  };

  await repository.save(snapshot);

  const { error: staleWriteError } = await client.rpc('dawenli_save_snapshot', {
    p_snapshot: normalizeSnapshotForDatabase(snapshot, userId),
    p_expected_revision: 0,
  });
  if (staleWriteError?.code !== '40001') throw new Error('Snapshot CAS did not reject a stale revision');

  const secondClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: secondSignedIn, error: secondSignInError } = await secondClient.auth.signInWithPassword({
    email: secondEmail,
    password,
  });
  if (secondSignInError || !secondSignedIn.user)
    throw secondSignInError ?? new Error('Second test user could not sign in');
  const { data: leakedPillars, error: secondReadError } = await secondClient
    .from('pillars')
    .select('id')
    .eq('id', pillarId);
  if (secondReadError || leakedPillars?.length) throw new Error('RLS exposed another user’s pillar');
  const { error: crossOwnerInsertError } = await secondClient
    .from('pillars')
    .insert({ id: randomUUID(), user_id: userId, title: 'Forbidden pillar' });
  if (!crossOwnerInsertError) throw new Error('RLS allowed a cross-owner insert');

  const anonymousClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: anonymousRevisionError } = await anonymousClient.rpc('dawenli_get_snapshot_revision');
  if (!anonymousRevisionError) throw new Error('Anonymous role could execute the snapshot revision RPC');

  const loaded = await repository.load();
  if (
    loaded.projects.length !== 1 ||
    loaded.tasks.length !== 1 ||
    loaded.inboxItems.length !== 1 ||
    loaded.vaults.length !== 1
  )
    throw new Error('Core collections did not round-trip');
  if (loaded.inboxItems[0]?.converted_to !== 'calendar_event' || loaded.inboxItems[0]?.converted_entity_id !== eventId)
    throw new Error('Inbox calendar conversion did not round-trip');
  if (loaded.habits[0]?.longest_streak !== 5 || loaded.habits[0]?.completed_dates?.[0] !== date)
    throw new Error('Habit data did not round-trip');
  if (loaded.worshipDefinitions.length !== 1 || loaded.worshipLogs[0]?.is_completed !== true)
    throw new Error('Ibadat data did not round-trip');
  if (loaded.journals[0]?.content !== 'Round-trip text' || loaded.calendarEvents[0]?.recurrence?.frequency !== 'weekly')
    throw new Error('Journal or calendar data did not round-trip');

  const updated = {
    ...loaded,
    habits: [{ ...loaded.habits[0], current_streak: 3, longest_streak: 6 }],
    worshipLogs: [{ ...loaded.worshipLogs[0], notes: 'updated' }],
    journals: [{ ...loaded.journals[0], content: 'updated journal' }],
    calendarEvents: [{ ...loaded.calendarEvents[0], title: 'Updated event' }],
  };
  await repository.save(updated);
  const reloaded = await repository.load();
  if (reloaded.habits[0]?.current_streak !== 3 || reloaded.habits[0]?.longest_streak !== 6)
    throw new Error('Habit update did not persist');
  if (reloaded.worshipLogs[0]?.notes !== 'updated') throw new Error('Ibadat update did not persist');
  if (reloaded.journals[0]?.content !== 'updated journal' || reloaded.calendarEvents[0]?.title !== 'Updated event')
    throw new Error('Journal or calendar update did not persist');

  await repository.clear();
  const cleared = await repository.load();
  if (
    cleared.pillars.length ||
    cleared.habits.length ||
    cleared.worshipDefinitions.length ||
    cleared.worshipLogs.length ||
    cleared.journals.length ||
    cleared.calendarEvents.length
  )
    throw new Error('Snapshot clear did not persist');
  console.log('Local Auth, RLS, CAS, and authenticated snapshot round-trip checks passed.');
} finally {
  await Promise.all([admin.auth.admin.deleteUser(created.user.id), admin.auth.admin.deleteUser(secondCreated.user.id)]);
}
