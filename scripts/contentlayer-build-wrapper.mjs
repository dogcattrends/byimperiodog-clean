#!/usr/bin/env node
// Wrapper para executar `contentlayer build` ignorando o TypeError inócuo do Clipanion
// que ocorre em algumas combinações (Windows + Node 20 + contentlayer 0.3.x).
// Mantém exit code original (propaga !=0) e limpa o ruído quando exit=0.

import { spawn } from 'node:child_process';

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['contentlayer', 'build'];

let stdoutBuf = '';
let stderrBuf = '';

const child = spawn(npxCmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

child.stdout.on('data', (d) => {
  const text = d.toString();
  stdoutBuf += text;
  process.stdout.write(text); // fluxo normal
});
child.stderr.on('data', (d) => {
  const text = d.toString();
  stderrBuf += text;
  process.stderr.write(text); // fluxo normal
});

child.on('close', (code) => {
  // Assinatura conhecida do bug
  const signature = 'TypeError: The "code" argument must be of type number. Received an instance of Object';
  if (code === 0 && (stdoutBuf + stderrBuf).includes(signature)) {
    // Suprimir stack redundante, mas registrar nota resumida
    process.stdout.write('\n[contentlayer-wrapper] Aviso suprimido: bug conhecido (Clipanion exitCode). Build OK.\n');
    return process.exit(0);
  }
  process.exit(code ?? 0);
});
