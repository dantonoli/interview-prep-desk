# Interview Prep Desk

One private dashboard for interview prep, set up and kept up to date by Claude Code: a morning routine researches each interview and writes a briefing, FAQ, quiz and flashcards, and a practice chat plays the interviewer.

## Commands

| Command | What it does |
|---|---|
| `/interview-prep-desk:setup` | Publishes your private dashboard, saves your CV without contact details, and schedules the morning prep. Run it again to update the dashboard to a new version. |
| `/interview-prep-desk:add-interview <job link or text>` | Adds an interview and queues it for prep. |
| `/interview-prep-desk:prep <company>` | Researches and writes the materials now instead of at the next morning run. |
| `/interview-prep-desk:voice-mock <company>` | Builds the optional NotebookLM voice mock now. |

## Requirements

Claude Code with artifact publishing that supports the `db` and `sample` capabilities. The voice mock also needs the Claude desktop app and the unofficial community tool gemini-notebook-mcp-cli.

Documentation, privacy notes and source: https://github.com/dantonoli/interview-prep-desk
