export default function health(_request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }) {
  response.status(200).json({ ok: true, data: { service: 'dawenli', status: 'healthy' } });
}
