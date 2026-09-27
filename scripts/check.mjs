#!/usr/bin/env node
// Structure checks for the repo. Run from the repo root: node scripts/check.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const failures = [];
const ok = msg => console.log('ok    ' + msg);
const bad = msg => { failures.push(msg); console.log('FAIL  ' + msg); };
const read = p => readFileSync(p, 'utf8');
const json = p => { try { return JSON.parse(read(p)); } catch (e) { bad(`${p}: invalid JSON (${e.message})`); return null; } };

// 1. Manifests and license
const plugin = json('plugin/.claude-plugin/plugin.json');
const market = json('.claude-plugin/marketplace.json');
if (plugin && market) {
  const entry = (market.plugins || []).find(p => p.name === plugin.name);
  entry && entry.source === './plugin' ? ok('marketplace lists the plugin with source ./plugin') : bad('marketplace must list the plugin with source ./plugin');
  /^\d+\.\d+\.\d+$/.test(plugin.version || '') ? ok(`plugin version ${plugin.version}`) : bad('plugin.json needs a semver version');
}
read('LICENSE') === read('plugin/LICENSE') ? ok('plugin/LICENSE matches LICENSE') : bad('plugin/LICENSE must match LICENSE');
existsSync('plugin/README.md') ? ok('plugin/README.md exists') : bad('plugin/README.md is missing (the plugin root needs a README)');

// 2. Skills: frontmatter, and every bundled file they reference exists
for (const dir of readdirSync('plugin/skills')) {
  const p = `plugin/skills/${dir}/SKILL.md`;
  const text = existsSync(p) ? read(p) : '';
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) { bad(`${p}: missing frontmatter`); continue; }
  const fields = Object.fromEntries(fm[1].split('\n').map(l => l.match(/^([a-z-]+):\s*(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));
  fields.name === dir ? ok(`${p}: name`) : bad(`${p}: name must be "${dir}"`);
  (fields.description || '').length >= 40 ? ok(`${p}: description`) : bad(`${p}: description missing or too short`);
  for (const m of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`)"]+)/g)) {
    if (!existsSync('plugin/' + m[1])) bad(`${p}: references missing file plugin/${m[1]}`);
  }
}

// 3. Templates use only the placeholders setup fills in
const KNOWN = new Set(['DASHBOARD_URL', 'CANDIDATE_NAME', 'TIMEZONE']);
for (const f of readdirSync('plugin/templates')) {
  const found = [...read(`plugin/templates/${f}`).matchAll(/\{\{([A-Z_]+)\}\}/g)].map(m => m[1]);
  const unknown = found.filter(x => !KNOWN.has(x));
  unknown.length ? bad(`plugin/templates/${f}: unknown placeholders ${unknown.join(', ')}`) : ok(`plugin/templates/${f}: placeholders ${[...new Set(found)].join(', ')}`);
}

// 4. The example interview follows the data model
const ex = json('examples/interview.example.json');
if (ex) {
  const missing = ['company', 'role', 'job_link', 'jd', 'checks', 'cards', 'questions'].filter(k => !(k in ex));
  missing.length ? bad(`example interview lacks ${missing.join(', ')}`) : ok('example interview has the required fields');
  const m = ex.materials || {};
  const KINDS = new Set(['motivation', 'business', 'technical', 'behavioral', 'leadership']);
  (m.quiz || []).every(q => Array.isArray(q.o) && q.o.length === 4 && Number.isInteger(q.a) && q.a >= 0 && q.a <= 3) ? ok('example quiz: 4 options and a valid answer') : bad('example quiz items are malformed');
  (m.faq || []).every(x => x.q && x.a && KINDS.has(x.kind)) ? ok('example faq: valid kinds') : bad('example faq items are malformed');
  (ex.cards || []).every(c => 'f' in c && 'b' in c && typeof c.k === 'boolean') ? ok('example cards: {f, b, k}') : bad('example cards are malformed');
}

// 5. Dashboard: inline scripts parse, and the practice chat prompt uses the profile
const html = read('plugin/dashboard/interview-prep-desk.html');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
try {
  scripts.forEach((s, i) => new vm.Script(s, { filename: `dashboard-inline-${i}.js` }));
  ok(`dashboard: ${scripts.length} inline script(s) parse`);
} catch (e) { bad(`dashboard: script does not parse: ${e.message}`); }
const src = scripts.join('\n'), from = src.indexOf('function clip('), to = src.indexOf('function chatInput(');
if (from < 0 || to < from) bad('dashboard: practice chat prompt functions not found');
else {
  const ctx = { S: { profile: { name: 'Robin Muster', markdown: read('examples/profile.example.md') } } };
  vm.createContext(ctx);
  vm.runInContext(src.slice(from, to) + '\nthis.chatRules = chatRules;', ctx);
  const withProfile = ctx.chatRules(ex);
  withProfile.includes('for Robin Muster, the candidate') && withProfile.includes('panel at Contoso Pharma')
    ? ok('dashboard: practice chat prompt uses the profile name and the company')
    : bad('dashboard: practice chat prompt does not use the profile name and the company');
  ctx.S.profile = null;
  ctx.chatRules(ex).includes('interview for the candidate.') ? ok('dashboard: practice chat prompt works without a profile') : bad('dashboard: practice chat prompt breaks without a profile');
}

// 5b. Dashboard: the id rule gives the results documented in plugin/reference/data-model.md
const sFrom = src.indexOf('function slug(');
if (sFrom < 0) bad('dashboard: slug() not found');
else {
  const sctx = {};
  vm.createContext(sctx);
  vm.runInContext(src.slice(sFrom, src.indexOf('\n', sFrom)) + '\nthis.slug = slug;', sctx);
  const ch = code => String.fromCharCode(code);
  const cases = [
    ['Contoso Pharma-undated', 'contoso-pharma-undated'],
    ['B' + ch(0xfc) + 'hler-undated', 'buhler-undated'],
    ['Soci' + ch(0xe9) + 't' + ch(0xe9) + ' G' + ch(0xe9) + 'n' + ch(0xe9) + 'rale-undated', 'societe-generale-undated'],
    ['Stra' + ch(0xdf) + 'e AG-2026-10-01', 'strasse-ag-2026-10-01'],
    ['---', 'x'],
    ['a'.repeat(59) + ' b', 'a'.repeat(59)],
  ];
  const wrong = cases.filter(([input, want]) => sctx.slug(input) !== want);
  wrong.length ? bad(`dashboard: slug() gives unexpected ids for ${wrong.map(c => JSON.stringify(c[0])).join(', ')}`) : ok(`dashboard: slug() matches the data model on ${cases.length} cases`);
}

// 6. House style: no em dash characters in any text file
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const EM_DASH = String.fromCharCode(0x2014);
const dashed = files.filter(f => existsSync(f) && read(f).includes(EM_DASH));
dashed.length ? bad(`em dash characters in: ${dashed.join(', ')}`) : ok(`no em dash characters in ${files.length} files`);

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
