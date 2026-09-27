#!/usr/bin/env node
// Fails when files or commit identities about to be published contain personal data. See docs/privacy.md.
// Usage: node scripts/privacy-scan.mjs [--staged]
//   default   scans tracked files plus untracked files that are not ignored, and the identity on every commit and tag
//   --staged  scans the staged version of files and the identity the next commit will use (pre-commit hook)
// Optional denylist of personal terms, one per line, kept outside the repo:
//   git config privacy.denylist /path/to/denylist.txt   or   PRIVACY_DENYLIST=/path/to/denylist.txt
// Optional: git config privacy.requireUtc true   also fails when a commit or tag time is not in UTC.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const NUL = String.fromCharCode(0);
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const tryGit = (...args) => { try { return git(...args); } catch { return ''; } };

const files = (staged
  ? git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z')
  : git('ls-files', '-z', '--cached', '--others', '--exclude-standard')
).split(NUL).filter(Boolean);

const readFile = f => staged ? git('show', ':' + f) : existsSync(f) ? readFileSync(f, 'utf8') : '';

const PATTERNS = [
  ['email address', /[A-Za-z0-9._%+-]+@(?!example\.(?:com|org)\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g],
  ['phone number', /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}/g],
  ['claude.ai artifact link', /claude\.ai\/(?:code\/)?artifact\/[A-Za-z0-9-]{8,}/g],
  ['share key', /[?&]sk=[A-Za-z0-9_-]{6,}/g],
  ['NotebookLM notebook link', /notebook(?:lm)?\.google\.com\/notebook\/[0-9a-f-]{20,}/g],
];

// Commit and tag identities must use a GitHub noreply address, so no personal email reaches the history.
const NOREPLY = /^(\d+\+)?[A-Za-z0-9-]+@users\.noreply\.github\.com$|^noreply@github\.com$/;

let denyPath = process.env.PRIVACY_DENYLIST || tryGit('config', '--get', 'privacy.denylist').trim();
const CURLY_QUOTES = new RegExp('[' + String.fromCharCode(0x2018, 0x2019) + ']', 'g');
const norm = s => s.toLowerCase().replace(CURLY_QUOTES, "'");
let terms = [];
if (denyPath) {
  if (!existsSync(denyPath)) { console.error(`privacy-scan: denylist not found: ${denyPath}`); process.exit(2); }
  terms = readFileSync(denyPath, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(norm);
}

// Never print a full match: CI logs of a public repo are public.
const mask = s => (s.length <= 4 ? '' : s.slice(0, 3)) + '***';
const findings = [];

for (const f of files) {
  let text;
  try { text = readFile(f); } catch { continue; }
  if (text.includes(NUL)) continue;
  text.split('\n').forEach((line, i) => {
    for (const [label, re] of PATTERNS) for (const m of line.matchAll(re)) findings.push(`${f}:${i + 1}: ${label} (${mask(m[0])})`);
    const low = norm(line);
    for (const t of terms) if (low.includes(t)) findings.push(`${f}:${i + 1}: denylisted term (${mask(t)})`);
  });
}

const idents = [];
if (staged) {
  for (const [v, role] of [['GIT_AUTHOR_IDENT', 'author'], ['GIT_COMMITTER_IDENT', 'committer']]) {
    const m = tryGit('var', v).trim().match(/^(.*) <([^>]*)> \d+ ([+-]\d{4})$/);
    if (m) idents.push({ where: `next commit ${role}`, name: m[1], email: m[2], tz: m[3] });
  }
} else {
  for (const line of tryGit('log', '--all', '--format=%h%x09%an%x09%ae%x09%ai%x09%cn%x09%ce%x09%ci').split('\n').filter(Boolean)) {
    const [h, an, ae, ad, cn, ce, cd] = line.split('\t');
    idents.push({ where: `commit ${h} author`, name: an, email: ae, tz: ad.slice(-5) });
    idents.push({ where: `commit ${h} committer`, name: cn, email: ce, tz: cd.slice(-5) });
  }
  for (const line of tryGit('for-each-ref', 'refs/tags', '--format=%(refname:short)%09%(taggername)%09%(taggeremail)%09%(taggerdate:iso)').split('\n').filter(Boolean)) {
    const [t, tn, te, td] = line.split('\t');
    if (te) idents.push({ where: `tag ${t}`, name: tn, email: te.replace(/^<|>$/g, ''), tz: (td || '').slice(-5) });
  }
}
const requireUtc = tryGit('config', '--get', 'privacy.requireUtc').trim() === 'true';
for (const id of idents) {
  if (!NOREPLY.test(id.email)) findings.push(`${id.where}: email is not a GitHub noreply address (${mask(id.email)})`);
  const low = norm(`${id.name} ${id.email}`);
  for (const t of terms) if (low.includes(t)) findings.push(`${id.where}: denylisted term in the identity (${mask(t)})`);
  if (requireUtc && id.tz && id.tz !== '+0000') findings.push(`${id.where}: time zone ${id.tz}, commit with TZ=UTC`);
}

if (findings.length) {
  console.error(`privacy-scan: ${findings.length} finding(s). Remove them before committing:`);
  for (const x of findings) console.error('  ' + x);
  process.exit(1);
}
console.log(`privacy-scan: clean (${files.length} files, ${idents.length} identities${terms.length ? `, denylist of ${terms.length} terms` : ', no denylist'}${requireUtc ? ', UTC required' : ''})`);
