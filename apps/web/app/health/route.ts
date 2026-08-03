export const runtime = "edge";

export function GET() {
  return new Response(
    JSON.stringify({ ok: true, phase: 3, time: new Date().toISOString() }),
    { headers: { "content-type": "application/json" } },
  );
}
