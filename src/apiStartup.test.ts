// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import request from 'supertest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

it('keeps AI and Google routes available when VAPID configuration is invalid', async () => {
  vi.stubEnv('VAPID_PUBLIC_KEY', 'invalid=');
  vi.stubEnv('VAPID_PRIVATE_KEY', 'invalid=');
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const { app } = await import('../server');
  for (const route of ['/api/ai/credential', '/api/integrations/google/status']) {
    const response = await request(app).get(route);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  }
  const push = await request(app).get('/api/push/public-key');
  expect(push.status).toBe(503);
  expect(push.body.error.code).toBe('NOT_CONFIGURED');
});
