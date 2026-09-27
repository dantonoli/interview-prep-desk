# Privacy

## Where your data goes

| Data | Stored in or sent to | When |
|---|---|---|
| CV, interviews, materials, practice chat | Your private artifact's database on claude.ai | Always |
| Research queries (company, role, interviewer names you entered) | Web search, through Claude | Each prep run |
| CV, job, briefing and your answers | Claude, on the account of whoever uses the practice chat | Practice chat |
| CV, job and briefing excerpts | Google NotebookLM | Voice mock, only if you set it up |
| Dashboard link, name, timezone | `~/.config/interview-prep-desk/config.json` on your computer | Setup |

Keep contact details (email, phone, address, date of birth) out of the profile. The prep does not need them.

Sharing the dashboard from its Share menu gives the other person your CV and everything else in it. Do not post its link. A link that contains `?sk=` works for anyone who has it.

## Keeping personal data out of this repo

`scripts/privacy-scan.mjs` runs before every commit (once the hook is on) and in CI. It fails on:

- email addresses outside `example.com` and `example.org`
- international phone numbers
- claude.ai artifact links with a real id, and `?sk=` share keys
- NotebookLM notebook links

- commit and tag identities whose email is not a GitHub noreply address (`<id>+<login>@users.noreply.github.com`)

It also reads an optional denylist of your own terms: your name, your employers, the companies you are interviewing with, the people interviewing you. Keep that file outside the repo and point to it with `git config privacy.denylist /path/to/file` or the `PRIVACY_DENYLIST` environment variable. The denylist applies to every file and to commit and tag identities, with no exceptions. The author appears only as the GitHub handle.

To keep your time zone out of the history as well, commit with `TZ=UTC` and turn on the check with `git config privacy.requireUtc true`.

If the scan flags something, remove it. Do not weaken the scan.
