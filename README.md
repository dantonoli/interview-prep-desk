# Interview Prep Desk

A Claude Code plugin that keeps your interview prep in one private dashboard and does the research for you.

Add an interview from a job link. Every morning a routine researches the company and the role, then writes a briefing, 15 likely questions with answers built from your CV, a quiz and flashcards into your dashboard. There you work through a checklist, drill the cards and rehearse in a practice chat: Claude plays the interviewer, pushes back on vague answers and shows you a stronger answer built only from your real experience. Optionally, your computer also builds a NotebookLM voice mock interview that you join and answer out loud.

> Status: early (0.1). Built for personal use and shared as is.

## What you get

- **Dashboard**: a private claude.ai artifact with your interview list, briefing, FAQ, quiz, flashcards, checklist and notes. Your data stays in the artifact's own database.
- **Morning prep**: a routine that prepares every interview in the next 7 days, plus any interview you queue.
- **Practice chat**: a mock interview in the dashboard's Mock interview tab. After each answer you get feedback, a stronger answer and a follow-up question, and at the end a hiring verdict with three things to fix.
- **Voice mock (optional)**: a NotebookLM notebook with an Audio Overview in which two interviewers question you, built by a scheduled task on your computer.

## Requirements

- Claude Code with artifact publishing that supports the `db` and `sample` capabilities. Availability depends on your Claude plan and organization settings.
- For the morning prep: claude.ai routines (`/schedule`), or scheduled tasks in the Claude desktop app.
- For the voice mock: the Claude desktop app and [gemini-notebook-mcp-cli](https://github.com/jacob-bd/gemini-notebook-mcp-cli), an unofficial community MCP server for NotebookLM (now Gemini Notebook). It signs in with your Google browser cookies and can stop working when Google changes the service.

## Install

```bash
claude plugin marketplace add dantonoli/interview-prep-desk
claude plugin install interview-prep-desk@interview-prep-desk
```

Then, in Claude Code:

```
/interview-prep-desk:setup
```

Setup publishes your own private copy of the dashboard, saves your CV to it without contact details, and schedules the morning prep. It asks before each step.

With Claude Code 2.1.275 or later you can also add and install in one step from inside a session: `/plugin install interview-prep-desk --marketplace dantonoli/interview-prep-desk`.

To get a new version later, run `claude plugin update interview-prep-desk@interview-prep-desk`, then `/interview-prep-desk:setup` and choose update so your dashboard gets the new page too.

## Everyday use

| You want to | Do this |
|---|---|
| Add an interview | `/interview-prep-desk:add-interview <job link>`, or the dashboard's Add interview button |
| Prepare one now instead of tomorrow morning | `/interview-prep-desk:prep <company>` |
| Build the voice mock now | `/interview-prep-desk:voice-mock <company>` |
| Update your dashboard to the latest version | `/interview-prep-desk:setup` again, then choose update |

## Privacy

Your CV and interviews live in your private artifact's database. Research queries go to web search. The practice chat sends your CV, the job and the briefing to Claude on your account. The voice mock uploads your CV and the job to NotebookLM. Sharing the dashboard shares all of it. Details: [docs/privacy.md](docs/privacy.md).

## Limits

- Artifacts cannot embed NotebookLM or use the microphone. The voice mock plays in NotebookLM; in the practice chat you type, or use your computer's dictation.
- Some job sites block automated reading. Paste the job description instead.
- The prep only knows what your CV says. Add your numbers to the profile; missing ones show up as `[add figure]`.

## How it works

[docs/architecture.md](docs/architecture.md) covers the components and trust boundaries, and [plugin/reference/data-model.md](plugin/reference/data-model.md) says which part owns each field.

## Credits

Inspired by a public post describing an interview prep workflow with Claude and NotebookLM.

## License

[MIT](LICENSE)
