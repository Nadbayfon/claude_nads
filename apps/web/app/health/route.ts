export const runtime = "edge";

export function GET() {
  return new Response(
    JSON.stringify({ ok: true, phase: 1, time: new Date().toISOString() }),
    { headers: { "content-type": "application/json" } },
  );
}
