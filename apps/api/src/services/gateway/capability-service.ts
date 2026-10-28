export type TenantRole = "red" | "blue" | "admin" | "anonymous";

export type CapabilityName =
  | "model.inference"
  | "payloads:read"
  | "defense:read"
  | "defense:configure"
  | "evaluations:run"
  | "evaluations:read"
  | "audit:verify"
  | "admin:reset"
  | "admin:full";

const ROLE_PERMISSIONS: Record<TenantRole, CapabilityName[]> = {
  red: [
    "model.inference",
    "payloads:read",
    "evaluations:run",
    "evaluations:read",
    "audit:verify",
  ],
  blue: [
    "model.inference",
    "defense:read",
    "defense:configure",
    "evaluations:read",
    "audit:verify",
  ],
  admin: [
    "model.inference",
    "payloads:read",
    "defense:read",
    "defense:configure",
    "evaluations:run",
    "evaluations:read",
    "audit:verify",
    "admin:reset",
    "admin:full",
  ],
  anonymous: [],
};

export class CapabilityService {
  public static hasCapability(role: TenantRole, capability: CapabilityName): boolean {
    const allowed = ROLE_PERMISSIONS[role] || [];
    return allowed.includes(capability);
  }

  public static getAllowedCapabilities(role: TenantRole): CapabilityName[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}
