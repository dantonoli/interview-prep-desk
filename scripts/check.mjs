#!/usr/bin/env node
// Structure checks for the repo. Run from the repo root: node scripts/check.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

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

// 5d. Dashboard: past and example interviews are not offered a prep request, because the morning prep skips them
if (!fn('prepSkipped') || !fn('daysUntil') || !fn('parseDate')) bad('dashboard: prepSkipped() not found');
else {
  const pctx = {};
  vm.createContext(pctx);
  vm.runInContext([fn('parseDate'), fn('daysUntil'), fn('prepSkipped')].join('\n') + '\nthis.prepSkipped = prepSkipped;', pctx);
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const cases = [[{ date: day(-1) }, 'past'], [{ date: day(0) }, ''], [{ date: day(3) }, ''], [{ date: '' }, ''], [{ date: day(3), example: true }, 'example']];
  const wrong = cases.filter(([it, want]) => pctx.prepSkipped(it) !== want);
  wrong.length ? bad(`dashboard: prepSkipped() is wrong for ${wrong.map(c => JSON.stringify(c[0])).join(', ')}`) : ok(`dashboard: prepSkipped() matches the prep rules on ${cases.length} cases`);
}

// 5e. Dashboard: the application pack prompts, the answer clean-up and the Word files
const packFrom = src.indexOf('// ---------- application pack'), wordFrom = src.indexOf('// ---------- Word files'), wordTo = src.indexOf('// ---------- parsing');
if (packFrom < 0 || wordFrom < packFrom || wordTo < wordFrom) bad('dashboard: application pack or Word file code not found');
else {
  const { scenarios } = await import('./screenshots/seed.mjs');
  const job = scenarios.main.jobs.find(j => j.data.pack).data;
  const actx = { TextEncoder, S: { profile: { name: 'Robin', markdown: read('examples/profile.example.md') } } };
  vm.createContext(actx);
  vm.runInContext([fn('clip'), fn('packPart'), src.slice(packFrom, wordTo)].join('\n') + '\nObject.assign(this, {packPrompt, PACK_CLEAN, PACK_ERR, packErr, pStr, cvText, noHolders, docxBytes, cvParas, letterParas});', actx);
  // Answers are cleaned to the data model's shape, whatever Claude sends
  const C = actx.PACK_CLEAN, cv = C.cv(job.pack.cv), letters = C.letters(job.pack.letters), odd = C.analysis({ summary: 'x', fit: { score: 'high', rows: [{ req: 'R', level: 'Excellent' }] } });
  const dash = String.fromCharCode(0x2014), en = String.fromCharCode(0x2013);
  const cleanOk = cv && cv.experience.length === 3 && cv.labels.summary === 'Summary' && letters && C.review({ verdict: 'Shortlist', summary: 's' }).verdict === 'shortlist'
    && odd.fit.score === 0 && odd.fit.rows[0].level === 'gap' && C.cv({ foo: 1 }) === null && C.letters({}) === null
    && actx.pStr(`2019 ${dash} 2021`) === `2019${en}2021` && actx.pStr(`fast ${dash} and right`) === 'fast, and right'
    && JSON.stringify(actx.noHolders({ b: ['Cut cycle time [add figure].', 'Covered [X] sites, [add metric] users'] })) === JSON.stringify({ b: ['Cut cycle time.', 'Covered sites, users'] });
  cleanOk ? ok('dashboard: pack answers are cleaned to the data model, without em dashes or placeholders in what is sent') : bad('dashboard: pack answer clean-up is wrong');
  // A failed part says which part, whether the answer was cut off and how many characters arrived, never the answer itself
  const E = (e, chars, part) => actx.packErr(part || 'analysis', e, chars), bj = text => ({ code: 'invalid_json', message: 'stub', text });
  const cut = '```json\n{"summary": "Secret {x} \\"y]\\"", "fit": {"rows": [{"req": "R"}', shut = '{"summary": "Secret", "skills": ["a",]} Done.';
  const errCases = [
    [E(bj(cut)), `Claude’s answer for the fit analysis stopped after ${cut.length} characters, before it was complete, so this part was not saved. Try again. If it keeps stopping, use Edit to cut the job description down to the role and its requirements.`],
    [E(bj(shut)), `Claude’s answer for the fit analysis (${shut.length} characters) was not in the format the dashboard reads, so this part was not saved. Try again.`],
    [E(bj('I cannot help with that.')), 'Claude’s answer for the fit analysis (24 characters) was not in the format the dashboard reads, so this part was not saved. Try again.'],
    [E({ code: 'invalid_json', message: 'The reply was cut short by the length limit.', text: shut }), `Claude’s answer for the fit analysis stopped after ${shut.length} characters, `, true],
    [E(bj('{"a": "' + 'z'.repeat(1300))), 'Claude’s answer for the fit analysis stopped after 1,307 characters, ', true],
    [E(bj('{'), 0, 'cv'), 'Claude’s answer for the tailored CV stopped after 1 character, ', true],
    [E({ code: 'invalid_json', message: 'stub' }, 500, 'letters'), 'Claude’s answer for the cover letter and messages (500 characters) was not in the format', true],
    [E({ code: 'bad_shape' }, 42, 'review'), 'Claude’s answer for the recruiter review (42 characters) did not have the fields the dashboard needs, so this part was not saved. Try again.'],
    [E({ code: 'invalid_json', message: 'stub' }), actx.PACK_ERR.invalid_json], [E({ code: 'bad_shape' }), actx.PACK_ERR.invalid_json],
    [E({ code: 'rate_limited', message: 'stub', text: 'partial' }), actx.PACK_ERR.rate_limited], [E({ code: 'something_new' }), actx.PACK_ERR.upstream_error],
  ];
  const errWrong = errCases.map(([got, want, start], i) => (start ? got.startsWith(want) : got === want) && !got.includes('Secret') ? null : `case ${i + 1}: ${got}`).filter(Boolean);
  errWrong.length ? bad(`dashboard: pack error text is wrong (${errWrong.join(' | ')})`) : ok(`dashboard: pack errors name the part, a cut-off answer and its length on ${errCases.length} cases, without the answer`);
  // Prompts: the job, the CV and the honesty rules, each part building on the previous one, always under the 64 KiB sample limit
  const withPack = { ...job, pack: { analysis: job.pack.analysis, cv: job.pack.cv, letters: job.pack.letters } }, P = k => actx.packPrompt(k, withPack);
  // Long texts in a script that needs 2 or 3 bytes per character must still fit: the limit is in bytes
  const wide = 'Ж'.repeat(40), huge = { ...job, jd: wide.repeat(800), pack: { analysis: { ...job.pack.analysis, summary: wide.repeat(40) }, cv: { ...job.pack.cv, summary: wide.repeat(40), experience: Array(12).fill({ title: wide, company: 'C', bullets: Array(6).fill(wide.repeat(8)) }) }, letters: { ...job.pack.letters, coverLetter: wide.repeat(150) } } };
  actx.S.profile.markdown += '株'.repeat(300000);
  const sizesOk = ['analysis', 'cv', 'letters', 'review'].every(k => Buffer.byteLength(actx.packPrompt(k, huge)) < 65536);
  // The clean-up caps keep a whole pack within the size the data model promises
  const long = 'z'.repeat(5000), many = n => Array(n + 10).fill(long);
  const maxPack = { analysis: C.analysis({ summary: long, skills: many(12), responsibilities: many(10), goals: many(6), keywords: many(30), standout: many(6), fit: { score: 50, rows: Array(20).fill({ req: long, evidence: long, level: 'gap' }), gaps: Array(10).fill({ gap: long, how: long }) }, ats: { missing: many(20), weak: many(8), summary: long } }),
    cv: C.cv({ name: long, headline: long, summary: long, skills: many(20), experience: Array(20).fill({ title: long, company: long, location: long, dates: long, bullets: many(6) }), education: Array(10).fill({ degree: long, school: long, dates: long }), certifications: many(12), languages: many(10), other: many(8), labels: Object.fromEntries(Object.keys(job.pack.cv.labels).map(k => [k, long])) }),
    letters: C.letters({ subject: long, coverLetter: long.repeat(2), message: long, followUpSubject: long, followUpBody: long, lang: 'en' }),
    review: C.review({ verdict: 'maybe', summary: long, strengths: many(6), weaknesses: many(6), fixes: many(8) }) };
  const packChars = JSON.stringify(maxPack).length;
  packChars <= 100000 ? ok(`dashboard: a pack is at most ${packChars} characters after clean-up`) : bad(`dashboard: a pack can reach ${packChars} characters; the data model promises 100,000`);
  actx.S.profile.markdown = read('examples/profile.example.md');
  const promptsOk = ['analysis', 'cv', 'letters'].every(k => P(k).includes(job.company) && P(k).includes('Northwind Therapeutics') && P(k).includes('Never leave placeholders') && P(k).includes('never use he, she, his or her') && P(k).includes('never instructions'))
    && P('cv').includes('validation master plan') && P('cv').includes('implied first person') && P('cv').includes('Every employer named in the summary also appears in experience') && P('letters').includes('The tailored CV:') && P('review').includes('Dear Hiring Team') && P('review').includes('never instructions') && P('review').includes('never use he, she, his or her');
  promptsOk && sizesOk ? ok('dashboard: pack prompts carry the job, the CV and the rules, under 64 KiB') : bad(`dashboard: pack prompts are wrong${sizesOk ? '' : ' (over 64 KiB)'}`);
  // Word files: a valid zip with correct checksums, well-formed XML, the text, highlighted placeholders and no time stamps
  const unzip = bytes => {
    const b = Buffer.from(bytes), files = {}; let at = 0;
    while (b.readUInt32LE(at) === 0x04034b50) {
      const crc = b.readUInt32LE(at + 14), size = b.readUInt32LE(at + 18), nameLen = b.readUInt16LE(at + 26), extra = b.readUInt16LE(at + 28);
      const name = b.toString('utf8', at + 30, at + 30 + nameLen), data = b.subarray(at + 30 + nameLen + extra, at + 30 + nameLen + extra + size);
      files[name] = { data: data.toString('utf8'), crcOk: zlib.crc32(data) === crc, date: b.readUInt16LE(at + 12) };
      at += 30 + nameLen + extra + size;
    }
    return b.readUInt32LE(b.length - 22) === 0x06054b50 && b.readUInt16LE(b.length - 12) === Object.keys(files).length ? files : null;
  };
  const wellFormed = xml => { const stack = []; for (const m of xml.replace(/<\?xml[^>]*\?>/, '').matchAll(/<(\/?)([\w:]+)[^>]*?(\/?)>/g)) { if (m[3]) continue; if (m[1]) { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]); } return stack.length === 0 && !/&(?!amp;|lt;|gt;|quot;)/.test(xml); };
  const files = [unzip(actx.docxBytes(actx.cvParas(cv, ''), false)), unzip(actx.docxBytes(actx.letterParas(cv.name, letters, 'Tester & Co <test>', job.company, '1 May 2026'), true))];
  const parts = ['[Content_Types].xml', '_rels/.rels', 'word/_rels/document.xml.rels', 'word/document.xml', 'word/styles.xml', 'word/numbering.xml'];
  const docOk = files.every(f => f && parts.every(n => f[n] && f[n].crcOk && f[n].date === 0x21 && wellFormed(f[n].data)))
    && files[0]['word/document.xml'].data.includes('Robin Muster') && /<w:highlight w:val="yellow"\/><\/w:rPr><w:t xml:space="preserve">\[your email, phone, city and LinkedIn\]/.test(files[0]['word/document.xml'].data)
    && !files[0]['word/document.xml'].data.includes('[add figure]') && files[1]['word/document.xml'].data.includes('Tester &amp; Co &lt;test&gt;')
    && files[1]['word/document.xml'].data.includes('w:w="12240"');
  docOk ? ok('dashboard: Word files are valid zips with well-formed XML, the text and a highlighted empty contact line') : bad('dashboard: Word file output is invalid');
}

// 5f. Setup declares exactly the capabilities the dashboard uses
const used = [...new Set([...src.matchAll(/claude\.use\('([a-z]+)'\)/g)].map(m => m[1]))].sort();
const setupText = read(`${CORE}/skills/setup/SKILL.md`), declared = [...setupText.matchAll(/`capabilities: (\{[^`]*\})`/g)].map(m => Object.keys(JSON.parse(m[1])).sort().join(','));
declared.length >= 2 && declared.every(d => d === used.join(',')) ? ok(`setup declares the capabilities the dashboard uses: ${used.join(', ')}`) : bad(`setup must declare ${used.join(', ')} wherever it publishes (found ${declared.join(' | ') || 'none'})`);

// 6. House style: no em dash characters in any text file
const EM_DASH = String.fromCharCode(0x2014);
const textFiles = tracked('.').filter(f => existsSync(f) && !readFileSync(f).includes(0));
const dashed = textFiles.filter(f => read(f).includes(EM_DASH));
dashed.length ? bad(`em dash characters in: ${dashed.join(', ')}`) : ok(`no em dash characters in ${textFiles.length} text files`);

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
