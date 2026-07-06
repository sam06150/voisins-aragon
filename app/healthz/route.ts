// Point de santé léger : répond 200 sans toucher à la base.
// Utilisé par le workflow "keep-awake" pour empêcher Render de s'endormir.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
