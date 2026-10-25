# Data model

The dashboard artifact's database holds four collections. The page writes through `db`; skills and routines write through the `ArtifactData` tool. An update merges nested objects and replaces arrays whole. Writers pin each update to the version they read (`if_version`) and, on a conflict, read again and redo only their own change.

## `profile/main`

The dashboard's profile dialog saves the whole document and keeps any field it does not edit.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `name` | string | user | How the interviewers address the candidate. Used by the practice chat. |
| `markdown` | string | user | The CV, without contact details. Setup writes the first version. |
| `updatedAt` | ISO 8601 | user | |

## `interviews/<id>`

`id` is `slug(company + "-" + (date or "undated"))`, the same rule as `slug()` in the dashboard:

1. Lowercase, and "ß" becomes "ss".
2. Remove accents: Unicode NFKD, then drop the combining marks, so "Bühler" gives "buhler".
3. Every run of characters other than `a-z` and `0-9` becomes one `-`; leading and trailing `-` are removed.
4. Cut to 60 characters and remove a trailing `-` again. An empty result becomes `x`.
5. If the id is taken, append `-2`, then `-3`, and so on.

For example "Société Générale" with no date gives `societe-generale-undated`.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `company`, `role` | string | user | Required. |
| `date`, `time` | `YYYY-MM-DD`, `HH:MM` | user | Empty until the interview is scheduled. |
| `format`, `interviewers`, `focus` | string | user | Free text. |
| `job_link` | URL | user | The posting, without tracking parameters. |
| `jd` | string | user | Job description summary, at most 20,000 characters. |
| `notes` | string | user | Never written by routines. |
| `checks` | object of booleans | user | Checklist state, for example `quiz`, `cards`, `ask`, `mock`. |
| `questions` | array of strings | user | The candidate's questions for the interviewers. |
| `quizScore` | string | user | For example `9/12`. |
| `cards` | array of `{f, b, k}` | prep, then user | Prep writes 20 cards only while the list is empty. After that, `k` (known) is the user's drill progress. |
| `prepRequested` | boolean | user sets true, prep sets false | Queues prep for the next run. |
| `prepped`, `prepError`, `syncedAt` | boolean, string, ISO 8601 | prep | |
| `materials` | object | prep | `generatedAt`, `briefing` (markdown), `faq` (`{q, a, kind}`), `quiz` (`{q, o, a, why}` with four options), `sources` (`{t, u}`). Under 150 KB. |
| `voiceRequested` | boolean | user sets true, voice add-on sets false | Queues a voice mock. |
| `notebook_url` | URL | voice add-on | |
| `voice` | object | voice add-on | `status` (`generating`, `ready` or `failed`), `audioTitle`, `audioId`, `script` (the questions), `updatedAt`, `error`. |
| `voice.practised` | object of booleans, keyed by the 0-based question index | user | Ticked questions. The voice add-on deletes it only when it writes a new script. |
| `mockChat` | object | dashboard | `turns` (`{r, t}`, where `r` is `i` for interviewer or `c` for candidate) and `updatedAt`. |
| `createdAt` | ISO 8601 | creator | |
| `example` | boolean | creator | `true` marks a sample record. Routines skip it. |

## `jobs/<id>`

A job the candidate is considering or has applied to. `id` is `slug(company + "-" + role)`, with the same rule and the same `-2`, `-3` suffixes as interviews.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `company`, `role` | string | user | Required. |
| `location` | string | user | Free text, for example the city and whether the job is remote or hybrid. |
| `job_link` | URL | user | The posting, without tracking parameters. |
| `jd` | string | user | The job description the user pasted, or the `add-job` skill's summary. At most 20,000 characters. |
| `status` | string | user | `interested`, `applied`, `interviewing`, `offer` or `closed`. |
| `appliedAt` | `YYYY-MM-DD` | user | Set when the user marks the job as applied. |
| `followedUpAt` | `YYYY-MM-DD` | user | Set when the user marks the follow-up as sent. The dashboard asks for a follow-up 7 days after `appliedAt` while `status` is `applied` and this is empty. |
| `notes` | string | user | |
| `pack` | object | dashboard | The application pack, written by Claude through `sample` when the user asks. Four parts, each with its own `generatedAt`; see below. The dashboard caps every field, so a pack stays under 90,000 characters. |
| `interviewId` | string | dashboard | The interview record made from this job with "Interview booked". |
| `createdAt` | ISO 8601 | creator | |

`pack` parts:

- `analysis`: `summary` (what they are really hiring for), `skills`, `responsibilities`, `goals`, `keywords` (the ATS keywords), `standout` (all arrays of strings), `fit` (`score` 0 to 100, `rows` of `{req, evidence, level}` where `level` is `strong`, `partial` or `gap`, and `gaps` of `{gap, how}`), and `ats` (`missing` keywords, `weak` points, and a rewritten `summary`).
- `cv`: the tailored CV for the Word file. `name`, `headline`, `summary`, `skills` (strings), `experience` (`{title, company, location, dates, bullets}`), `education` (`{degree, school, dates}`), `certifications`, `languages` and `other` (strings), and `labels` (the section headings in the language of the job).
- `letters`: `subject` and `coverLetter`, `message` (a short note to the recruiter), `followUpSubject` and `followUpBody`, and `lang` (the language code of the texts, used to write the date on the letter).
- `review`: a recruiter's view of the tailored CV and cover letter. `verdict` (`shortlist`, `maybe` or `reject`), `summary`, `strengths`, `weaknesses` and `fixes`.

Every part uses only facts from the profile, with `[add figure]` where a number is missing. Contact details are never stored: the contact line printed on the Word files stays in the viewer's own browser storage.

## `settings/voice`

Written by the voice add-on's setup. The dashboard shows the voice mock controls only when `enabled` is true, or when an interview already has `notebook_url`, `voiceRequested` or `voice` data.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `enabled` | boolean | voice add-on | Turns the voice controls on or off. |
| `time` | `HH:MM` | voice add-on | Time of the daily voice task. |
| `updatedAt` | ISO 8601 | voice add-on | |

## Who picks what

- **Prep** works on an interview when `prepRequested` is true, or when `date` is within the next 7 days and `materials.generatedAt` is missing. It skips `example` records and past dates.
- **Applications** have no routine. The dashboard writes `pack` only when the user asks for it, and routines never read or write `jobs`.
- **Voice add-on** builds a notebook when `notebook_url` is empty, `materials.generatedAt` is set, and the date is within 7 days or `voiceRequested` is true. It makes a new audio when `notebook_url` is set and `voiceRequested` is true, and refreshes the status while `voice.status` is `generating`.
