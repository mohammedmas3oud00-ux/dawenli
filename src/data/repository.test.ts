import { describe, expect, it, vi } from 'vitest';
import {
  createSnapshotBackup,
  emptySnapshot,
  GuestLocalRepository,
  normalizeSnapshot,
  normalizeSnapshotForDatabase,
  SupabaseRepository,
} from './repository';

describe('repository snapshot normalization', () => {
  it('fills database-required defaults before persistence', () => {
    const snapshot = normalizeSnapshot({
      ...emptySnapshot(),
      projects: [{ id: 'project-1' } as never],
      tasks: [{ id: 'task-1' } as never],
      habits: [{ id: 'habit-1' } as never],
      reviews: [{ id: 'review-1' } as never],
      worshipDefinitions: [{ id: 'worship-1' } as never],
      worshipLogs: [{ id: 'log-1' } as never],
      progressionPaths: [{ id: 'path-1' } as never],
      quranHifzTrackers: [{ id: 'hifz-1' } as never],
      journals: [{ id: 'journal-1' } as never],
      calendarEvents: [{ id: 'event-1' } as never],
    });

    expect(snapshot.projects[0].custom_fields).toEqual({});
    expect(snapshot.tasks[0].custom_fields).toEqual({});
    expect(snapshot.habits[0].custom_days).toEqual([]);
    expect(snapshot.habits[0].longest_streak).toBe(0);
    expect(snapshot.reviews[0].focus_goal_ids).toEqual([]);
    expect(snapshot.reviews[0].focus_project_ids).toEqual([]);
    expect(snapshot.worshipDefinitions[0].scheduled_days).toEqual([]);
    expect(snapshot.worshipLogs[0].is_completed).toBe(false);
    expect(snapshot.progressionPaths[0].stages).toEqual([]);
    expect(snapshot.quranHifzTrackers[0].surahs).toEqual([]);
    expect(snapshot.journals[0].tags).toEqual([]);
    expect(snapshot.calendarEvents[0].recurrence).toEqual({ frequency: 'none', interval: 1 });
  });

  it('uses the current revision for compare-and-swap snapshot writes', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: 7, error: null }).mockResolvedValueOnce({ data: 8, error: null });
    const repository = new SupabaseRepository({ rpc } as never, 'user-1');

    await repository.save(emptySnapshot());

    expect(rpc).toHaveBeenNthCalledWith(1, 'dawenli_get_snapshot_revision');
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'dawenli_save_snapshot',
      expect.objectContaining({ p_expected_revision: 7 }),
    );
  });

  it('maps snapshot revision conflicts without keeping a stale retry payload', async () => {
    localStorage.clear();
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: 4, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '40001', message: 'Snapshot revision conflict' } });
    const repository = new SupabaseRepository({ rpc } as never, 'user-1');

    await expect(repository.save(emptySnapshot())).rejects.toMatchObject({ code: 'conflict' });
    expect(localStorage.getItem('dawenli_pending_sync_user-1')).toBeNull();
  });

  it('round-trips and clears guest snapshots locally', async () => {
    const repository = new GuestLocalRepository();
    const snapshot = { ...emptySnapshot(), tasks: [{ id: 'task-1' } as never] };
    await repository.save(snapshot);
    await expect(repository.load()).resolves.toMatchObject({ tasks: [{ id: 'task-1' }] });
    await repository.clear();
    await expect(repository.load()).resolves.toMatchObject({ tasks: [] });
  });

  it('maps invalid guest storage to a validation repository error', async () => {
    localStorage.setItem('dawenli_guest_snapshot_v3', '{invalid');
    await expect(new GuestLocalRepository().load()).rejects.toMatchObject({ code: 'validation' });
  });

  it('maps app fields and fills every live required row default', () => {
    const snapshot = normalizeSnapshot({
      ...emptySnapshot(),
      habits: [{ id: 'habit-1', longest_streak: 4 } as never],
      inboxItems: [{ id: 'inbox-1' } as never],
      worshipDefinitions: [{ id: 'worship-1' } as never],
      progressionPaths: [{ id: 'path-1' } as never],
      sleepSchedules: [{ id: 'sleep-1' } as never],
    });
    const payload = normalizeSnapshotForDatabase(snapshot, 'user-1');
    const habit = (payload.habits as Array<Record<string, unknown>>)[0];
    const inbox = (payload.inbox_items as Array<Record<string, unknown>>)[0];
    const worship = (payload.worship_definitions as Array<Record<string, unknown>>)[0];
    const path = (payload.progression_paths as Array<Record<string, unknown>>)[0];
    const sleep = (payload.sleep_schedules as Array<Record<string, unknown>>)[0];
    expect(habit.best_streak).toBe(4);
    expect(habit.longest_streak).toBe(4);
    expect(inbox.source_type).toBe('idea');
    expect(inbox.status).toBe('inbox');
    expect(worship.tracking_type).toBe('checkbox');
    expect(path.stage_start_date).toBeTruthy();
    expect(sleep.ultimate_bedtime).toBe('22:00');
  });

  it('stamps user ids and drops schema metadata from database rows', () => {
    const payload = normalizeSnapshotForDatabase(
      normalizeSnapshot({
        ...emptySnapshot(),
        tasks: [{ id: 'task-1', updated_at: '2026-01-01T00:00:00Z' } as never],
        customFieldDefinitions: [{ id: 'field-1', entityType: 'tasks' } as never],
      }),
      'user-9',
    );
    const task = (payload.tasks as Array<Record<string, unknown>>)[0];
    expect(task.user_id).toBe('user-9');
    expect('schemaVersion' in task).toBe(false);
    expect((payload.custom_field_definitions as Array<Record<string, unknown>>)[0].entity_type).toBe('tasks');
  });

  it('normalizes vaults, quran trackers, journals, and calendar events for the database', () => {
    const payload = normalizeSnapshotForDatabase(
      normalizeSnapshot({ ...emptySnapshot(), vaults: [{ id: 'vault-1' } as never] }),
      'user-1',
    );
    expect((payload.vault_items as Array<Record<string, unknown>>)[0].vault_type).toBe('notes');
  });

  function chainableFrom(result: { data: unknown; error: unknown }) {
    return vi.fn(() => ({
      select: () => ({
        eq: () => Promise.resolve(result),
      }),
    }));
  }

  it('retries once on a revision change and then reports the conflict', async () => {
    localStorage.clear();
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: 1, error: null })
      .mockResolvedValueOnce({ data: 2, error: null })
      .mockResolvedValueOnce({ data: 2, error: null })
      .mockResolvedValueOnce({ data: 3, error: null });
    const repository = new SupabaseRepository(
      { from: chainableFrom({ data: [], error: null }), rpc } as never,
      'user-1',
    );
    await expect(repository.load()).rejects.toMatchObject({ code: 'conflict' });
    expect(rpc).toHaveBeenCalledTimes(4);
  });

  it('falls back to pending sync storage when the cloud load fails', async () => {
    localStorage.clear();
    localStorage.setItem(
      'dawenli_pending_sync_user-1',
      JSON.stringify(normalizeSnapshot({ ...emptySnapshot(), tasks: [{ id: 'pending' } as never] })),
    );
    const repository = new SupabaseRepository(
      {
        from: chainableFrom({ data: null, error: { message: 'network failure' } }),
        rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
      } as never,
      'user-1',
    );
    await expect(repository.load()).resolves.toMatchObject({ tasks: [{ id: 'pending' }] });
  });

  it('removes corrupt pending sync payloads instead of trusting them', async () => {
    localStorage.clear();
    localStorage.setItem('dawenli_pending_sync_user-1', '{corrupt');
    const repository = new SupabaseRepository(
      {
        from: chainableFrom({ data: [], error: null }),
        rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
      } as never,
      'user-1',
    );
    await expect(repository.load()).resolves.toMatchObject({ tasks: [] });
    expect(localStorage.getItem('dawenli_pending_sync_user-1')).toBeNull();
  });

  it('keeps a pending sync copy when a non-conflict save fails', async () => {
    localStorage.clear();
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: 3, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'fetch failed' } });
    const repository = new SupabaseRepository({ rpc } as never, 'user-1');
    await expect(repository.save(emptySnapshot())).rejects.toMatchObject({ code: 'network' });
    expect(localStorage.getItem('dawenli_pending_sync_user-1')).not.toBeNull();
  });

  it('clears the cloud snapshot and pending storage together', async () => {
    localStorage.clear();
    localStorage.setItem('dawenli_pending_sync_user-1', '{}');
    const rpc = vi.fn().mockResolvedValue({ data: 5, error: null });
    const repository = new SupabaseRepository({ rpc } as never, 'user-1');
    await expect(repository.clear()).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('dawenli_clear_snapshot');
    expect(localStorage.getItem('dawenli_pending_sync_user-1')).toBeNull();
  });

  it('rejects an invalid snapshot revision from the server', async () => {
    localStorage.clear();
    const rpc = vi.fn().mockResolvedValue({ data: 'NaN', error: null });
    const repository = new SupabaseRepository({ rpc } as never, 'user-1');
    await expect(repository.load()).rejects.toThrow('إصدار المزامنة السحابية غير صالح.');
  });

  it('maps unauthorized, validation, and duplicate database errors', async () => {
    localStorage.clear();
    const unauthorized = new SupabaseRepository(
      {
        rpc: vi.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } }),
      } as never,
      'user-1',
    );
    await expect(unauthorized.save(emptySnapshot())).rejects.toMatchObject({ code: 'unauthorized' });

    const duplicate = new SupabaseRepository(
      { rpc: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } }) } as never,
      'user-1',
    );
    await expect(duplicate.save(emptySnapshot())).rejects.toMatchObject({ code: 'conflict' });

    const invalid = new SupabaseRepository(
      { rpc: vi.fn().mockResolvedValue({ data: null, error: { code: '22P02', message: 'bad input' } }) } as never,
      'user-1',
    );
    await expect(invalid.save(emptySnapshot())).rejects.toMatchObject({ code: 'validation' });
  });

  it('downloads a snapshot backup through an object url', () => {
    const createdUrl = 'blob:download-url';
    const created = vi.fn(() => createdUrl);
    const revoked = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: created, revokeObjectURL: revoked });
    const anchor = { click: vi.fn() } as unknown as HTMLAnchorElement;
    const createElement = vi.fn(() => anchor);
    vi.spyOn(document, 'createElement').mockImplementation(createElement);

    createSnapshotBackup(normalizeSnapshot({ ...emptySnapshot(), tasks: [{ id: 'task-1' } as never] }));

    expect(created).toHaveBeenCalledOnce();
    expect(revoked).toHaveBeenCalledWith(createdUrl);
    expect(anchor.click).toHaveBeenCalledOnce();
    expect((anchor as HTMLAnchorElement & { download: string }).download).toContain('dawenli-backup-');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
