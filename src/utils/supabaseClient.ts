import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Helper to determine if a string is a valid HTTP/HTTPS URL
function isValidHttpUrl(urlString: string): boolean {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !urlString.includes('placeholder') &&
      !urlString.includes('YOUR_') &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

// Auto-detect if URL and Key were accidentally inverted in the environment
let resolvedUrl = rawUrl;
let resolvedKey = rawKey;

if (
  !isValidHttpUrl(resolvedUrl) &&
  isValidHttpUrl(resolvedKey)
) {
  // rawKey is actually the URL, and rawUrl is the key
  resolvedUrl = rawKey;
  resolvedKey = rawUrl;
}

let clientInstance: SupabaseClient | null = null;
let isConfigured = false;

if (isValidHttpUrl(resolvedUrl) && resolvedKey && !resolvedKey.includes('placeholder')) {
  try {
    clientInstance = createClient(resolvedUrl, resolvedKey);
    isConfigured = true;
  } catch (err) {
    console.warn('Failed to initialize Supabase client safely:', err);
    clientInstance = null;
    isConfigured = false;
  }
}

export const supabaseUrl = resolvedUrl;
export const supabaseAnonKey = resolvedKey;
export const isSupabaseConfigured = isConfigured;
export const supabase = clientInstance;
