#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lastReply } from './transcript.js';
import { toReadable } from './clean.js';
import { addHook, removeHook } from './settings.js';
import { createServer } from './server.js';

const PORT = Number(process.env.RSVP_PORT) || 4777;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const INSTALL_DIR = path.join(CLAUDE_DIR, 'rsvp-reader');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function health() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(400) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function openBrowser(url) {
  const [cmd, args] =
    process.platform === 'darwin' ? ['open', [url]] :
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] :
    ['xdg-open', [url]];
  const p = spawn(cmd, args, { stdio: 'ignore', detached: true });
  p.on('error', () => {});
  p.unref();
}

function serve() {
  const bundle = fs.readFileSync(path.join(ROOT, 'dist', 'rsvp.min.js'), 'utf8');
  const page = fs.readFileSync(path.join(ROOT, 'cli', 'live.html'), 'utf8');
  createServer({ bundle, page }).listen(PORT, '127.0.0.1', () => console.log(`RSVP reader on ${BASE}`));
}

async function ensureServer() {
  let h = await health();
  if (h) return h;
  spawn(process.execPath, [fileURLToPath(import.meta.url), 'serve'], { stdio: 'ignore', detached: true }).unref();
  for (let i = 0; i < 20 && !h; i++) { await sleep(100); h = await health(); }
  return h;
}

async function readStdin() {
  let s = '';
  for await (const c of process.stdin) s += c;
  return s;
}

async function hook() {
  const input = JSON.parse((await readStdin()) || '{}');
  const text = (input.last_assistant_message && String(input.last_assistant_message).trim()) ||
    (input.transcript_path && fs.existsSync(input.transcript_path)
      ? lastReply(fs.readFileSync(input.transcript_path, 'utf8')) : '');
  if (!text) return;
  const readable = toReadable(text);
  const h = await ensureServer();
  if (!h) return;
  if (h.clients === 0) { openBrowser(BASE); await sleep(1200); }
  await fetch(`${BASE}/reply`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: readable }), signal: AbortSignal.timeout(2000),
  });
}

const readSettings = () => (fs.existsSync(SETTINGS) ? JSON.parse(fs.readFileSync(SETTINGS, 'utf8')) : {});
function writeSettings(next) {
  const existed = fs.existsSync(SETTINGS);
  if (existed) fs.copyFileSync(SETTINGS, `${SETTINGS}.bak-rsvp`);
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS, JSON.stringify(next, null, 2) + '\n');
  return existed;
}

function install() {
  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  for (const dir of ['cli', 'dist']) fs.cpSync(path.join(ROOT, dir), path.join(INSTALL_DIR, dir), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(INSTALL_DIR, 'package.json'));
  const cmd = `"${process.execPath}" "${path.join(INSTALL_DIR, 'cli', 'index.js')}" hook`;
  const backedUp = writeSettings(addHook(readSettings(), cmd));
  console.log(`Installed. Claude Code replies will play at ${BASE} (opens automatically on the next reply).`);
  if (backedUp) console.log(`Previous settings backed up to ${SETTINGS}.bak-rsvp`);
}

function uninstall() {
  writeSettings(removeHook(readSettings()));
  fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
  console.log('Removed the rsvp-reader hook from Claude Code.');
}

const commands = {
  serve,
  hook: () => hook().catch(() => {}),
  install,
  uninstall,
  open: () => ensureServer().then(() => openBrowser(BASE)),
};
const cmd = commands[process.argv[2]];
if (!cmd) {
  console.log('Usage: rsvp-reader <install|uninstall|open|serve>');
  process.exitCode = 1;
} else cmd();
