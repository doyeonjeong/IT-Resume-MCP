#!/usr/bin/env node
// Local smoke test: spawns the built MCP server, runs the JSON-RPC handshake,
// asks for the tool list, prints results, and exits non-zero on failure.
//
// Usage: node scripts/smoke.mjs
//        npm run smoke
//
// This proves "the server starts, registers tools, and speaks MCP correctly"
// before you invest time wiring it into an IDE or publishing to npm.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '..');
const serverPath = resolve(repoRoot, 'dist/mcp-server.js');

if (!existsSync(serverPath)) {
  console.error(`✗ Build artifact missing: ${serverPath}`);
  console.error('  Run `npm run build` first.');
  process.exit(1);
}

// Use an isolated profile so the smoke test never reads the real ~/.resume-mcp/profile.json
const tmp = mkdtempSync(join(tmpdir(), 'resume-mcp-smoke-'));
const profilePath = join(tmp, 'profile.json');
const examplePath = resolve(repoRoot, 'data/profile.example.json');

// Pre-populate the temp profile so get_profile doesn't bootstrap from the example
// (we just want to confirm the server is reachable; we don't call cloud LLMs here).
writeFileSync(profilePath, '{"name":"Smoke","title":"Test","summary":"","skills":[],"projects":[]}');

const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    RESUME_MCP_PROFILE_PATH: profilePath,
    RESUME_MCP_EXAMPLE_PATH: examplePath,
    LLM_PROVIDER: 'gemini',
    GOOGLE_API_KEY: 'smoke-test-no-real-call',
  },
});

let stdoutBuf = '';
let stderrBuf = '';
const responses = [];
child.stdout.on('data', (chunk) => {
  stdoutBuf += chunk.toString();
  let nl;
  while ((nl = stdoutBuf.indexOf('\n')) >= 0) {
    const line = stdoutBuf.slice(0, nl).trim();
    stdoutBuf = stdoutBuf.slice(nl + 1);
    if (!line) continue;
    try {
      responses.push(JSON.parse(line));
    } catch {
      // Non-JSON output on stdout is unexpected; capture for diagnostics.
      stderrBuf += `[stdout-noise] ${line}\n`;
    }
  }
});
child.stderr.on('data', (chunk) => {
  stderrBuf += chunk.toString();
});

const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n');

// MCP handshake
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'resume-mcp-smoke', version: '0.0.0' },
  },
});
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

const TIMEOUT_MS = 8000;
const timer = setTimeout(() => {
  finalize('timeout');
}, TIMEOUT_MS);

function finalize(reason) {
  clearTimeout(timer);
  child.kill();

  const init = responses.find((r) => r.id === 1);
  const list = responses.find((r) => r.id === 2);

  let ok = true;
  if (!init?.result) {
    console.error('✗ initialize: no response');
    ok = false;
  } else {
    console.log(`✓ initialize → ${init.result.serverInfo?.name ?? 'server'}`);
  }

  if (!list?.result?.tools?.length) {
    console.error('✗ tools/list: empty or missing');
    ok = false;
  } else {
    console.log(`✓ tools/list → ${list.result.tools.length} tools:`);
    list.result.tools.forEach((t) => console.log(`    • ${t.name}`));
  }

  if (!ok) {
    console.error('\n--- server stderr ---');
    console.error(stderrBuf || '(empty)');
    console.error('---------------------');
    process.exit(1);
  }

  console.log('\n✓ smoke test passed');
  process.exit(0);
}

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`✗ server exited with code ${code} before responding`);
    finalize('early-exit');
  }
});

// Give the server time to print all responses, then finalize.
setTimeout(() => finalize('done'), 4000);
