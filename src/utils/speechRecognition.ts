/**
 * Speech Recognition, AI Processing and Utility Service for Dawenli
 */

// Robust Arabic & General Speech De-duplicator
export function deduplicateArabicSpeech(rawText: string): string {
  if (!rawText) return '';
  let str = rawText.trim().replace(/\s+/g, ' ');

  const words = str.split(' ').filter(Boolean);
  if (words.length <= 1) return str;

  // 1. Resolve progressive interim-speech accumulation bug
  if (words.length > 5) {
    const startWord = words[0];
    const startIndices: number[] = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i] === startWord) startIndices.push(i);
    }
    if (startIndices.length >= 3) {
      const segments: string[] = [];
      for (let s = 0; s < startIndices.length; s++) {
        const start = startIndices[s];
        const end = s + 1 < startIndices.length ? startIndices[s + 1] : words.length;
        segments.push(words.slice(start, end).join(' '));
      }
      const longest = segments.reduce((max, seg) => (seg.length > max.length ? seg : max), '');
      if (longest.length > 15) {
        str = longest;
      }
    }
  }

  // 2. Remove immediate consecutive word duplicates
  const tokens = str.split(' ').filter(Boolean);
  const cleanTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === 0 || tokens[i] !== tokens[i - 1]) {
      cleanTokens.push(tokens[i]);
    }
  }

  // 3. Remove repeating multi-word phrases (e.g. 2 to 8 words)
  let result = cleanTokens;
  for (let phraseLen = Math.min(8, Math.floor(result.length / 2)); phraseLen >= 2; phraseLen--) {
    const compacted: string[] = [];
    let i = 0;
    while (i < result.length) {
      if (i + 2 * phraseLen <= result.length) {
        const p1 = result.slice(i, i + phraseLen).join(' ');
        const p2 = result.slice(i + phraseLen, i + 2 * phraseLen).join(' ');
        if (p1 === p2) {
          compacted.push(...result.slice(i, i + phraseLen));
          i += 2 * phraseLen;
          continue;
        }
      }
      compacted.push(result[i]);
      i++;
    }
    result = compacted;
  }

  return result.join(' ').trim();
}

export interface AiVoiceAnalysisResult {
  cleanedTranscription: string;
  intentType: 'project_breakdown' | 'single_task' | 'habit' | 'idea_note';
  summary: string;
  suggestedPillarTitle: string;
  valueGoalTitle?: string;
  projectTitle?: string;
  projectDescription?: string;
  tasks: Array<{
    title: string;
    description?: string;
    priority: 'high' | 'medium' | 'low';
    energyLevel: 'high' | 'medium' | 'low';
    estimatedHours: number;
  }>;
}

/**
 * Call Server-Side Gemini to analyze and decompose spoken or typed text
 */
export async function analyzeVoiceInput(
  speechText: string,
  context?: { existingPillars?: string[]; existingProjects?: string[] }
): Promise<AiVoiceAnalysisResult> {
  const res = await fetch('/api/ai/analyze-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      speechText,
      existingPillars: context?.existingPillars || [],
      existingProjects: context?.existingProjects || [],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل الاتصال بخدمة التحليل الذكي');
  }

  const json = await res.json();
  return json.data;
}

/**
 * Transcribe recorded audio with server-side Gemini
 */
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
  });
  reader.readAsDataURL(blob);
  const base64 = await base64Promise;

  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioData: base64,
      mimeType: blob.type || 'audio/webm',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل تفريغ الصوت بالذكاء الاصطناعي');
  }

  const json = await res.json();
  return json.transcription || '';
}

/**
 * Decompose a project into tasks using Gemini
 */
export async function decomposeProjectWithAi(
  projectTitle: string,
  projectDescription?: string,
  pillarTitle?: string
): Promise<Array<{ title: string; description?: string; priority: string; energyLevel: string; estimatedHours: number }>> {
  const res = await fetch('/api/ai/decompose-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectTitle, projectDescription, pillarTitle }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل تفكيك المشروع');
  }

  const json = await res.json();
  return json.tasks || [];
}

/**
 * Perform smart strategic review using Gemini
 */
export async function performAiSmartReview(
  frequency: string,
  reflection: { wins?: string; challenges?: string; lessons?: string; next_commitments?: string },
  systemMetrics: any
) {
  const res = await fetch('/api/ai/smart-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frequency, reflection, systemMetrics }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل التحليل الذكي للمراجعة');
  }

  const json = await res.json();
  return json.data;
}

export interface AiInboxAnalysisResult {
  suggestedDestination: 'task' | 'project' | 'vault' | 'habit';
  actionableTitle: string;
  suggestedPillarId?: string;
  suggestedPillarTitle: string;
  suggestedProjectId?: string;
  suggestedProjectTitle?: string;
  priority: 'high' | 'medium' | 'low';
  energyLevel: 'high' | 'medium' | 'low';
  estimatedMinutes?: number;
  category?: string;
  reasoning: string;
}

/**
 * Analyze an inbox item with AI and recommend destination (Task, Project, Vault, Habit)
 */
export async function analyzeInboxItemWithAi(
  item: { title: string; content?: string; url?: string },
  context: { pillars: Array<{ id: string; title: string }>; projects: Array<{ id: string; title: string; goal_id?: string }> }
): Promise<AiInboxAnalysisResult> {
  const res = await fetch('/api/ai/analyze-inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: item.title,
      content: item.content || '',
      url: item.url || '',
      pillars: context.pillars,
      projects: context.projects,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل تحليل عنصر صندوق الوارد بالذكاء الاصطناعي');
  }

  const json = await res.json();
  return json.data;
}

export interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date: string;
  hijri?: string;
  hijriMonthArabic?: string;
  isFallback?: boolean;
}

/**
 * Fetch 5 daily prayer times from backend
 */
export async function fetchPrayerTimes(coords?: { lat: number; lng: number }): Promise<PrayerTimesData> {
  const params = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
  const res = await fetch(`/api/prayer-times${params}`);
  if (!res.ok) {
    throw new Error('فشل جلب مواقيت الصلاة');
  }
  const json = await res.json();
  return json.data;
}
