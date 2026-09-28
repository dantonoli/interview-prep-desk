# Data model

The dashboard artifact's database holds three collections. The page writes through `db`; skills and routines write through the `ArtifactData` tool. An update merges nested objects and replaces arrays whole. Writers pin each update to the version they read (`if_version`) and, on a conflict, read again and redo only their own change.

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

## `settings/voice`

Written by the voice add-on's setup. The dashboard shows the voice mock controls only when `enabled` is true, or when an interview already has `notebook_url`, `voiceRequested` or `voice` data.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `enabled` | boolean | voice add-on | Turns the voice controls on or off. |
| `time` | `HH:MM` | voice add-on | Time of the daily voice task. |
| `updatedAt` | ISO 8601 | voice add-on | |

## Who picks what

- **Prep** works on an interview when `prepRequested` is true, or when `date` is within the next 7 days and `materials.generatedAt` is missing. It skips `example` records and past dates.
- **Voice add-on** builds a notebook when `notebook_url` is empty, `materials.generatedAt` is set, and the date is within 7 days or `voiceRequested` is true. It makes a new audio when `notebook_url` is set and `voiceRequested` is true, and refreshes the status while `voice.status` is `generating`.
