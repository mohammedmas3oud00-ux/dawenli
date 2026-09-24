let geminiAuthorizationKey = '';

export function setGeminiAuthorizationKey(value: string): void {
  geminiAuthorizationKey = value.trim();
}

export function getGeminiAuthorizationKey(): string {
  return geminiAuthorizationKey;
}

export function clearGeminiAuthorizationKey(): void {
  geminiAuthorizationKey = '';
}
