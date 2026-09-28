import { supabase } from '../../../shared/services/supabaseClient';
import { aiCommandPlanSchema, type AiCommandContextItem, type AiCommandPlan } from './schema';

async function headers() {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error('سجّل الدخول لاستخدام المساعد الذكي.');
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
}

export async function proposeAiCommands(text: string, context: AiCommandContextItem[], clarificationAnswer?: string): Promise<AiCommandPlan> {
  const response = await fetch('/api/ai/analyze-text', {
    method: 'POST', headers: await headers(), body: JSON.stringify({ commandMode: true, text, context, clarificationAnswer, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, today: new Date().toISOString() }),
  });
  const body = await response.json() as { data?: unknown; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || 'تعذر تحليل الأمر.');
  const parsed = aiCommandPlanSchema.safeParse(body.data);
  if (!parsed.success) throw new Error('عاد المساعد بخطة غير صالحة للتنفيذ.');
  return parsed.data;
}
