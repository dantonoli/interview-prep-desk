#!/usr/bin/env node
// Writes the tailored CV and cover letter of one job as Word files, with the dashboard's own Word code.
// Usage: node word-files.mjs <job.json> <out-dir> [--answers <applicant.json>] [--contact "<line>"]
//   <job.json>      the job document as ArtifactData saves it (collection "jobs", with out_dir)
//   --answers       the Application answers document; its email, phone, city, country and LinkedIn make the contact line
//   --contact       a contact line to use instead
// Prints the two file paths. Needs Node 20 or later.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const args = process.argv.slice(2), opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const [jobPath, outDir] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!jobPath || !outDir) { console.error('usage: node word-files.mjs <job.json> <out-dir> [--answers <applicant.json>] [--contact "<line>"]'); process.exit(2); }

const html = readFileSync(fileURLToPath(new URL('../dashboard/interview-prep-desk.html', import.meta.url)), 'utf8');
const src = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const fn = name => { const a = src.indexOf(`function ${name}(`); return a < 0 ? '' : src.slice(a, src.indexOf('\nfunction ', a + 1)); };
const from = src.indexOf('// ---------- application pack'), to = src.indexOf('// ---------- parsing');
const answersFrom = src.indexOf('// ---------- application answers'), answersTo = src.indexOf('let cardsParsed');
if (from < 0 || to < from || answersFrom < 0 || answersTo < answersFrom) { console.error('word-files: the dashboard code was not found'); process.exit(1); }

const job = JSON.parse(readFileSync(jobPath, 'utf8'));
const answers = opt('--answers') ? JSON.parse(readFileSync(opt('--answers'), 'utf8')) : null;
const ctx = { TextEncoder, Intl, S: { profile: null, answers }, tryLS: (f, d) => d };
vm.createContext(ctx);
vm.runInContext([fn('clip'), fn('packPart'), fn('dateIn'), src.slice(from, to), fn('answersContact')].join('\n')
  + '\nObject.assign(this, {packPart, docxBytes, cvParas, letterParas, dateIn, answersContact});', ctx);

const cv = ctx.packPart(job, 'cv'), letters = ctx.packPart(job, 'letters');
if (!cv) { console.error('word-files: this job has no tailored CV yet; create the application pack in the dashboard first'); process.exit(1); }
const contact = (opt('--contact') || '').trim() || ctx.answersContact();
const name = cv.name || 'CV', safe = s => s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
mkdirSync(outDir, { recursive: true });
const out = [];
const write = (kind, paras) => { const f = join(outDir, safe(`${name} ${kind}, ${job.company}.docx`)); writeFileSync(f, ctx.docxBytes(paras, false)); out.push(f); };
write('CV', ctx.cvParas(cv, contact));
if (letters) write('cover letter', ctx.letterParas(name, letters, contact, job.company, ctx.dateIn(letters.lang)));
console.log(out.join('\n'));
if (!contact) console.error('word-files: no contact line given, so the files show a placeholder to fill in');
