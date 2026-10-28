import { createHmac, randomBytes } from "crypto";
import { TenantRole, CapabilityName, CapabilityService } from "./capability-service";

// Ephemeral fallback key if not set in environment (never a static production constant)
const RUNTIME_SECRET_KEY = process.env.BAYORA_TOKEN_SECRET || randomBytes(32).toString("hex");

export interface CapabilityToken {
  evaluationId: string;
  tenant: TenantRole;
  capabilities: CapabilityName[];
  issuedAt: number;
  expiresAt: number;
}

export class AuthorizationService {
  private static secretKey: string = RUNTIME_SECRET_KEY;

  public static getSecretKey(): string {
    return this.secretKey;
  }

  public static setSecretKey(key: string): void {
    this.secretKey = key;
  }

  public static issueToken(
    evaluationId: string,
    tenant: TenantRole,
    ttlSeconds: number = 3600,
    customCapabilities?: CapabilityName[]
  ): {
    token: string;
    expiresAt: number;
    tenant: TenantRole;
    evaluationId: string;
    capabilities: CapabilityName[];
  } {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + ttlSeconds;
    const capabilities = customCapabilities || CapabilityService.getAllowedCapabilities(tenant);

    const payload: CapabilityToken = {
      evaluationId,
      tenant,
      capabilities,
      issuedAt: now,
      expiresAt,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", this.secretKey).update(encodedPayload).digest("base64url");

    return {
      token: `${encodedPayload}.${signature}`,
      expiresAt,
      tenant,
      evaluationId,
      capabilities,
    };
  }

  public static verifyToken(tokenStr?: string): CapabilityToken {
    if (!tokenStr) {
      const err: any = new Error("Missing capability token in Authorization header");
      err.statusCode = 401;
      throw err;
    }

    const cleanToken = tokenStr.replace(/^Bearer\s+/i, "").trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 2) {
      const err: any = new Error("Malformed capability token format (expected payload.signature)");
      err.statusCode = 401;
      throw err;
    }

    const [encodedPayload, signature] = parts;
    const expectedSig = createHmac("sha256", this.secretKey).update(encodedPayload).digest("base64url");

    if (signature !== expectedSig) {
      const err: any = new Error("Invalid capability token signature");
      err.statusCode = 401;
      throw err;
    }

    let payload: CapabilityToken;
    try {
      payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as CapabilityToken;
    } catch {
      const err: any = new Error("Invalid token payload encoding");
      err.statusCode = 401;
      throw err;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      const err: any = new Error("Capability token has expired");
      err.statusCode = 401;
      throw err;
    }

    return payload;
  }
}
