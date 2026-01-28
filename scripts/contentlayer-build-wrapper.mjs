#!/usr/bin/env node
// Wrapper para executar `contentlayer build` ignorando o TypeError inócuo do Clipanion
// que ocorre em algumas combinações (Windows + Node 20 + contentlayer 0.3.x).
// Mantém exit code original (propaga !=0) e limpa o ruído quando exit=0.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const isWin = process.platform === 'win32';
const forceBuild = process.env.FORCE_CONTENTLAYER_BUILD === '1' || process.env.FORCE_CONTENTLAYER_BUILD === 'true';
const generatedDir = resolve(process.cwd(), '.contentlayer', 'generated');

// Contentlayer pode ser instável no Windows (especialmente em algumas combinações de Node).
// Para não travar o build local, se já houver artefatos gerados, reaproveitamos por padrão.
if (isWin && !forceBuild && existsSync(generatedDir)) {
 process.stdout.write(
 '[contentlayer-wrapper] Windows detectado: usando .contentlayer/generated existente (pulando contentlayer build).\n'
 );
 process.stdout.write(
 '[contentlayer-wrapper] Para forçar, rode com FORCE_CONTENTLAYER_BUILD=1.\n'
 );
 process.exit(0);
}

const npxCmd = isWin ? 'npx.cmd' : 'npx';
const args = ['contentlayer', 'build'];

let stdoutBuf = '';
let stderrBuf = '';

let child;
try {
 // Em Windows algumas vezes spawn sem `shell` causa EINVAL; habilitamos shell apenas no win32
 child = spawn(npxCmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
} catch (err) {
 console.error('[contentlayer-wrapper] spawn failed:', err && err.message ? err.message : err);
 process.exit(1);
}

if (child.stdout) {
 child.stdout.on('data', (d) => {
 const text = d.toString();
 stdoutBuf += text;
 process.stdout.write(text); // fluxo normal
 });
}
if (child.stderr) {
 child.stderr.on('data', (d) => {
 const text = d.toString();
 stderrBuf += text;
 process.stderr.write(text); // fluxo normal
 });
}

child.on('close', (code) => {
 // Assinatura conhecida do bug
 const signature = 'TypeError: The "code" argument must be of type number. Received an instance of Object';
 const hasSignature = (stdoutBuf + stderrBuf).includes(signature);
 
 // Se o build gerou conteúdo e encontramos o erro conhecido, consideramos sucesso
 const contentGenerated = stdoutBuf.includes('Generated') || stdoutBuf.includes('.contentlayer');
 
 if (hasSignature && contentGenerated) {
 // Suprimir stack redundante, mas registrar nota resumida
 process.stdout.write('\n[contentlayer-wrapper] Aviso suprimido: bug conhecido (Clipanion exitCode). Build OK.\n');
 return process.exit(0);
 }
 
 process.exit(code ?? 0);
});
