#!/usr/bin/env node
// Regenerates the screenshots in docs/images/guide from the current dashboard file and made-up data.
// Usage: node scripts/screenshots/shoot.mjs [shot ...] [--out <dir>]
//   Needs Node 22 or later and Google Chrome (set CHROME=/path/to/chrome if it is not found). Fonts load from Google Fonts.
//   Times show in UTC and dates written by the page in en-US, so they do not reveal your time zone. The date field in
//   the form follows the computer's own region setting on macOS.
// Check every new image by eye before committing, then run node scripts/privacy-scan.mjs.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios } from './seed.mjs';
import { shots } from './shots.mjs';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
if (outAt >= 0 && !args[outAt + 1]) { console.error('--out needs a folder'); process.exit(2); }
const outDir = outAt >= 0 ? args[outAt + 1] : here('../../docs/images/guide');
const only = outAt >= 0 ? args.filter((a, i) => i !== outAt && i !== outAt + 1) : args;
const unknown = only.filter(n => !shots.some(s => s.name === n));
if (unknown.length) { console.error(`unknown shot: ${unknown.join(', ')}. Known: ${shots.map(s => s.name).join(', ')}`); process.exit(2); }

const CHROME = (process.env.CHROME ? [process.env.CHROME] : ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']).find(existsSync);
if (!CHROME) { console.error(`Google Chrome not found${process.env.CHROME ? ' at ' + process.env.CHROME : ''}. Set CHROME=/path/to/chrome.`); process.exit(2); }

// Preview pages: the dashboard file with the in-memory database and a made-up seed in front of it.
const work = mkdtempSync(join(tmpdir(), 'ipd-shots-'));
const dash = readFileSync(here('../../plugins/interview-prep-desk/dashboard/interview-prep-desk.html'), 'utf8');
const shim = readFileSync(here('./shim.js'), 'utf8');
for (const [name, seed] of Object.entries(scenarios)) {
  writeFileSync(join(work, `${name}.html`), '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'
    + '<script>window.__SEED=' + JSON.stringify(seed).replace(/</g, '\\u003c') + '</script><script>' + shim + '</script>' + dash);
}

const profile = join(work, 'profile');
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--lang=en-US', 'about:blank'], { stdio: 'ignore' });
chrome.on('error', () => {}); // a failed launch shows up below as "Chrome did not start"
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cleanup = async () => { // wait for Chrome to exit, or it may still be writing into its profile folder
  if (chrome.exitCode === null && chrome.signalCode === null) { chrome.kill(); await Promise.race([new Promise(r => chrome.once('exit', r)), sleep(3000)]); }
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
};

try {
  let port, page;
  for (let i = 0; i < 100 && !page; i++) {
    await sleep(100);
    try { port ||= readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
  }
  if (!page) throw new Error('Chrome did not start');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let seq = 0; const pending = new Map(), waiters = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) for (const w of waiters.splice(0)) w(m);
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const HELPERS = `window.__vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    window.__byText = (t, sel) => [...document.querySelectorAll(sel || 'button,[role=tab],a,summary,label')].filter(__vis).find(el => el.textContent.replace(/\\s+/g, ' ').trim().startsWith(t));`;

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setTimezoneOverride', { timezoneId: 'UTC' });
  await send('Emulation.setLocaleOverride', { locale: 'en-US' });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  mkdirSync(outDir, { recursive: true });

  for (const shot of shots) {
    if (only.length && !only.includes(shot.name)) continue;
    const w = shot.width || 1200, h = shot.height || 860;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: false });
    const loaded = new Promise(r => waiters.push(function f(m) { m.method === 'Page.loadEventFired' ? r() : waiters.push(f); }));
    await send('Page.navigate', { url: 'file://' + join(work, `${shot.page}.html`) });
    await loaded;
    await evaluate('document.fonts.ready.then(() => true)');
    await sleep(600);
    await evaluate(HELPERS);
    for (const step of shot.steps || []) {
      if (step.click && !(await evaluate(`(() => { const el = __byText(${JSON.stringify(step.click)}, ${JSON.stringify(step.sel || null)}); if (!el) return false; el.click(); return true; })()`)))
        throw new Error(`${shot.name}: nothing labelled "${step.click}"`);
      if (step.eval) await evaluate(step.eval);
      await sleep(step.wait ?? 350);
    }
    let clip = { x: 0, y: await evaluate('scrollY'), width: w, height: h, scale: 1 };
    if (shot.clip) {
      const r = await evaluate(`(() => { const els = [].concat(${shot.clip}).filter(Boolean); if (!els.length) return null; els[0].scrollIntoView({block: 'start'});
        const b = els.map(e => e.getBoundingClientRect()), x1 = Math.min(...b.map(r => r.left)), y1 = Math.min(...b.map(r => r.top));
        return {x: x1 + scrollX, y: y1 + scrollY, width: Math.max(...b.map(r => r.right)) - x1, height: Math.max(...b.map(r => r.bottom)) - y1}; })()`);
      if (!r) throw new Error(`${shot.name}: clip element not found`);
      clip = { ...r, height: Math.min(shot.maxHeight || 4000, r.height), scale: 1 };
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
    writeFileSync(join(outDir, `${shot.name}.png`), Buffer.from(data, 'base64'));
    console.log(`saved ${shot.name}.png (${Math.round(clip.width)}x${Math.round(clip.height)} at 2x)`);
  }
  ws.close();
} catch (e) {
  console.error('screenshots: ' + e.message);
  process.exitCode = 1;
} finally {
  await cleanup();
}
