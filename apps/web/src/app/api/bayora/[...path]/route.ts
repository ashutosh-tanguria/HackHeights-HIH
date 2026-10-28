import { NextRequest } from "next/server";

// Server-side proxy: the browser never sees the admin key. Only /api/v1/* and /health are forwarded.
const API = process.env.BAYORA_API_URL ?? "http://localhost:4000";
const KEY = process.env.BAYORA_ADMIN_KEY ?? "";

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = "/" + path.join("/");
  if (!(target === "/health" || target.startsWith("/api/v1/"))) {
    return Response.json({ error: { code: 404, message: "Not proxied" } }, { status: 404 });
  }
  if (!KEY) {
    return Response.json({ error: { code: 500, message: "BAYORA_ADMIN_KEY is not set for the console. Run `pnpm setup` and restart." } }, { status: 500 });
  }
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  try {
    const r = await fetch(API + target + req.nextUrl.search, {
      method: req.method,
      headers: { "x-bayora-admin-key": KEY, "content-type": "application/json" },
      body: body && body.length ? body : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10 * 60 * 1000),
    });
    const headers = new Headers({ "content-type": r.headers.get("content-type") ?? "application/json" });
    const cd = r.headers.get("content-disposition");
    if (cd) headers.set("content-disposition", cd);
    return new Response(await r.arrayBuffer(), { status: r.status, headers });
  } catch (e) {
    return Response.json({ error: { code: 502, message: `Cannot reach the Bayora API at ${API}: ${(e as Error).message}` } }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const dynamic = "force-dynamic";
