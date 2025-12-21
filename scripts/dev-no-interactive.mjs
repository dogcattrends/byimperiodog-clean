#!/usr/bin/env node
import { spawnSync, spawn } from 'child_process';
import process from 'process';
import { fileURLToPath } from 'url';
import path from 'path';
import net from 'net';
import fs from 'fs/promises';

// Run predev (gen-client-photos) same way package.json does
const predevScript = fileURLToPath(new URL('./run-gen-client-photos.mjs', import.meta.url));
const predev = spawnSync(process.execPath, [predevScript], { stdio: 'inherit' });
if (predev.status !== 0) {
  // predev is non-fatal in original script, continue anyway
  console.warn('predev script exited with code', predev.status);
}

// Start next dev with stdin ignored to prevent interactive prompts
// Choose a free port (if PORT not set) to avoid conflicts and start Next detached
await (async function startNextDetached() {
  const portEnv = process.env.PORT;
  let port = portEnv;

  if (!port) {
    const server = net.createServer();
    await new Promise((resolve, reject) => server.listen(0, () => resolve()));
    const address = server.address();
    port = String(address && typeof address === 'object' ? address.port : 3000);
    server.close();
  }

  try {
    await fs.mkdir('.next', { recursive: true });
  } catch (e) {
    // ignore
  }

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev', '-p', port], {
    stdio: 'ignore',
    detached: true,
    env: Object.assign({}, process.env, {
      NEXT_DISABLE_VERSION_CHECK: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: port,
    }),
  });

  child.unref();
  console.log('Started Next detached on port', port);
  process.exit(0);
})();

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});

// Forward SIGINT/SIGTERM
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
