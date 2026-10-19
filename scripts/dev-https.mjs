// Encrypted (HTTPS) local dev server — self-healing launcher.
//
// Why this script exists:
//   Next.js allows ONE dev server per project (it keeps a lock in
//   .next/dev/lock). If a plain `next dev` from an earlier session is still
//   alive on the chosen port, a new HTTPS server would either fail to take
//   the lock or silently fall back to another port, leaving the UNPROTECTED
//   HTTP server in front of you. This script detects and stops any stale
//   dev server for THIS project before starting the encrypted one, so the
//   URL you open is always https://... with HSTS/COOP enabled.
//
// Usage: npm run dev:https [-- --port 3443]
// Default port: 8443 (https-alt convention — 3000 stays reserved for the
// plain-HTTP server so the two can never be confused).
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const extra = process.argv.slice(2);
const lockPath = path.join(root, ".next", "dev", "lock");
const keyPath = path.join(root, "certs", "localhost.key");
const certPath = path.join(root, "certs", "localhost.crt");

/** Port the user asked for, falling back to 8443 (encrypted-server default). */
function requestedPort() {
  for (let i = 0; i < extra.length; i += 1) {
    const arg = extra[i];
    if ((arg === "--port" || arg === "-p") && extra[i + 1]) return Number(extra[i + 1]);
    const m = /^--port=(\d+)$/.exec(arg);
    if (m) return Number(m[1]);
  }
  return Number(process.env.PORT ?? 8443);
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

function commandOf(pid) {
  try {
    if (isWin) {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      return out.trim();
    }
    return execSync(`ps -p ${pid} -o command=`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function pidsOnPort(port) {
  const pids = new Set();
  try {
    if (isWin) {
      const out = execSync("netstat -ano -p TCP", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      for (const line of out.split(/\r?\n/)) {
        const m = line.trim().match(/^TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)$/i);
        if (m && Number(m[1]) === port) pids.add(Number(m[2]));
      }
    } else {
      const out = execSync(`lsof -ti :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      for (const pid of out.split(/\s+/)) if (pid) pids.add(Number(pid));
    }
  } catch {
    /* port free or tooling unavailable */
  }
  return [...pids].filter((pid) => Number.isInteger(pid) && pid > 1);
}

function killTree(pid) {
  try {
    if (isWin) execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    else process.kill(pid, "SIGKILL");
    return true;
  } catch {
    return false;
  }
}

/** A process is ours when its command line mentions next AND this project. */
function isOurDevServer(cmd) {
  if (!cmd) return false;
  const lower = cmd.toLowerCase();
  return lower.includes("next") && (cmd.includes(root) || lower.includes("budi portfolio"));
}

function stopStaleServers(port) {
  let stopped = false;

  // 1) The lock is authoritative: it names the dev server holding the project.
  if (existsSync(lockPath)) {
    try {
      const info = JSON.parse(readFileSync(lockPath, "utf8"));
      const pid = Number(info.pid);
      if (Number.isInteger(pid) && pid > 1 && pidAlive(pid)) {
        // Verify identity before killing: a recycled PID must never take an
        // unrelated process down with it.
        if (isOurDevServer(commandOf(pid))) {
          const where = info.appUrl ? ` at ${info.appUrl}` : "";
          console.warn(
            `[dev:https] stopping previous dev server (PID ${pid}${where}) — one server per project, and the encrypted one must own the port.`,
          );
          killTree(pid);
          stopped = true;
        } else {
          console.warn(
            `[dev:https] lock points at PID ${pid}, which is not this project's dev server — removing only the lock.`,
          );
        }
      } else {
        console.warn("[dev:https] removing stale dev lock (its process is gone).");
      }
      try {
        unlinkSync(lockPath);
      } catch {
        /* already gone / locked */
      }
    } catch {
      try {
        unlinkSync(lockPath);
      } catch {
        /* ignore */
      }
    }
  }

  // 2) Fallback: anything still LISTENING on our port.
  for (const pid of pidsOnPort(port)) {
    const cmd = commandOf(pid);
    if (!isOurDevServer(cmd)) {
      console.error(
        `[dev:https] port ${port} is used by an unrelated process (PID ${pid}). Stop it first, or pick another port: npm run dev:https -- --port 3443`,
      );
      process.exit(1);
    }
    console.warn(`[dev:https] stopping stale dev server on port ${port} (PID ${pid}).`);
    killTree(pid);
    stopped = true;
  }

  if (stopped) {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && pidsOnPort(port).length > 0) {
      try {
        execSync(isWin ? "ping -n 1 127.0.0.1 >NUL" : "sleep 0.2", { stdio: "ignore" });
      } catch {
        /* busy-wait tick */
      }
    }
  }
}

/** Generate the certificate if it's missing so the secure server never starts naked. */
function ensureCert() {
  if (existsSync(keyPath) && existsSync(certPath)) return;
  console.warn("[dev:https] certificate missing — generating it now…");
  if (isWin) {
    execSync("powershell -ExecutionPolicy Bypass -File scripts/gen-cert.ps1", {
      stdio: "inherit",
      cwd: root,
    });
    return;
  }
  const ips = new Set(["127.0.0.1"]);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const addr of list ?? []) {
      if (addr.family === "IPv4" && !addr.internal) ips.add(addr.address);
    }
  }
  const cnf = [
    "[req]",
    "default_bits = 2048",
    "prompt = no",
    "default_md = sha256",
    "distinguished_name = dn",
    "x509_extensions = v3_req",
    "[dn]",
    "CN = localhost",
    "[v3_req]",
    "subjectAltName = @alt_names",
    "keyUsage = critical, digitalSignature, keyEncipherment",
    "extendedKeyUsage = serverAuth",
    "[alt_names]",
    "DNS.1 = localhost",
    ...([...ips].map((ip, i) => `IP.${i + 1} = ${ip}`)),
    "",
  ].join("\n");
  const cnfPath = path.join(root, "certs", "openssl.cnf");
  mkdirSync(path.dirname(cnfPath), { recursive: true });
  writeFileSync(cnfPath, cnf, "utf8");
  execSync(
    `openssl req -x509 -nodes -days 825 -newkey rsa:2048 -keyout certs/localhost.key -out certs/localhost.crt -config "${cnfPath}"`,
    { stdio: "inherit", cwd: root },
  );
}

ensureCert();

const port = requestedPort();
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error(`[dev:https] invalid port "${port}" — pass --port <1-65535>.`);
  process.exit(1);
}
stopStaleServers(port);

console.warn(
  `[dev:https] starting encrypted server — https://localhost:${port}/ (certificate + live security report: /security)`,
);

// The port fallback only exists in THIS script, so inject --port when the
// caller didn't name one — otherwise Next would ignore it and serve :3000.
const explicitPort = extra.some((a) => a === "--port" || a === "-p" || a.startsWith("--port="));

// Spawn Next straight from the local install with an argv array — no shell
// string is ever built, so nothing in `extra` can be interpreted as a
// command (`npx` would require a shell on Windows; this avoids it entirely).
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  console.error("[dev:https] Next.js is not installed — run `npm install` first.");
  process.exit(1);
}
const args = [
  nextBin,
  "dev",
  "--experimental-https",
  "--experimental-https-key",
  "./certs/localhost.key",
  "--experimental-https-cert",
  "./certs/localhost.crt",
];
if (!explicitPort && !process.env.PORT) args.push("--port", String(port));
args.push(...extra);

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  cwd: root,
  // PORT is exported so the running server (and /api/security/status's
  // probe-port allowlist) knows this custom port is legitimate.
  env: { ...process.env, FORCE_HTTPS: "1", PORT: String(port) },
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
