import "./_env";
import { describe, it } from "node:test";
import assert from "node:assert";
import { AuthError, authorize, cacheSalt, issueToken, verifyToken } from "../apps/api/src/services/security/tokens";
import { GatewayError, TenantLimiter } from "../apps/api/src/services/gateway/gateway-core";

describe("capability tokens", () => {
  it("round-trips and carries tenant, scope and a short expiry", () => {
    const { token, claims } = issueToken({ evaluationId: "e1", tenant: "red", ttlSeconds: 60 });
    const v = verifyToken(`Bearer ${token}`);
    assert.strictEqual(v.tenant, "red");
    assert.strictEqual(v.exp - v.iat, 60);
    assert.strictEqual(v.jti, claims.jti);
  });

  it("caps the TTL at one hour", () => {
    const { claims } = issueToken({ evaluationId: "e1", tenant: "red", ttlSeconds: 999999 });
    assert.ok(claims.exp - claims.iat <= 3600);
  });

  it("rejects forged signatures, tampered payloads and expired tokens with 401", () => {
    const { token } = issueToken({ evaluationId: "e1", tenant: "red" });
    const [p, s] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url").toString()), tenant: "admin" })).toString("base64url");
    for (const bad of [`${p}.${s.slice(0, -2)}xx`, `${forgedPayload}.${s}`, "garbage"]) {
      assert.throws(() => verifyToken(bad), (e: unknown) => e instanceof AuthError && e.statusCode === 401);
    }
    const old = issueToken({ evaluationId: "e1", tenant: "red", now: 1000, ttlSeconds: 10 }).token;
    assert.throws(() => verifyToken(old), /expired/);
  });

  it("a token signed with another secret is rejected", () => {
    const other = issueToken({ evaluationId: "e1", tenant: "red", secret: "some-other-secret-0123456789" }).token;
    assert.throws(() => verifyToken(other), /signature/);
  });

  it("cannot be issued with capabilities beyond the tenant's role", () => {
    const { claims } = issueToken({ evaluationId: "e1", tenant: "red", capabilities: ["defense:read", "admin:full", "model.inference"] });
    assert.deepStrictEqual(claims.capabilities, ["model.inference"]);
  });

  it("scopes by tenant: red cannot reach defence resources, blue cannot reach payloads", () => {
    const red = issueToken({ evaluationId: "e", tenant: "red" }).claims;
    const blue = issueToken({ evaluationId: "e", tenant: "blue" }).claims;
    assert.throws(() => authorize(red, "defense:read", "defense/blue/config"), (e: unknown) => e instanceof AuthError && e.statusCode === 403);
    assert.throws(() => authorize(blue, "payloads:read", "payloads/red/corpus"), (e: unknown) => e instanceof AuthError && e.statusCode === 403);
    assert.doesNotThrow(() => authorize(red, "payloads:read", "payloads/red/corpus"));
    assert.doesNotThrow(() => authorize(blue, "defense:read", "defense/blue/config"));
  });

  it("a capability alone is not enough: the resource must also be in scope", () => {
    const red = { ...issueToken({ evaluationId: "e", tenant: "red" }).claims, capabilities: ["defense:read" as const] };
    assert.throws(() => authorize(red, "defense:read", "defense/blue/config"), /no access to resource/);
  });
});

describe("per-tenant cache salt", () => {
  it("is stable for the same tenant and evaluation", () => {
    assert.strictEqual(cacheSalt("red", "eval-1"), cacheSalt("red", "eval-1"));
  });
  it("differs across tenants and across evaluations", () => {
    assert.notStrictEqual(cacheSalt("red", "eval-1"), cacheSalt("blue", "eval-1"));
    assert.notStrictEqual(cacheSalt("red", "eval-1"), cacheSalt("red", "eval-2"));
  });
  it("depends on the secret", () => {
    assert.notStrictEqual(cacheSalt("red", "e", "secret-one-0123456789"), cacheSalt("red", "e", "secret-two-0123456789"));
  });
});

describe("rate limit and concurrency cap", () => {
  it("returns 429 with Retry-After once the window is full", () => {
    const l = new TenantLimiter(2, 60000, 10);
    l.acquire("red", 1000)();
    l.acquire("red", 1001)();
    assert.throws(() => l.acquire("red", 1002), (e: unknown) => e instanceof GatewayError && e.statusCode === 429 && "Retry-After" in e.headers);
    assert.doesNotThrow(() => l.acquire("blue", 1002)()); // other tenants are unaffected
    assert.doesNotThrow(() => l.acquire("red", 62000)()); // window slides
  });

  it("caps in-flight requests per tenant until released", () => {
    const l = new TenantLimiter(100, 60000, 1);
    const release = l.acquire("red", 1);
    assert.throws(() => l.acquire("red", 2), (e: unknown) => e instanceof GatewayError && e.statusCode === 429);
    release();
    assert.doesNotThrow(() => l.acquire("red", 3)());
  });
});
