#!/usr/bin/env node
import { spawnSync, spawn } from 'child_process';
import process from 'process';

// Run predev (gen-client-photos) same way package.json does
const predev = spawnSync(process.execPath, [new URL('./run-gen-client-photos.mjs', import.meta.url).pathname], { stdio: 'inherit' });
if (predev.status !== 0) {
  // predev is non-fatal in original script, continue anyway
  console.warn('predev script exited with code', predev.status);
}

// Start next dev with stdin ignored to prevent interactive prompts
const cmd = `cross-env NEXT_DISABLE_VERSION_CHECK=1 NEXT_TELEMETRY_DISABLED=1 next dev -p 3000`;
const child = spawn(cmd, { shell: true, stdio: ['ignore', 'inherit', 'inherit'] });

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});

// Forward SIGINT/SIGTERM
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
