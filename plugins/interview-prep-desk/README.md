# Interview Prep Desk

One private dashboard for interview prep. Add a job, and Claude researches the company and the role, then writes a briefing, likely questions with answers built from your CV, a quiz and flashcards. You rehearse in a practice chat where Claude plays the interviewer, gives feedback after each answer and ends with a hiring verdict.

## Where it runs

Claude Code: the terminal, an IDE extension, or the Code tab of the Claude desktop app. The commands need Claude Code's artifact and file tools, so in claude.ai chat and in Cowork they explain this and stop.

## Commands

| Command | What it does |
|---|---|
| `/interview-prep-desk:setup` | Publishes your private dashboard, saves your CV without contact details, and offers to schedule the morning prep. Run `/interview-prep-desk:setup update` later to move your dashboard to a new version. |
| `/interview-prep-desk:add-interview <job link or text>` | Adds an interview and queues it for prep. |
| `/interview-prep-desk:prep <company>` | Researches and writes the materials now instead of at the next morning run. |

## What it stores, sends and schedules

- **Stores:** your CV without contact details, your interviews, the prepared materials and your practice chats, in the database of your own private claude.ai artifact; and a small config file with the dashboard link, the name interviewers should use and your timezone, at `~/.config/interview-prep-desk/config.json`.
- **Sends:** web searches about the company, the role and the interviewers you enter; your CV, the job and the briefing to Claude on your own account when it prepares materials or runs the practice chat. Nothing goes to the plugin's author: there is no server, analytics or tracking.
- **Schedules:** one daily morning prep routine on your account, and only if you confirm it during setup.
- **Keeps:** everything until you delete it. Delete interviews in the dashboard, or the dashboard artifact to remove everything; delete the config file and the routine to stop the plugin.

Privacy policy: https://github.com/dantonoli/interview-prep-desk/blob/main/docs/privacy.md

Support: https://github.com/dantonoli/interview-prep-desk/issues

Security reports: https://github.com/dantonoli/interview-prep-desk/security/advisories/new

MIT license. Source: https://github.com/dantonoli/interview-prep-desk
