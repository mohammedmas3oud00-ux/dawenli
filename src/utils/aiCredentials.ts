import { supabase } from './supabaseClient';

let configured = false;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error('سجّل الدخول لاستخدام ميزات Gemini.');
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  return new Error(body?.error?.message || fallback);
}

export function hasStoredGeminiCredential(): boolean {
  return configured;
}

export async function refreshGeminiCredentialStatus(): Promise<boolean> {
  const response = await fetch('/api/ai/credential', { headers: await authHeaders() });
  if (!response.ok) throw await readError(response, 'تعذر التحقق من إعداد Gemini.');
  const body = await response.json() as { data?: { configured?: boolean } };
  configured = Boolean(body.data?.configured);
  return configured;
}

export async function saveGeminiCredential(value: string): Promise<void> {
  const response = await fetch('/api/ai/credential', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ key: value }),
  });
  if (!response.ok) throw await readError(response, 'تعذر حفظ مفتاح Gemini.');
  configured = true;
}

export async function deleteGeminiCredential(): Promise<void> {
  const response = await fetch('/api/ai/credential', { method: 'DELETE', headers: await authHeaders() });
  if (!response.ok) throw await readError(response, 'تعذر حذف مفتاح Gemini.');
  configured = false;
}
