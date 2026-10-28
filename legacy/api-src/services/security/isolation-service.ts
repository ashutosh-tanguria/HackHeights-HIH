import { execSync } from "child_process";
import { sqliteDb } from "../../repositories/sqlite-db";

export interface ProbeEvidence {
  id: string;
  name: string;
  container: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  status: "BLOCKED" | "ALLOWED";
  expectedStatus: "BLOCKED" | "ALLOWED";
  passed: boolean;
  timestamp: string;
  durationMs: number;
}

export interface ProbesRunResponse {
  status: "EXECUTED" | "UNAVAILABLE";
  reason?: string;
  timestamp: string;
  totalProbes: number;
  blockedCount: number;
  allowedCount: number;
  allPassed: boolean;
  probes: ProbeEvidence[];
}

export class IsolationService {
  private isDockerAvailable(): { available: boolean; reason?: string } {
    try {
      execSync("docker info --format '{{.ServerVersion}}'", {
        timeout: 3000,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err: any) {
      return {
        available: false,
        reason:
          "Docker daemon is not reachable or not running on this host. Container boundary probes require a live Docker runtime.",
      };
    }

    // Verify required sandbox containers are running
    try {
      const output = execSync('docker ps --format "{{.Names}}"', {
        timeout: 3000,
        encoding: "utf-8",
      });
      const names = output.split("\n").map((n) => n.trim());
      const hasRed = names.some((n) => n.includes("bayora-red-sandbox") || n === "red");
      const hasBlue = names.some((n) => n.includes("bayora-blue-sandbox") || n === "blue");

      if (!hasRed || !hasBlue) {
        return {
          available: false,
          reason: `Required sandbox containers (bayora-red-sandbox, bayora-blue-sandbox) are not active. Run 'docker compose up -d' first.`,
        };
      }
    } catch (err: any) {
      return {
        available: false,
        reason: `Failed to inspect running Docker containers: ${err.message}`,
      };
    }

    return { available: true };
  }

  public async runAllProbes(): Promise<ProbesRunResponse> {
    const dockerCheck = this.isDockerAvailable();
    const now = new Date().toISOString();

    if (!dockerCheck.available) {
      return {
        status: "UNAVAILABLE",
        reason: dockerCheck.reason,
        timestamp: now,
        totalProbes: 0,
        blockedCount: 0,
        allowedCount: 0,
        allPassed: false,
        probes: [],
      };
    }

    // Probe definitions to execute directly via docker exec
    const probeDefinitions = [
      {
        id: "probe-tcp-red-to-blue-name",
        name: "Red to Blue TCP connect by Service Name",
        container: "bayora-red-sandbox",
        command: "nc -zv -w 2 bayora-blue-sandbox 8080 2>&1 || wget -T 2 -q -O - http://bayora-blue-sandbox:8080 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-tcp-blue-to-red",
        name: "Blue to Red TCP connect",
        container: "bayora-blue-sandbox",
        command: "nc -zv -w 2 bayora-red-sandbox 8080 2>&1 || wget -T 2 -q -O - http://bayora-red-sandbox:8080 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-tcp-red-to-target-direct",
        name: "Red to Target direct TCP bypass (bypassing Gateway)",
        container: "bayora-red-sandbox",
        command: "wget -T 2 -q -O - http://bayora-target-model:11434/api/tags 2>&1 || nc -zv -w 2 bayora-target-model 11434 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-positive-control-gateway",
        name: "Positive Control: Red to Gateway authorized path",
        container: "bayora-red-sandbox",
        command: "wget -T 2 -q -O - http://bayora-gateway:4000/health 2>&1",
        expectedStatus: "ALLOWED" as const,
      },
      {
        id: "probe-dns-cross-tenant",
        name: "DNS resolution of Blue tenant from Red sandbox",
        container: "bayora-red-sandbox",
        command: "nslookup bayora-blue-sandbox 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-internet-egress",
        name: "Outbound Internet Egress from Sandbox",
        container: "bayora-red-sandbox",
        command: "wget -T 2 -q -O - http://1.1.1.1 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-cross-tenant-secret-mount",
        name: "Read Blue tenant secret volume from Red container",
        container: "bayora-red-sandbox",
        command: "cat /mnt/blue-secrets/defense-rules.key 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-rootfs-write",
        name: "Write to root filesystem (read_only verification)",
        container: "bayora-red-sandbox",
        command: "touch /etc/system-tamper.conf 2>&1",
        expectedStatus: "BLOCKED" as const,
      },
      {
        id: "probe-capability-check",
        name: "Linux capabilities dropped (CapEff == 0)",
        container: "bayora-red-sandbox",
        command: 'grep CapEff /proc/self/status | grep -v "0000000000000000" 2>&1',
        expectedStatus: "BLOCKED" as const, // non-zero CapEff is blocked/empty
      },
    ];

    const results: ProbeEvidence[] = [];

    for (const def of probeDefinitions) {
      const start = Date.now();
      let exitCode = 0;
      let stdout = "";
      let stderr = "";

      try {
        const fullCmd = `docker exec ${def.container} sh -c "${def.command}"`;
        stdout = execSync(fullCmd, {
          timeout: 4000,
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "pipe"],
        });
        exitCode = 0;
      } catch (err: any) {
        exitCode = err.status !== undefined ? err.status : 1;
        stdout = err.stdout ? err.stdout.toString() : "";
        stderr = err.stderr ? err.stderr.toString() : err.message;
      }

      const durationMs = Date.now() - start;
      const actualStatus: "BLOCKED" | "ALLOWED" = exitCode === 0 ? "ALLOWED" : "BLOCKED";
      const passed = actualStatus === def.expectedStatus;

      const evidence: ProbeEvidence = {
        id: def.id,
        name: def.name,
        container: def.container,
        command: def.command,
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        status: actualStatus,
        expectedStatus: def.expectedStatus,
        passed,
        timestamp: new Date().toISOString(),
        durationMs,
      };

      sqliteDb.saveProbeResult({
        id: evidence.id,
        command: evidence.command,
        exitCode: evidence.exitCode,
        blocked: evidence.status === "BLOCKED",
        outputLog: `stdout: ${evidence.stdout} | stderr: ${evidence.stderr}`,
        ts: evidence.timestamp,
      });

      results.push(evidence);
    }

    const blockedCount = results.filter((p) => p.status === "BLOCKED").length;
    const allowedCount = results.filter((p) => p.status === "ALLOWED").length;
    const allPassed = results.every((p) => p.passed);

    return {
      status: "EXECUTED",
      timestamp: now,
      totalProbes: results.length,
      blockedCount,
      allowedCount,
      allPassed,
      probes: results,
    };
  }

  public getLatestProbes(): {
    status: "RECORDED" | "UNAVAILABLE";
    message: string;
    probes: any[];
  } {
    const records = sqliteDb.getProbeResults();
    if (!records || records.length === 0) {
      return {
        status: "UNAVAILABLE",
        message:
          "No container probe execution records found in database. Run POST /api/v1/security/probes/run with running Docker containers to record live telemetry.",
        probes: [],
      };
    }

    return {
      status: "RECORDED",
      message: `${records.length} real container isolation probes recorded in audit storage.`,
      probes: records.map((r) => ({
        id: r.id,
        command: r.command,
        exitCode: r.exitCode,
        status: r.blocked ? "BLOCKED" : "ALLOWED",
        outputLog: r.outputLog,
        timestamp: r.ts,
      })),
    };
  }
}
