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
const words = s => (s.replace(/```[\s\S]*?```/g, ' ').match(/[A-Za-z0-9]\S*/g) || []).length;
const tracked = dir => execFileSync('git', ['ls-files', '-co', '--exclude-standard', dir], { encoding: 'utf8' }).split('\n').filter(Boolean);

const CORE = 'plugins/interview-prep-desk';

// 1. Marketplace, manifests, licenses and READMEs of every plugin
const market = json('.claude-plugin/marketplace.json');
const listed = market?.plugins || [];
const pluginDirs = readdirSync('plugins').map(d => `plugins/${d}`).filter(d => existsSync(`${d}/.claude-plugin/plugin.json`));
const found = new Set();
for (const dir of pluginDirs) {
  const pj = json(`${dir}/.claude-plugin/plugin.json`);
  if (!pj) continue;
  found.add(pj.name);
  const entry = listed.find(p => p.name === pj.name);
  entry && entry.source === './' + dir ? ok(`marketplace lists ${pj.name} with source ./${dir}`) : bad(`marketplace must list ${pj.name} with source ./${dir}`);
  /^\d+\.\d+\.\d+$/.test(pj.version || '') ? ok(`${pj.name} version ${pj.version}`) : bad(`${pj.name} needs a semver version`);
  pj.author?.name === 'dantonoli' ? ok(`${pj.name} author is the GitHub handle`) : bad(`${pj.name}: author.name must be the GitHub handle, never a real name`);
  read('LICENSE') === read(`${dir}/LICENSE`) ? ok(`${dir}/LICENSE matches LICENSE`) : bad(`${dir}/LICENSE must match LICENSE`);
  const readme = existsSync(`${dir}/README.md`) ? read(`${dir}/README.md`) : '';
  words(readme) >= 40 ? ok(`${dir}/README.md has ${words(readme)} words`) : bad(`${dir}/README.md needs at least 40 words outside code blocks`);
  for (const dep of pj.dependencies || []) {
    const name = typeof dep === 'string' ? dep : dep.name;
    listed.some(p => p.name === name) ? ok(`${pj.name} depends on ${name}, which the marketplace lists`) : bad(`${pj.name} depends on ${name}, which the marketplace does not list`);
  }
}
for (const p of listed) if (!found.has(p.name)) bad(`marketplace lists ${p.name}, but plugins/ has no such plugin`);

// 2. Skills: frontmatter, and every bundled file they reference exists inside the same plugin
for (const dir of pluginDirs) {
  if (!existsSync(`${dir}/skills`)) continue;
  for (const s of readdirSync(`${dir}/skills`)) {
    const p = `${dir}/skills/${s}/SKILL.md`;
    const text = existsSync(p) ? read(p) : '';
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) { bad(`${p}: missing frontmatter`); continue; }
    const fields = Object.fromEntries(fm[1].split('\n').map(l => l.match(/^([a-z-]+):\s*(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));
    fields.name === s ? ok(`${p}: name`) : bad(`${p}: name must be "${s}"`);
    (fields.description || '').length >= 40 ? ok(`${p}: description`) : bad(`${p}: description missing or too short`);
    for (const m of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`)"]+)/g)) {
      if (!existsSync(`${dir}/${m[1]}`)) bad(`${p}: references missing file ${dir}/${m[1]}`);
    }
  }
}

// 3. Templates use only the placeholders the setup skills fill in
const KNOWN = new Set(['DASHBOARD_URL', 'CANDIDATE_NAME', 'TIMEZONE']);
for (const dir of pluginDirs) {
  if (!existsSync(`${dir}/templates`)) continue;
  for (const f of readdirSync(`${dir}/templates`)) {
    const used = [...read(`${dir}/templates/${f}`).matchAll(/\{\{([A-Z_]+)\}\}/g)].map(m => m[1]);
    const unknown = used.filter(x => !KNOWN.has(x));
    unknown.length ? bad(`${dir}/templates/${f}: unknown placeholders ${unknown.join(', ')}`) : ok(`${dir}/templates/${f}: placeholders ${[...new Set(used)].join(', ')}`);
  }
}

// 3b. The core plugin, which goes to Anthropic's directory, does not rely on the unofficial NotebookLM tool
const toolMentions = tracked(CORE).filter(f => /gemini-notebook-mcp|nlm login/i.test(read(f)));
toolMentions.length ? bad(`core plugin mentions the unofficial NotebookLM tool in: ${toolMentions.join(', ')}`) : ok('core plugin does not mention the unofficial NotebookLM tool');

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
const html = read(`${CORE}/dashboard/interview-prep-desk.html`);
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
try {
  scripts.forEach((s, i) => new vm.Script(s, { filename: `dashboard-inline-${i}.js` }));
  ok(`dashboard: ${scripts.length} inline script(s) parse`);
} catch (e) { bad(`dashboard: script does not parse: ${e.message}`); }
const src = scripts.join('\n');
const fn = name => { const a = src.indexOf(`function ${name}(`); return a < 0 ? '' : src.slice(a, src.indexOf('\nfunction ', a + 1)); };
const from = src.indexOf('function clip('), to = src.indexOf('function chatInput(');
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

// 5b. Dashboard: the id rule gives the results documented in the data model
if (!fn('slug')) bad('dashboard: slug() not found');
else {
  const sctx = {};
  vm.createContext(sctx);
  vm.runInContext(fn('slug') + '\nthis.slug = slug;', sctx);
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

// 5c. Dashboard: voice mock controls appear only when the add-on is on or the interview already has voice data
if (!fn('voiceOn')) bad('dashboard: voiceOn() not found');
else {
  const vctx = { S: { voice: null } };
  vm.createContext(vctx);
  vm.runInContext(fn('voiceOn') + '\nthis.voiceOn = voiceOn;', vctx);
  const plain = { company: 'Contoso Pharma' };
  const withVoice = { company: 'Contoso Pharma', voice: { status: 'ready', script: ['q'] }, notebook_url: 'https://example.com/n' };
  const offOk = vctx.voiceOn(plain) === false && vctx.voiceOn(withVoice) === true;
  vctx.S.voice = { enabled: true };
  const onOk = vctx.voiceOn(plain) === true;
  offOk && onOk ? ok('dashboard: voice controls follow settings/voice and existing voice data') : bad('dashboard: voiceOn() does not follow settings/voice and existing voice data');
}

// 6. House style: no em dash characters in any text file
const EM_DASH = String.fromCharCode(0x2014);
const files = tracked('.');
const dashed = files.filter(f => existsSync(f) && read(f).includes(EM_DASH));
dashed.length ? bad(`em dash characters in: ${dashed.join(', ')}`) : ok(`no em dash characters in ${files.length} files`);

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
