// @vitest-environment node
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('API contracts', () => {
  it('rejects unauthenticated AI calls with a structured 401', async () => {
    const response = await request(app).post('/api/ai/analyze-text').send({ text: 'hello' });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
    expect(response.body.error.requestId).toBeTruthy();
  });

  it('rejects invalid prayer coordinates with a structured 400', async () => {
    const response = await request(app).get('/api/prayer-times?lat=200&lng=20');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'BAD_REQUEST' } });
  });

  it('returns a structured 413 for oversized requests', async () => {
    const response = await request(app).post('/api/ai/analyze-text').set('content-type', 'application/json').send({ text: 'x'.repeat(4_700_000) });
    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('requires an authenticated session for worship insights', async () => {
    const response = await request(app).post('/api/ai/worship-insight').send({ metrics: { completed: 1, total: 2 } });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });
});
