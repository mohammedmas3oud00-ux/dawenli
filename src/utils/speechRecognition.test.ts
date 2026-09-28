import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({ auth: { getSession: vi.fn() } }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));

import {
  analyzeInboxItemWithAi,
  analyzeVoiceInput,
  analyzeWorshipInsight,
  decomposeProjectWithAi,
  deduplicateArabicSpeech,
  fetchPrayerTimes,
  performAiSmartReview,
  transcribeAudioBlob,
} from './speechRecognition';

function jsonResponse(body: unknown, ok = true) {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('deduplicateArabicSpeech', () => {
  it('returns trimmed single-word and empty input', () => {
    expect(deduplicateArabicSpeech('')).toBe('');
    expect(deduplicateArabicSpeech('  مرحباً  ')).toBe('مرحباً');
  });

  it('collapses immediate word repetition', () => {
    expect(deduplicateArabicSpeech('أنا أنا أريد أريد القراءة')).toBe('أنا أريد القراءة');
  });

  it('removes repeated multi-word phrases', () => {
    expect(deduplicateArabicSpeech('يجب يجب قراءة قراءة كتاب كتاب')).toBe('يجب قراءة كتاب');
  });

  it('resolves progressive interim accumulation', () => {
    const text = 'أنا أريد أن أقرأ أنا أريد أن أقرأ أنا أريد أن أقرأ كتاباً';
    expect(deduplicateArabicSpeech(text)).toBe('أنا أريد أن أقرأ كتاباً');
  });
});

describe('speech recognition API helpers', () => {
  beforeEach(() => {
    auth.getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'token-1' } } });
  });

  it('requires a session before calling the AI endpoints', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(analyzeVoiceInput('text')).rejects.toThrow('سجّل الدخول');
  });

  it('parses voice analysis and surfaces server errors', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: { intentType: 'habit' } }));
    await expect(analyzeVoiceInput('صلِّ الفجر', { existingPillars: ['روحاني'] })).resolves.toMatchObject({
      intentType: 'habit',
    });
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.existingPillars).toEqual(['روحاني']);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ error: { message: 'حصة النموذج نفدت' } }, false),
    );
    await expect(analyzeVoiceInput('text')).rejects.toThrow('حصة النموذج نفدت');
  });

  it('maps string error bodies and falls back for unreadable payloads', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: 'خطأ عام' }, false))
      .mockResolvedValueOnce(new Response('not json', { status: 500 }));
    await expect(analyzeWorshipInsight({})).rejects.toThrow('خطأ عام');
    await expect(analyzeWorshipInsight({})).rejects.toThrow('فشل تحليل الالتزام.');
  });

  it('rejects missing summaries in worship insight', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: { suggestions: ['اقتراح'] } }));
    await expect(analyzeWorshipInsight({})).rejects.toThrow('تعذر قراءة تحليل الالتزام.');
  });

  it('transcribes blobs within the size limit', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ data: { transcription: 'نص' } }));
    await expect(transcribeAudioBlob(blob)).resolves.toBe('نص');
  });

  it('rejects oversized recordings', async () => {
    const oversized = new Blob([new Uint8Array(4 * 1024 * 1024)]);
    await expect(transcribeAudioBlob(oversized)).rejects.toThrow('يتجاوز 3MB');
  });

  it('returns decomposed tasks and smart review payloads', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: { tasks: [{ title: 'مهمة' }] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { smart_summary: 'ملخص' } }));
    await expect(decomposeProjectWithAi('مشروع')).resolves.toEqual([{ title: 'مهمة' }]);
    await expect(performAiSmartReview('daily', {}, {})).resolves.toEqual({ smart_summary: 'ملخص' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('analyzes inbox items with the provided context', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: { suggestedDestination: 'task', actionableTitle: 'مهمة', suggestedPillarTitle: 'روحاني', reasoning: '' },
      }),
    );
    await expect(
      analyzeInboxItemWithAi({ title: 'فكرة' }, { pillars: [{ id: 'p1', title: 'روحاني' }], projects: [] }),
    ).resolves.toMatchObject({ suggestedDestination: 'task' });
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.pillars).toEqual([{ id: 'p1', title: 'روحاني' }]);
  });

  it('fetches prayer times with optional coordinates', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: { Fajr: '04:30' } }))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(fetchPrayerTimes({ lat: 30, lng: 31 })).resolves.toMatchObject({ Fajr: '04:30' });
    expect(fetchMock.mock.calls[0][0]).toContain('lat=30&lng=31');
    await expect(fetchPrayerTimes()).rejects.toThrow('فشل جلب مواقيت الصلاة');
  });
});
