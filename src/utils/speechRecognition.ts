/**
 * Speech Recognition and Audio Capture Utility for Dawenli
 * Solves voice repetition / stutter issues and connects to Gemini AI
 */

// Comprehensive Arabic & General Speech De-duplicator
export function deduplicateArabicSpeech(rawText: string): string {
  if (!rawText) return '';
  let str = rawText.trim().replace(/\s+/g, ' ');

  // 1. Resolve progressive interim-speech accumulation bug
  // (e.g. "عايز عايز اعمل عايز اعمل موقع... عايز اعمل موقع الكتروني...")
  const words = str.split(' ');
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

  let text = str;

  // 2. Remove immediate consecutive word duplicates ("عايز عايز" -> "عايز")
  text = text.replace(/(\b\S+\b)(?:\s+\1)+/gi, '$1');

  // 3. Remove repeating multi-word phrases up to 10 words
  // e.g. "عايز اعمل موقع عايز اعمل موقع" -> "عايز اعمل موقع"
  for (let phraseLen = 10; phraseLen >= 2; phraseLen--) {
    const pattern = new RegExp(`(\\b(?:\\S+\\s+){${phraseLen - 1}}\\S+\\b)(?:\\s+\\1)+`, 'gi');
    text = text.replace(pattern, '$1');
  }

  // 4. Handle remaining cumulative prefix stutter
  const cleanedTokens = text.split(' ');
  if (cleanedTokens.length > 3) {
    const finalWords: string[] = [];
    let i = 0;
    while (i < cleanedTokens.length) {
      finalWords.push(cleanedTokens[i]);
      let matchedRepeat = false;
      for (let len = Math.min(8, finalWords.length); len >= 2; len--) {
        const lastChunk = finalWords.slice(-len).join(' ');
        const nextChunk = cleanedTokens.slice(i + 1, i + 1 + len).join(' ');
        if (lastChunk === nextChunk) {
          i += len;
          matchedRepeat = true;
          break;
        }
      }
      if (!matchedRepeat) {
        i++;
      }
    }
    text = finalWords.join(' ');
  }

  return text.trim();
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
 * Call Server-Side Gemini to analyze and decompose spoken text
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
