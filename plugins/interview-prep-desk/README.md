# Interview Prep Desk

One private dashboard for job applications and interview prep. Add a job you want, and Claude writes an application pack from your CV: a fit analysis, a tailored CV and a cover letter as Word files, a recruiter message and a follow-up email. Once an interview is booked, Claude researches the company and the role, then writes a briefing, likely questions with answers built from your CV, a quiz and flashcards. You rehearse in a practice chat where Claude plays the interviewer, gives feedback after each answer and ends with a hiring verdict.

## Where it runs

Claude Code: the terminal, an IDE extension, or the Code tab of the Claude desktop app. The commands need Claude Code's artifact and file tools, so in claude.ai chat and in Cowork they explain this and stop.

## Commands

| Command | What it does |
|---|---|
| `/interview-prep-desk:setup` | Publishes your private dashboard, saves your CV without contact details, and offers to schedule the morning prep. Run `/interview-prep-desk:setup update` later to move your dashboard to a new version. |
| `/interview-prep-desk:add-job <job link or text>` | Adds a job to the dashboard's Applications section. The application pack is created there. |
| `/interview-prep-desk:apply <company>` | Writes the Word files and fills in the employer's portal from your saved Application answers. You sign in and submit. |
| `/interview-prep-desk:add-interview <job link or text>` | Adds an interview and queues it for prep. |
| `/interview-prep-desk:prep <company>` | Researches and writes the materials now instead of at the next morning run. |

## What it stores, sends and schedules

- **Stores:** your CV without contact details, your jobs and application packs, your interviews, the prepared materials and your practice chats, in the database of your own private claude.ai artifact; the Word files you download, on your computer; your Application answers, in your own private part of that database; a contact line you type for those files, in your browser only; and a small config file with the dashboard link, the name interviewers should use and your timezone, at `~/.config/interview-prep-desk/config.json`.
- **Sends:** web searches about the company, the role and the interviewers you enter; your CV, the job and the briefing to Claude on your own account when it writes an application pack, prepares materials or runs the practice chat. Nothing is sent to employers: you apply and send messages yourself. Nothing goes to the plugin's author: there is no server, analytics or tracking.
- **Schedules:** one daily morning prep routine on your account, and only if you confirm it during setup.
- **Keeps:** everything until you delete it. Delete jobs and interviews in the dashboard, or the dashboard artifact to remove everything; delete the config file and the routine to stop the plugin.

Step-by-step guide: https://github.com/dantonoli/interview-prep-desk/blob/main/docs/guide.md

Privacy policy: https://github.com/dantonoli/interview-prep-desk/blob/main/docs/privacy.md

Support: https://github.com/dantonoli/interview-prep-desk/issues

Security reports: https://github.com/dantonoli/interview-prep-desk/security/advisories/new

MIT license. Source: https://github.com/dantonoli/interview-prep-desk
