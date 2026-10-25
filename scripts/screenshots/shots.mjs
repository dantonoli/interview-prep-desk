// The screenshots in docs/images/guide. Each shot opens a preview page, runs its steps and captures the viewport or a clip.
import { day } from './seed.mjs';

const tab = t => ({ click: t, sel: 'button,[role=tab]' });
const tick = n => ({ eval: `(async () => { for (let i = 0; i < ${n}; i++) { const c = [...document.querySelectorAll('#detail input[type=checkbox]')].filter(__vis)[i]; if (c && !c.checked) c.click(); await new Promise(r => setTimeout(r, 250)); } })()` });
const panel = "[document.querySelector('#detail .tabs'), document.querySelector('#detail .tabbody')]";
const fill = (id, v) => `(() => { const e = document.getElementById('${id}'); e.value = ${JSON.stringify(v)}; e.dispatchEvent(new Event('input', {bubbles: true})); e.dispatchEvent(new Event('change', {bubbles: true})); })();`;
const progress = [tab('Checklist'), tick(6)];

// Test shots (--tests): Claude's answer for the fit analysis fails, and the page must say how, without showing the answer and without asking again.
const packFails = (name, analysis, want) => ({ name, test: true, page: 'main', width: 1200, height: 900, clip: panel, maxHeight: 700, steps: [
  { click: 'Applications', sel: 'button' }, { eval: `document.querySelector('[data-job="contoso-pharma-head-of-digital-quality"]').click()` },
  { eval: `window.__SAMPLE = ${JSON.stringify({ analysis })}` }, { click: 'Create the application pack', sel: 'button', wait: 1000 }],
  expect: `(() => { const t = document.querySelector('#detail .err')?.textContent || '(no error shown)';
    return !${want}.test(t) ? 'error says: ' + t : t.includes('hands-on lead') ? 'error shows the answer: ' + t
      : window.__prompts.length !== 1 ? 'Claude was asked ' + window.__prompts.length + ' times' : !__byText('Create the application pack', 'button') ? 'no button to try again' : true; })()` });
const cutReply = '```json\n{"summary": "Made-up example. A hands-on lead for a {cloud} QMS rollout across 5 sites.", "skills": ["Electronic QMS", "CSA"], "fit": {"score": 72, "rows": [{"req": "Electronic QMS rollout", "evidence": "Led an electronic QMS at 3 si';
const badReply = 'Here is the analysis. {"summary": "Made-up example. A hands-on lead for a QMS rollout.", "skills": ["Electronic QMS", "CSA",]} I hope it helps.';

export const shots = [
  { name: 'dashboard', page: 'main', width: 1200, height: 860, steps: [...progress, tab('Materials'), { eval: 'window.scrollTo(0, 0)' }] },
  { name: 'add-interview', page: 'main', width: 1200, height: 1000, clip: "document.getElementById('dlg-edit')", steps: [
    { click: 'Add interview', sel: 'button' },
    { eval: [fill('f-company', 'Woodgrove Labs'), fill('f-role', 'Head of Validation'), fill('f-date', day(16)), fill('f-time', '09:30'), fill('f-format', 'Video call'),
      fill('f-focus', 'CSA, GAMP 5, team leadership'), fill('f-interviewers', 'Head of Quality (hiring manager)'), fill('f-job', 'https://example.com/jobs/head-of-validation'),
      fill('f-jd', 'Made-up example. Woodgrove Labs is looking for a Head of Validation to set a risk-based CSA approach for its lab systems and lead a team of 4.'),
      "document.getElementById('f-request').checked = true;"].join('\n') }] },
  { name: 'materials', page: 'main', width: 1200, height: 900, clip: panel, maxHeight: 668, steps: [...progress, tab('Materials')] },
  { name: 'checklist', page: 'main', width: 1200, height: 900, clip: panel, steps: progress },
  { name: 'flashcards', page: 'main', width: 1200, height: 900, clip: panel, steps: [...progress, tab('Flashcards')] },
  { name: 'mock-chat', page: 'main', width: 1200, height: 900, clip: panel, maxHeight: 1400, steps: [...progress, tab('Mock interview'),
    { eval: fill('chat-input', "I'd keep one global template and a pilot site, then go live in waves of two sites. Each wave gets a site owner, a validation lead and a go-live checklist the site signs off.") }] },
  { name: 'copy-notebooklm', page: 'main', width: 1200, height: 1000, clip: "document.getElementById('dlg-nlm')", steps: [tab('Mock interview'), { click: 'Copy for NotebookLM', sel: 'button' }, { wait: 800 },
    { eval: "(() => { const t = document.getElementById('nlm-text'); t.setSelectionRange(0, 0); t.scrollTop = 0; t.blur(); getSelection().removeAllRanges(); })()" }] },
  { name: 'voice-mock', page: 'voice', width: 1200, height: 900, clip: panel, maxHeight: 640, steps: [...progress, tab('Mock interview')] },
  { name: 'application-fit', page: 'main', width: 1200, height: 900, steps: [{ click: 'Applications', sel: 'button' }, tab('Fit')] },
  { name: 'application-cv', page: 'main', width: 1200, height: 900, clip: panel, maxHeight: 900, steps: [{ click: 'Applications', sel: 'button' }, tab('CV')] },
  packFails('test-pack-cut-off', { code: 'invalid_json', message: 'stub', text: cutReply }, new RegExp(`fit analysis stopped after ${cutReply.length} characters, before it was complete.*job description`)),
  packFails('test-pack-not-json', { code: 'invalid_json', message: 'stub', text: badReply }, new RegExp(`fit analysis \\(${badReply.length} characters\\) was not in the format`)),
  packFails('test-pack-wrong-shape', { result: 'Made-up example. A hands-on lead.' }, /fit analysis \(\d+ characters\) did not have the fields/),
];
