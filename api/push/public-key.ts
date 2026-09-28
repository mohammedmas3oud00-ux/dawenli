type FunctionResponse = { status: (status: number) => FunctionResponse; json: (body: unknown) => void };

export default function publicKey(_request: unknown, response: FunctionResponse): void {
  const value = (process.env.VAPID_PUBLIC_KEY || '').trim();
  if (!value) {
    response.status(503).json({ ok: false, error: { code: 'NOT_CONFIGURED', message: 'إشعارات الخلفية غير مهيأة.' } });
    return;
  }
  response.status(200).json({ ok: true, data: { publicKey: value } });
}
