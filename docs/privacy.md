# Privacy policy

Last updated: 28 September 2026. This policy covers the Interview Prep Desk plugin (`interview-prep-desk`) and its optional voice add-on (`interview-prep-desk-voice`).

## Summary

The plugins have no server. Their author does not receive, store or see any of your data, and the plugins contain no analytics or tracking. Everything they save stays in your own accounts and on your own computer, under your control.

## What is collected, why, and where it goes

| Data | Why | Where it is stored | Who else receives it |
|---|---|---|---|
| Your CV, without contact details | To write answers and find gaps from your real experience | Your private artifact's database on claude.ai | Claude, on your own account, when it prepares materials or runs the practice chat |
| The interviews you add: company, role, dates, interviewers, job description summary, notes | To prepare each interview | The same database | Web search, for research queries about them; Claude, on your own account |
| Prepared materials and practice chats | To show and continue your prep | The same database | Claude, on your own account, during the practice chat |
| Dashboard link, the name interviewers should use, timezone and run times | So the commands find your dashboard | `~/.config/interview-prep-desk/config.json` on your computer | Nobody |
| Voice add-on only: CV, job description and briefing excerpts | To build the voice mock | Notebooks in your own Google NotebookLM account | Google, through your NotebookLM account |

Setup removes contact details (email, phone, address, date of birth) from your CV before saving it. The plugins collect only what the prep needs.

## Retention and deletion

Nothing expires by itself. Your data stays until you delete it:

- Delete an interview in the dashboard to remove it with its materials and practice chat.
- Delete the dashboard artifact in your claude.ai artifacts to remove everything it holds.
- Delete `~/.config/interview-prep-desk/config.json`, delete any routine or scheduled task you created, and uninstall the plugins to stop them completely.
- Delete voice mock notebooks in NotebookLM.

Anthropic's and Google's own terms and privacy policies apply to the data held in your claude.ai and Google accounts.

## Sharing

The dashboard is private until you share it from its Share menu. Anyone you share it with sees your CV and everything else in it. A link that contains `?sk=` works for anyone who has it, so do not post it.

## Children

The plugins are meant for adults preparing for job interviews and are not intended for people under 18.

## Changes and contact

Changes to this policy are made in this file, and its history on GitHub shows every change. Questions: open an issue at https://github.com/dantonoli/interview-prep-desk/issues. Security or privacy problems: report them privately as described in [SECURITY.md](../SECURITY.md).

## Keeping personal data out of this repository

`scripts/privacy-scan.mjs` runs before every commit (once the hook is on) and in CI. It fails on:

- email addresses outside `example.com` and `example.org`
- international phone numbers
- claude.ai artifact links with a real id, and `?sk=` share keys
- NotebookLM notebook links
- commit and tag identities whose email is not a GitHub noreply address (`<id>+<login>@users.noreply.github.com`)
- images that carry metadata (EXIF, XMP and text chunks can hold an author, a device, a place or a file path), and any binary file other than a PNG or JPEG image, because the scan cannot read it

It also reads an optional denylist of your own terms: your name, your employers, the companies you are interviewing with, the people interviewing you. Keep that file outside the repo and point to it with `git config privacy.denylist /path/to/file` or the `PRIVACY_DENYLIST` environment variable. The denylist applies to every text file and to commit and tag identities, with no exceptions. The author appears only as the GitHub handle.

The scan cannot read text drawn inside an image. Images in this repository show only made-up data, so check every screenshot yourself before you add it.

To keep your time zone out of the history as well, commit with `TZ=UTC` and turn on the check with `git config privacy.requireUtc true`.

If the scan flags something, remove it. Do not weaken the scan.
