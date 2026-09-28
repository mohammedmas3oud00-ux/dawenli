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
    const response = await request(app)
      .post('/api/ai/analyze-text')
      .set('content-type', 'application/json')
      .send({ text: 'x'.repeat(4_700_000) });
    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('requires an authenticated session for worship insights', async () => {
    const response = await request(app)
      .post('/api/ai/worship-insight')
      .send({ metrics: { completed: 1, total: 2 } });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });

  it('keeps push subscription routes behind authentication', async () => {
    const getResponse = await request(app)
      .get('/api/push/subscription')
      .query({ endpoint: 'https://push.example.test/subscription' });
    const postResponse = await request(app).post('/api/push/subscription').send({ subscription: {} });
    const deleteResponse = await request(app)
      .delete('/api/push/subscription')
      .send({ endpoint: 'https://push.example.test/subscription' });

    expect(getResponse.status).toBe(401);
    expect(postResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
    expect(getResponse.body).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
  });

  it('returns a safe configuration response for the public push key route', async () => {
    const response = await request(app).get('/api/push/public-key');
    expect([200, 503]).toContain(response.status);
    expect(response.body.ok).toBe(response.status === 200);
    if (response.status === 503) expect(response.body.error.code).toBe('NOT_CONFIGURED');
    if (response.status === 200) expect(response.body.data.publicKey).toBeTruthy();
  });

  it('rejects unauthenticated Google integration access', async () => {
    const status = await request(app).get('/api/integrations/google/status');
    const disconnect = await request(app).delete('/api/integrations/google/disconnect');
    expect(status.status).toBe(401);
    expect(disconnect.status).toBe(401);
  });
});
