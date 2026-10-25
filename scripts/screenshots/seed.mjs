// Made-up data for the guide's screenshots: Robin Muster from examples/profile.example.md and invented companies.
// Dates are relative to the day you run it, so the countdowns look the same every time.
import { readFileSync } from 'node:fs';

export const day = n => { const d = new Date(); d.setUTCHours(12, 0, 0, 0); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const at = (n, hhmm) => `${day(n)}T${hhmm}:00Z`;

const profile = { name: 'Robin', markdown: readFileSync(new URL('../../examples/profile.example.md', import.meta.url), 'utf8'), updatedAt: at(-8, '08:00') };

const briefing = `## Company snapshot
Contoso Pharma is a made-up mid-size maker of sterile injectables with five sites in Europe. It is moving its quality processes from paper and older tools to one cloud QMS by the end of 2027.

## The role and what they are really hiring for
A hands-on leader who can land the QMS rollout across five sites on time, keep inspections clean during the change and build a team of 6 that runs the system afterwards.

## Your fit
| Requirement | Evidence from profile | Strength |
|---|---|---|
| Electronic QMS implementation | Electronic QMS at 3 sites, Northwind Therapeutics | strong |
| Risk-based validation (CSA) | Introduced CSA, about 30% less validation effort | strong |
| Data integrity | ALCOA+ programme, 200 staff trained, Fabrikam Biologics | strong |
| Team building | Leads a team of 9 | strong |
| Five-site scope | 3 sites so far [add figure] | partial |

## Your gaps and how to address them
- Five sites instead of three: explain the rollout model you would reuse and what you would change.
- Vendor management is not in your CV: prepare one example.

## Likely interview themes
Rollout governance, CSA, data integrity during the migration, leading people through change.

## Questions you should ask
- What does success look like after 12 months?
- Who owns the QMS budget?

## Things to watch out for
Do not overclaim multi-country experience.

## 60-second pitch
I lead quality systems at Northwind Therapeutics, where I moved three sites from paper to an electronic QMS and cut CAPA cycle time from 62 to 38 days. I want to do that at five sites, with the validation approach built in from day one.`;

const faq = [
  { q: 'Why do you want this role?', kind: 'motivation', a: 'Because it is the rollout I have already delivered at three sites, now at five, and I want to lead it end to end. At Northwind I saw what an electronic QMS does for CAPA cycle time: it fell from 62 to 38 days.' },
  { q: 'How would you run the rollout across five sites?', kind: 'business', a: 'One global template, one pilot site, then waves of two sites. Each wave has a site owner, a validation lead and a go-live checklist that the site signs off.' },
  { q: 'How do you apply CSA without weakening compliance?', kind: 'technical', a: 'I classify each function by its risk to patient safety and product quality, then put scripted testing where the risk is high and unscripted testing where it is low. At Northwind that cut validation effort for low-risk systems by about 30%.' },
  { q: 'Tell us about a rollout that did not go to plan.', kind: 'behavioral', a: '**Situation:** go-live at the second site slipped. **Task:** recover without losing the inspection window. **Action:** I split the release and moved training forward. **Result:** live 3 weeks later [add figure].' },
  { q: 'Tell us about a time you brought a sceptical team with you.', kind: 'behavioral', a: '**Situation:** the deviation team preferred paper. **Task:** move them to the new QMS. **Action:** I made two of them super users and fixed their top three complaints first. **Result:** the site went live on time.' },
  { q: 'How would you build the team of 6?', kind: 'leadership', a: 'Two validation engineers, two QMS administrators, one data integrity lead and one trainer, hired in that order so the pilot has validation cover first.' },
];
const quiz = [
  { q: 'Which EU GMP annex covers computerised systems?', o: ['Annex 1', 'Annex 11', 'Annex 15', 'Annex 16'], a: 1, why: 'Annex 11 sets the rules for computerised systems.' },
  { q: 'What does CSA stand for?', o: ['Computer Software Assurance', 'Continuous System Audit', 'Controlled System Access', 'Critical Supplier Assessment'], a: 0, why: 'CSA is the risk-based approach to software assurance.' },
  { q: 'How many sites is the Contoso rollout planned for?', o: ['Two', 'Three', 'Five', 'Seven'], a: 2, why: 'The made-up posting names five sites.' },
  { q: 'Which principle set describes good data integrity?', o: ['SMART', 'RACI', 'SIPOC', 'ALCOA+'], a: 3, why: 'ALCOA+ lists the attributes of reliable records.' },
];
const cards = [
  { f: 'Contoso Pharma rollout scope', b: 'One cloud QMS across 5 sites by the end of 2027 (made-up example).', k: true },
  { f: 'CSA in one sentence', b: 'Risk-based assurance that puts testing effort where software can affect patient safety or product quality.', k: true },
  { f: 'Your strongest proof point', b: 'CAPA cycle time from 62 to 38 days after the electronic QMS rollout at Northwind.', k: false },
  { f: 'ALCOA+', b: 'Attributable, legible, contemporaneous, original, accurate, plus complete, consistent, enduring and available.', k: false },
  { f: 'EU GMP Annex 11', b: 'The EU rules for computerised systems in GMP.', k: false },
  { f: 'Your gap: five sites', b: 'Explain how the three-site model scales: one template, a pilot, then waves of two sites.', k: false },
  { f: 'Team you would build', b: 'Two validation engineers, two QMS admins, a data integrity lead and a trainer.', k: false },
  { f: 'Question to ask', b: 'What does success look like after 12 months?', k: false },
];
const turns = [
  { r: 'i', t: "Good morning Robin, thanks for making the time today. Let's start: walk me through your background, and tell me why you're interested in this role at Contoso Pharma." },
  { r: 'c', t: "I've spent 14 years in pharma quality. At Northwind Therapeutics I lead quality systems, and we moved three sites from paper to an electronic QMS. Contoso is doing the same at five sites, and I'd like to lead that end to end." },
  { r: 'i', t: '**Feedback:** Clear and relevant, and you tied your experience to the role. You left out the result that makes it memorable, and you did not say what changes at five sites.\n\n**Stronger answer:** I have 14 years in pharmaceutical quality. At Northwind Therapeutics I lead a team of 9 across quality systems, validation and data integrity, and I replaced a paper deviation and CAPA process with an electronic QMS at 3 sites. CAPA cycle time fell from 62 to 38 days. Before that I validated MES and LIMS for a new biologics plant, and the first inspection found no critical issues. Contoso is rolling out one QMS across 5 sites, the same problem at a larger scale, and I want to lead it with the validation approach built in from day one.\n\n**Next:** "You did three sites. What would you change to make it work at five?"' },
];
const script = [
  "Walk me through your background, and tell me why you're interested in this role at Contoso Pharma.",
  'You rolled out an electronic QMS at three sites. How would you scale that to five?',
  'How would you set the validation approach for the new QMS?',
  'Tell me about a time a go-live slipped. What did you do?',
  'How do you keep data integrity intact during a migration?',
  'How would you build and lead the team of 6?',
  'How have you managed a software vendor through a validation?',
  'What would you want to have achieved after 12 months?',
];

const contoso = {
  company: 'Contoso Pharma', role: 'Head of Digital Quality', date: day(3), time: '10:00',
  format: 'Video call, then an onsite panel', interviewers: 'VP Quality (hiring manager), HR business partner',
  focus: 'Electronic QMS rollout, computer software assurance, data integrity, building a team',
  job_link: 'https://example.com/jobs/head-of-digital-quality',
  jd: 'Made-up example. Contoso Pharma, Basel area, full time, permanent. Leads the rollout of a cloud QMS across 5 sites, sets the validation approach (risk-based CSA), owns data integrity and builds a team of 6. Asks for 10+ years in GMP quality, hands-on electronic QMS implementation and people leadership. German is a plus. (Summary of the posting; the full text is at the job link.)',
  prepRequested: false, prepped: true, prepError: '', syncedAt: at(0, '06:58'),
  notes: 'Mention the Northwind CAPA numbers early. Ask who owns the QMS budget.',
  checks: {}, questions: ['How is the QMS rollout governed across the five sites?', 'What does success look like after 12 months?'],
  quizScore: '', cards,
  materials: { generatedAt: at(0, '06:58'), briefing, faq, quiz, sources: [
    { t: 'Contoso Pharma, about us (made-up)', u: 'https://example.com/contoso-pharma' },
    { t: 'Computer software assurance overview (made-up)', u: 'https://example.com/csa' },
    { t: 'EU GMP Annex 11 summary (made-up)', u: 'https://example.com/annex-11' } ] },
  mockChat: { turns, updatedAt: at(0, '07:30') },
  createdAt: at(-3, '09:12'),
};
const trey = {
  company: 'Trey Research', role: 'Director of Quality Systems', date: day(8), time: '14:00',
  format: 'Onsite, three rounds', interviewers: 'Head of Quality Operations, Site Director', focus: 'QMS strategy, inspection readiness, team leadership',
  job_link: 'https://example.com/jobs/director-quality-systems', jd: 'Made-up example. (Summary of the description the user pasted.)',
  prepRequested: true, prepped: false, prepError: '', notes: '', checks: {}, cards: [], questions: [], quizScore: '', createdAt: at(-1, '16:40'),
};
const proseware = {
  company: 'Proseware Health', role: 'Senior Manager QMS Transformation', date: '', time: '', format: '', interviewers: '', focus: 'QMS transformation, change management',
  job_link: 'https://example.com/jobs/senior-manager-qms', jd: 'Made-up example. (Summary of the posting; the full text is at the job link.)',
  prepRequested: false, prepped: false, prepError: '', notes: '', checks: {}, cards: [], questions: [], quizScore: '', createdAt: at(0, '07:05'),
};
const withVoice = { ...contoso, notebook_url: 'https://notebooklm.google.com/', voice: { status: 'ready', audioTitle: 'Contoso Pharma mock interview', audioId: 'a1', script, updatedAt: at(0, '07:45'), error: '', practised: { 0: true, 1: true } } };

const others = [{ id: `trey-research-${day(8)}`, data: trey }, { id: 'proseware-health-undated', data: proseware }];

// Applications: one application pack, written as Claude would for Robin and a made-up Head of Validation job.
const pack = (company, role) => ({
  analysis: {
    summary: `${company} needs someone to set a risk-based validation approach for its lab systems and lead a small team through a LIMS replacement, while keeping inspections clean. They want a lead who has applied CSA in practice, not only on paper.`,
    skills: ['Computer software assurance (CSA)', 'GAMP 5', 'LIMS validation', 'EU GMP Annex 11', '21 CFR Part 11', 'Data integrity (ALCOA+)', 'Team leadership', 'Inspection readiness'],
    responsibilities: ['Set and own the validation strategy for lab systems', 'Lead the validation of the new LIMS', 'Keep systems in a validated state with periodic reviews', 'Lead and develop a team of 4 validation engineers', 'Represent validation in inspections and audits'],
    goals: ['A validated LIMS live within 18 months', 'Less validation effort without new inspection findings', 'A team that runs the validated state on its own'],
    keywords: ['computer software assurance', 'CSA', 'GAMP 5', 'LIMS', 'risk-based validation', 'EU GMP Annex 11', '21 CFR Part 11', 'data integrity', 'ALCOA+', 'validation master plan', 'periodic review', 'inspection readiness', 'team leadership', 'change control', 'computerised systems'],
    standout: ['Has cut validation effort with CSA', 'Has validated a LIMS for a new plant', 'Builds data integrity habits across a site'],
    fit: { score: 78, rows: [
      { req: 'Risk-based validation (CSA)', evidence: 'Introduced CSA at Northwind Therapeutics; about 30% less validation effort for low-risk systems', level: 'strong' },
      { req: 'LIMS validation', evidence: 'Owned MES and LIMS validation for a new biologics plant at Fabrikam Biologics', level: 'strong' },
      { req: 'Inspection readiness', evidence: 'The new plant\'s first regulatory inspection found no critical issues', level: 'strong' },
      { req: 'Data integrity', evidence: 'Built the ALCOA+ programme and trained 200 staff', level: 'strong' },
      { req: 'Leading a validation team', evidence: 'Leads a team of 9 across quality systems, validation and data integrity', level: 'strong' },
      { req: 'Validation master plan', evidence: 'Implied by owning MES and LIMS validation, but not named in the CV', level: 'partial' },
      { req: 'Chromatography data systems and ELN', evidence: '', level: 'gap' } ],
      gaps: [
        { gap: 'Chromatography data systems and ELN', how: 'Explain how your CSA approach applies to lab instruments, and do not claim CDS experience.' },
        { gap: 'Validation master plan', how: 'Describe how you set the validation approach at Northwind, and offer to write the plan in your first 90 days.' } ] },
    ats: { missing: ['validation master plan', 'periodic review', 'computerised systems'],
      weak: ['Your CV names CSA but not how many systems you cover [add figure]', 'The LIMS work sits under your 2016 to 2021 role; bring it into the summary'],
      summary: 'Validation and quality systems leader with 14 years in GMP manufacturing. Introduced computer software assurance at Northwind Therapeutics, cutting validation effort for low-risk systems by about 30%, and owned MES and LIMS validation for a new biologics plant whose first inspection found no critical issues. Leads a team of 9 and builds data integrity habits (ALCOA+) across sites.' },
    generatedAt: at(-1, '18:20') },
  cv: {
    name: 'Robin Muster', headline: 'Validation and quality systems leader | CSA, GAMP 5, LIMS',
    summary: 'Validation and quality systems leader with 14 years in GMP manufacturing. Introduced computer software assurance at Northwind Therapeutics, cutting validation effort for low-risk systems by about 30%, and owned MES and LIMS validation for a new biologics plant whose first inspection found no critical issues. Leads a team of 9 and builds data integrity habits (ALCOA+) across sites.',
    skills: ['Computer software assurance (CSA)', 'GAMP 5', 'CSV', 'LIMS and MES validation', 'EU GMP Annex 11', '21 CFR Part 11', 'Data integrity (ALCOA+)', 'Electronic QMS rollouts', 'Change control', 'Supplier qualification', 'Team leadership', 'Stakeholder management'],
    experience: [
      { title: 'Head of Quality Systems', company: 'Northwind Therapeutics', location: '', dates: '2021 to today', bullets: [
        'Lead a team of 9 across quality systems, validation and data integrity, covering [add figure] GMP computerised systems.',
        'Introduced risk-based computer software assurance (CSA), cutting validation effort for low-risk systems by about 30%.',
        'Replaced a paper-based deviation and CAPA process with an electronic QMS at 3 sites, reducing CAPA cycle time from 62 to 38 days.'] },
      { title: 'Validation Lead', company: 'Fabrikam Biologics', location: '', dates: '2016 to 2021', bullets: [
        'Owned the validation of MES and LIMS for a new biologics plant; the first regulatory inspection found no critical issues.',
        'Built the site data integrity programme (ALCOA+) and trained 200 staff.'] },
      { title: 'Quality Engineer', company: 'Litware Labs', location: '', dates: '2011 to 2016', bullets: ['Ran change control and supplier qualification for a sterile filling line.'] } ],
    education: [{ degree: 'MSc Pharmaceutical Sciences', school: '', dates: '2011' }],
    certifications: [], languages: ['English (fluent)', 'German (fluent)', 'French (basic)'], other: [],
    labels: { summary: 'Summary', skills: 'Skills', experience: 'Experience', education: 'Education', certifications: 'Certifications', languages: 'Languages', other: 'Other' },
    generatedAt: at(-1, '18:22') },
  letters: {
    subject: `Application for ${role}`,
    coverLetter: `Dear Hiring Team,\n\n${company} wants a risk-based validation approach for its lab systems and a team that keeps them in a validated state. That is the work I have led in my last two roles, and I would like to do it for you.\n\nAt Northwind Therapeutics I introduced computer software assurance, which cut validation effort for low-risk systems by about 30%. Before that, at Fabrikam Biologics, I owned the validation of MES and LIMS for a new biologics plant, and its first regulatory inspection found no critical issues. I also built the site's data integrity programme and trained 200 staff.\n\nToday I lead a team of 9 across quality systems, validation and data integrity. I would bring the same approach to your LIMS replacement: one validation strategy, testing effort where the risk is, and a team that owns the validated state after go-live.\n\nI would welcome the chance to talk about how this could work at ${company}.\n\nKind regards,\nRobin Muster`,
    message: `Hello, I have just applied for the ${role} role at ${company}. I introduced computer software assurance at Northwind Therapeutics, cutting validation effort for low-risk systems by about 30%, and validated MES and LIMS for a new biologics plant. I would be glad to talk about your LIMS replacement. Best regards, Robin Muster`,
    followUpSubject: `${role} application`,
    followUpBody: `Dear Hiring Team,\n\nI applied for the ${role} role last week and wanted to check that my application arrived. I remain very interested, especially in the LIMS replacement, and I am happy to share more about the CSA approach I introduced at Northwind Therapeutics.\n\nKind regards,\nRobin Muster`,
    lang: 'en', generatedAt: at(-1, '18:24') },
  review: {
    verdict: 'shortlist',
    summary: 'A strong match on CSA, LIMS validation and team leadership, with results that have numbers. The letter speaks to the LIMS replacement. Lab systems beyond LIMS are the gap, and the letter does not mention them.',
    strengths: ['CSA in practice, with a result: about 30% less validation effort', 'LIMS validation for a new plant and a clean first inspection', 'Leads a larger team than the posting asks for', 'A data integrity programme with 200 staff trained'],
    weaknesses: ['No chromatography data system or ELN experience', 'The number of systems covered is still [add figure]', 'Ownership of a validation master plan is implied, not stated'],
    fixes: ['Fill in [add figure] with the number of GMP systems you cover', 'Add one line on the validation strategy you set at Northwind', 'Say how CSA would apply to lab instruments, without claiming CDS experience', 'Move the LIMS result higher in the summary'],
    generatedAt: at(-1, '18:25') },
});
const jd = company => `Made-up example. ${company}, full time, permanent. Leads validation for the lab systems and the replacement of the LIMS, sets a risk-based CSA approach, keeps systems in a validated state and leads a team of 4 validation engineers. Asks for 8+ years of GMP validation, hands-on LIMS validation, GAMP 5 and EU GMP Annex 11, and team leadership. Inspection experience and German are a plus. Offers hybrid work, two days a week on site.`;
const jobs = [
  { id: 'woodgrove-labs-head-of-validation', data: { company: 'Woodgrove Labs', role: 'Head of Validation', location: 'Basel area, hybrid', job_link: 'https://example.com/jobs/head-of-validation',
    jd: jd('Woodgrove Labs'), status: 'interested', appliedAt: '', followedUpAt: '', notes: '', pack: pack('Woodgrove Labs', 'Head of Validation'), createdAt: at(-1, '18:10') } },
  { id: 'lamna-healthcare-director-quality-systems', data: { company: 'Lamna Healthcare', role: 'Director Quality Systems', location: 'Zurich', job_link: 'https://example.com/jobs/director-quality-systems',
    jd: jd('Lamna Healthcare'), status: 'applied', appliedAt: day(-9), followedUpAt: '', notes: 'Applied through the company site.', pack: pack('Lamna Healthcare', 'Director Quality Systems'), createdAt: at(-10, '20:05') } },
  { id: 'contoso-pharma-head-of-digital-quality', data: { company: 'Contoso Pharma', role: 'Head of Digital Quality', location: 'Basel area', job_link: 'https://example.com/jobs/head-of-digital-quality',
    jd: contoso.jd, status: 'interviewing', appliedAt: day(-16), followedUpAt: day(-8), notes: '', interviewId: `contoso-pharma-${day(3)}`, createdAt: at(-17, '19:30') } },
  { id: 'adatum-pharma-quality-systems-manager', data: { company: 'Adatum Pharma', role: 'Quality Systems Manager', location: 'Remote', job_link: '', jd: '', status: 'closed', appliedAt: day(-30), followedUpAt: day(-22), notes: 'They chose an internal candidate.', createdAt: at(-31, '08:15') } },
];
export const scenarios = {
  main: { profile, interviews: [{ id: `contoso-pharma-${day(3)}`, data: contoso }, ...others], jobs },
  voice: { profile, voice: { enabled: true, time: '09:30', updatedAt: at(0, '07:00') }, interviews: [{ id: `contoso-pharma-${day(3)}`, data: withVoice }, ...others] },
};
