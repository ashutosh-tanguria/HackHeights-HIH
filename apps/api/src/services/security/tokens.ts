import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { env } from "../../config/env";

export type Tenant = "red" | "blue" | "admin";

export type Capability =
  | "model.inference"
  | "payloads:read"
  | "defense:read"
  | "defense:configure"
  | "evaluations:read"
  | "audit:read-redacted"
  | "admin:full";

/** What each tenant may hold. A token can carry a subset, never more. */
export const ROLE_CAPABILITIES: Record<Tenant, Capability[]> = {
  red: ["model.inference", "payloads:read", "evaluations:read", "audit:read-redacted"],
  blue: ["model.inference", "defense:read", "defense:configure", "evaluations:read", "audit:read-redacted"],
  admin: ["model.inference", "payloads:read", "defense:read", "defense:configure", "evaluations:read", "audit:read-redacted", "admin:full"],
};

/** Resource prefixes each tenant may touch. Red has no `defense/*`, Blue has no `payloads/*`. */
export const ROLE_SCOPE: Record<Tenant, string[]> = {
  red: ["gateway/inference", "payloads/red", "audit/redacted", "evaluations"],
  blue: ["gateway/inference", "defense/blue", "audit/redacted", "evaluations"],
  admin: ["gateway/inference", "payloads", "defense", "audit", "evaluations", "admin"],
};

export interface TokenClaims {
  v: 1;
  jti: string;
  evaluationId: string;
  tenant: Tenant;
  capabilities: Capability[];
  scope: string[];
  /** Orchestrator-set: whether the gateway applies the Blue defence for this token's requests. */
  blue: boolean;
  iat: number;
  exp: number;
}

export class AuthError extends Error {
  constructor(public statusCode: 401 | 403, message: string) {
    super(message);
  }
}

function sign(payload: string, secret = env.TOKEN_SECRET): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueToken(opts: {
  evaluationId: string;
  tenant: Tenant;
  ttlSeconds?: number;
  capabilities?: Capability[];
  blue?: boolean;
  now?: number;
  secret?: string;
}): { token: string; claims: TokenClaims } {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const ttl = Math.min(Math.max(1, opts.ttlSeconds ?? env.TOKEN_TTL_SECONDS), env.TOKEN_MAX_TTL_SECONDS);
  const allowed = ROLE_CAPABILITIES[opts.tenant];
  const caps = (opts.capabilities ?? allowed).filter((c) => allowed.includes(c));
  const claims: TokenClaims = {
    v: 1,
    jti: randomBytes(8).toString("hex"),
    evaluationId: opts.evaluationId,
    tenant: opts.tenant,
    capabilities: caps,
    scope: ROLE_SCOPE[opts.tenant],
    blue: opts.blue ?? false,
    iat: now,
    exp: now + ttl,
  };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { token: `${body}.${sign(body, opts.secret)}`, claims };
}

export function verifyToken(header: string | undefined, opts: { now?: number; secret?: string } = {}): TokenClaims {
  if (!header) throw new AuthError(401, "Missing capability token");
  const raw = header.replace(/^Bearer\s+/i, "").trim();
  const parts = raw.split(".");
  if (parts.length !== 2) throw new AuthError(401, "Malformed capability token");
  const expected = Buffer.from(sign(parts[0], opts.secret));
  const given = Buffer.from(parts[1]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw new AuthError(401, "Invalid token signature");
  let claims: TokenClaims;
  try {
    claims = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    throw new AuthError(401, "Invalid token payload");
  }
  if (claims.v !== 1 || !claims.tenant || !ROLE_CAPABILITIES[claims.tenant]) throw new AuthError(401, "Unsupported token");
  if (claims.exp < (opts.now ?? Math.floor(Date.now() / 1000))) throw new AuthError(401, "Capability token expired");
  return claims;
}

/** Capability AND resource must both be granted by the signed claims. */
export function authorize(claims: TokenClaims, capability: Capability, resource: string): void {
  if (!claims.capabilities.includes(capability)) {
    throw new AuthError(403, `Tenant '${claims.tenant}' lacks capability '${capability}'`);
  }
  const inScope = claims.scope.some((s) => resource === s || resource.startsWith(`${s}/`));
  if (!inScope) throw new AuthError(403, `Tenant '${claims.tenant}' has no access to resource '${resource}'`);
}

export function isAdminKey(provided: string | undefined, key = env.ADMIN_KEY): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Stable per-tenant, per-evaluation cache salt. Same inputs always give the same salt; tenants never share one. */
export function cacheSalt(tenant: string, evaluationId: string, secret = env.TOKEN_SECRET): string {
  return createHmac("sha256", secret).update(`cache-salt:${tenant}:${evaluationId}`).digest("hex").slice(0, 32);
}
