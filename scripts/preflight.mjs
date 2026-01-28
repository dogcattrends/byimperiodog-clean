#!/usr/bin/env node

import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { once } from 'events';
import { setTimeout as delay } from 'timers/promises';
import { setTimeout as timerSetTimeout } from 'timers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const reportDir = join(repoRoot, 'reports');
const reportFile = join(reportDir, 'preflight-vercel.md');
const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
const scripts = packageJson.scripts ?? {};

const packageManager = detectPackageManager(repoRoot);
const scriptNames = new Set(Object.keys(scripts));

const requiredEnvChecks = [
 { label: 'NEXT_PUBLIC_SUPABASE_URL', keys: ['NEXT_PUBLIC_SUPABASE_URL'] },
 { label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', keys: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'] },
 { label: 'SUPABASE_SERVICE_ROLE_KEY', keys: ['SUPABASE_SERVICE_ROLE_KEY'] },
 { label: 'SANITY_PROJECT_ID', keys: ['NEXT_PUBLIC_SANITY_PROJECT_ID', 'SANITY_PROJECT_ID'] },
 { label: 'SANITY_DATASET', keys: ['NEXT_PUBLIC_SANITY_DATASET', 'SANITY_DATASET'] },
 { label: 'SANITY_API_VERSION', keys: ['SANITY_API_VERSION'] },
];

// Load .env.local and .env into process.env (non-destructive)
async function loadEnvFiles() {
 for (const fname of ['.env.local', '.env']) {
 const p = join(repoRoot, fname);
 try {
 const txt = await readFile(p, 'utf8');
 for (const line of txt.split(/\r?\n/)) {
 const trimmed = line.trim();
 if (!trimmed || trimmed.startsWith('#')) continue;
 const idx = trimmed.indexOf('=');
 if (idx <= 0) continue;
 let key = trimmed.slice(0, idx).trim();
 let val = trimmed.slice(idx + 1).trim();
 if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
 val = val.slice(1, -1);
 }
 if (!process.env[key]) process.env[key] = val;
 }
 console.log('Loaded env from', fname);
 } catch (e) {
 // ignore missing
 }
 }
}

const stageResults = [];

async function main() {
 await mkdir(reportDir, { recursive: true });

 await loadEnvFiles();
 const envStage = runEnvValidationStage();
 stageResults.push(envStage);
 const openAiStage = runOpenAiStage();
 if (openAiStage) {
 stageResults.push(openAiStage);
 }
 if (envStage.status === 'FAIL') {
 return finalizeReportAndExit('NO-GO');
 }

 const commandStages = buildCommandSequence();
 for (const stage of commandStages) {
 const result = await runScriptStage(stage.name, stage.script, stage.warnOnFailure);
 stageResults.push(result);
 if (result.status === 'FAIL') {
 return finalizeReportAndExit('NO-GO');
 }
 }

 if (commandStages.length > 0) {
 const lastStage = commandStages[commandStages.length - 1];
 if (lastStage.script === 'build') {
 const smokeStage = await runSmokeStage();
 stageResults.push(smokeStage);
 if (smokeStage.status === 'FAIL') {
 return finalizeReportAndExit('NO-GO');
 }
 }
 }

 return finalizeReportAndExit('GO');
}

function runEnvValidationStage() {
 const missing = [];
 for (const { label, keys } of requiredEnvChecks) {
 const hasValue = keys.some((key) => Boolean(process.env[key]));
 if (!hasValue) {
 missing.push(label);
 }
 }

 if (missing.length > 0) {
 return {
 name: 'Essential env vars',
 status: 'FAIL',
 durationMs: 0,
 command: 'Env validation',
 observation: `Missing: ${missing.join(', ')}`,
 };
 }

 return {
 name: 'Essential env vars',
 status: 'PASS',
 durationMs: 0,
 command: 'Env validation',
 };
}

function runOpenAiStage() {
 if (process.env.OPENAI_API_KEY) {
 return null;
 }

 return {
 name: 'OPENAI_API_KEY (warn)',
 status: 'WARN',
 durationMs: 0,
 command: 'OPENAI_API_KEY check',
 observation: 'Missing OPENAI_API_KEY (degradation expected, non-blocking)',
 };
}

function buildCommandSequence() {
 const sequence = [];
 for (const name of ['lint', 'typecheck', 'test']) {
 sequence.push({ name, script: name });
 }

 if (scriptNames.has('seo:audit')) {
 sequence.push({ name: 'seo:audit', script: 'seo:audit' });
 }

 if (scriptNames.has('check:all')) {
 sequence.push({ name: 'check:all', script: 'check:all', warnOnFailure: true });
 } else {
 for (const name of ['check:encoding', 'check:banned-words', 'a11y:contrast']) {
 if (scriptNames.has(name)) {
 sequence.push({ name, script: name });
 }
 }
 }

 if (scriptNames.has('build')) {
 sequence.push({ name: 'build', script: 'build' });
 }

 return sequence;
}

async function runScriptStage(stageName, scriptName, warnOnFailure = false) {
 const runner = getRunner(scriptName);
 const invocation = `${runner.program} ${runner.args.join(' ')}`;
 const start = Date.now();
 const { code, firstLine } = await execCommand(runner.program, runner.args);
 const durationMs = Date.now() - start;
 if (code === 0) {
 return { name: stageName, status: 'PASS', durationMs, command: invocation };
 }

 return {
 name: stageName,
 status: warnOnFailure ? 'WARN' : 'FAIL',
 durationMs,
 command: invocation,
 observation: firstLine || 'Falha (ver logs acima)',
 };
}

function getRunner(scriptName) {
 const ext = process.platform === 'win32' ? '.cmd' : '';
 switch (packageManager) {
 case 'pnpm':
 return { program: 'pnpm' + ext, args: ['run', scriptName] };
 case 'yarn':
 return { program: 'yarn' + ext, args: ['run', scriptName] };
 default:
 return { program: 'npm' + ext, args: ['run', scriptName] };
 }
}

async function execCommand(program, args) {
 return new Promise((resolve, reject) => {
	console.log('[preflight] execCommand spawn]', program, args.join(' '));
	const child = spawn(program, args, {
		cwd: repoRoot,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
		shell: true,
	});
 let candidateLine;
 let fallbackLine;
 const capture = (chunk) => {
 const text = chunk.toString('utf8');
 for (const raw of text.split(/\r?\n/)) {
 const line = raw.trim();
 if (!line) {
 continue;
 }
 const lower = line.toLowerCase();
 const isBootLine = line.startsWith('>') || lower.startsWith('info');
 if (!fallbackLine && !isBootLine) {
 fallbackLine = line;
 }
 if (isBootLine) {
 continue;
 }
 if (lower.includes('error')) {
 candidateLine = line;
 return;
 }
 if (!candidateLine) {
 candidateLine = line;
 }
 }
 };

	child.stdout.on('data', (chunk) => {
 process.stdout.write(chunk);
 capture(chunk);
 });

 child.stderr.on('data', (chunk) => {
 process.stderr.write(chunk);
 capture(chunk);
 });

 child.on('error', (error) => reject(error));
 child.on('exit', (code) => resolve({ code: code ?? 1, firstLine: candidateLine ?? fallbackLine }));
 });
}

async function runSmokeStage() {
 const port = 3100;
 const baseUrl = `http://127.0.0.1:${port}`;
 const command = `npx next start -p ${port} + smoke requests`;
 const start = Date.now();
 let server;

 try {
	console.log('[preflight] runSmokeStage spawn] npx', 'next start -p', port);
		server = spawn('npx', ['next', 'start', '-p', `${port}`], {
			cwd: repoRoot,
			env: process.env,
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
		});

 server.stdout.on('data', (chunk) => process.stdout.write(chunk));
 server.stderr.on('data', (chunk) => process.stderr.write(chunk));

 await waitForServer(baseUrl, 20000);
 const endpoints = ['/', '/filhotes', '/blog'];
 if (existsSync(join(repoRoot, 'app', 'guia'))) {
 endpoints.push('/guia');
 }

 for (const route of endpoints) {
 await fetchWithRetry(`${baseUrl}${route}`, 2);
 }

 const durationMs = Date.now() - start;
 return { name: 'Smoke tests HTTP', status: 'PASS', durationMs, command };
 } catch (error) {
 const durationMs = Date.now() - start;
 return {
 name: 'Smoke tests HTTP',
 status: 'FAIL',
 durationMs,
 command,
 observation: error.message,
 };
 } finally {
 if (server) {
 server.kill();
 try {
 await once(server, 'exit');
 } catch {
 /* ignore */
 }
 }
 }
}

async function waitForServer(baseUrl, timeoutMs) {
 const deadline = Date.now() + timeoutMs;
 while (Date.now() < deadline) {
 const controller = new AbortController();
 const timer = timerSetTimeout(() => controller.abort(), 2000);
 try {
 const response = await fetch(baseUrl, { signal: controller.signal });
 clearTimeout(timer);
 if (response.ok || response.status === 404) {
 return;
 }
 } catch {
 clearTimeout(timer);
 // loop until deadline
 }
 await delay(500);
 }
 throw new Error('Timeout waiting for Next.js server to start');
}

async function fetchWithRetry(url, attempts) {
 const timeoutMs = 5000;
 let lastError;
 for (let attempt = 1; attempt <= attempts; attempt += 1) {
 const controller = new AbortController();
 const timer = timerSetTimeout(() => controller.abort(), timeoutMs);
 try {
 const response = await fetch(url, { signal: controller.signal });
 if (!response.ok) {
 throw new Error(`status ${response.status}`);
 }
 const text = await response.text();
 if (!text.toLowerCase().includes('<html')) {
 throw new Error('Invalid HTML');
 }
 clearTimeout(timer);
 return;
 } catch (error) {
 lastError = error;
 clearTimeout(timer);
 if (attempt < attempts) {
 await delay(500);
 }
 }
 }

 throw lastError ?? new Error('HTTP request failure');
}

function detectPackageManager(root) {
 if (existsSync(join(root, 'pnpm-lock.yaml'))) {
 return 'pnpm';
 }
 if (existsSync(join(root, 'yarn.lock'))) {
 return 'yarn';
 }
 return 'npm';
}

function formatDuration(durationMs) {
 if (durationMs < 10) {
 return '0.00s';
 }
 return `${(durationMs / 1000).toFixed(2)}s`;
}

async function finalizeReportAndExit(finalDecision) {
 const failedStage = stageResults.find(({ status }) => status === 'FAIL');
 const warningStages = stageResults.filter(({ status }) => status === 'WARN');
 const lines = [];
 lines.push('# Preflight Vercel Report');
 lines.push('');
 lines.push(`Data: ${new Date().toISOString()}`);
 lines.push(`Repository: ${packageJson.name ?? repoRoot}`);
 lines.push('');
 lines.push('## Environment detected');
 lines.push(`- Node: ${process.version}`);
 lines.push(`- Package manager: ${packageManager}`);
 lines.push('');
 lines.push('## Stages executed');
 lines.push('| Stage | Status | Duration | Command | Observation |');
 lines.push('| --- | --- | --- | --- | --- |');
 for (const stage of stageResults) {
 lines.push(`| ${stage.name} | ${stage.status} | ${formatDuration(stage.durationMs)} | ${stage.command || '-'} | ${stage.observation ?? '-'} |`,
 );
 }
 lines.push('');
 lines.push('## Final decision');
 lines.push(`- Result: ${finalDecision}`);
 if (failedStage) {
 lines.push(`- Blocking: ${failedStage.name} failed (${failedStage.observation ?? 'see details'})`);
 }
 if (warningStages.length > 0) {
 lines.push(`- Warnings: ${warningStages.map((stage) => stage.name).join(', ')}`);
 }

 await writeFile(reportFile, lines.join('\n'), 'utf8');
 return finalDecision === 'GO' ? 0 : 1;
}
main()
 .then((code) => process.exit(code))
 .catch((error) => {
 console.error('Unexpected error in preflight:', error);
 process.exit(1);
 });
