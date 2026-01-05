#!/usr/bin/env node

const { spawnSync } = require("child_process");
const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const REPORTS_DIR = join(process.cwd(), "reports");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const REPORT_FILE = join(REPORTS_DIR, `preflight-${TIMESTAMP}.json`);

const COMMANDS = [];

// Core order required by release preflight
COMMANDS.push({ label: 'npm ci', command: 'npm ci' });

// Run contentlayer build if the project uses Contentlayer
const { existsSync } = require('node:fs');
if (existsSync('contentlayer.config.ts') || existsSync('contentlayer.config.js')) {
  COMMANDS.push({ label: 'npx contentlayer build', command: 'npx contentlayer build' });
}

COMMANDS.push({ label: 'npm run check:all', command: 'npm run check:all' });
COMMANDS.push({ label: 'npm run seo:audit', command: 'npm run seo:audit' });
COMMANDS.push({ label: 'npm run build', command: 'npm run build' });

const results = [];
let hasFailure = false;

mkdirSync(REPORTS_DIR, { recursive: true });

console.log(`Running local preflight (${new Date().toISOString()})`);

for (const { label, command } of COMMANDS) {
  console.log(`\n⏱ [RUNNING] ${label}`);
  const start = Date.now();
  const { status, error, stdout, stderr } = spawnSync(command, {
    shell: true,
    stdio: "pipe",
    env: process.env,
  });
  const durationMs = Date.now() - start;
  const success = status === 0 && !error;
  console.log(
    `✅ [${success ? "OK" : "FAIL"}] ${label} (${(durationMs / 1000).toFixed(1)}s, exit=${status ?? "?"})`
  );
  if (!success) {
    hasFailure = true;
    if (stderr) {
      process.stderr.write(stderr);
    }
    if (error) {
      console.error(error.message);
    }
    results.push({
      label,
      command,
      status: "FAIL",
      exitCode: status,
      durationMs,
      stdout: stdout ? stdout.toString("utf8").slice(0, 4096) : undefined,
      stderr: stderr ? stderr.toString("utf8").slice(0, 4096) : undefined,
    });
    break;
  }

  results.push({
    label,
    command,
    status: "OK",
    exitCode: status,
    durationMs,
    stdout: stdout ? stdout.toString("utf8").slice(0, 4096) : undefined,
    stderr: stderr ? stderr.toString("utf8").slice(0, 4096) : undefined,
  });
}

const summary = {
  timestamp: new Date().toISOString(),
  platform: process.platform,
  success: !hasFailure && results.every((entry) => entry.status === "OK"),
  results,
};

writeFileSync(REPORT_FILE, JSON.stringify(summary, null, 2), "utf8");

console.log(`\n✅ Preflight finished. Report saved to ${REPORT_FILE}`);
if (!summary.success) {
  console.warn("⚠️  One or more commands failed. Check the report for details.");
  process.exit(1);
}
