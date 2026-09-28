# Interview Prep Desk Voice Mock

An optional add-on for Interview Prep Desk. For each interview it builds a notebook in Google NotebookLM (Gemini Notebook) with your CV, the job and a mock interview script, plus an Audio Overview in which two interviewers question you. You join it in NotebookLM and answer out loud. The dashboard's Mock interview tab shows the link and the questions.

## Before you install

- It uploads your CV, the job description and briefing excerpts to NotebookLM in your own Google account.
- It works through [gemini-notebook-mcp-cli](https://github.com/jacob-bd/gemini-notebook-mcp-cli), an unofficial community tool that signs in with your Google browser cookies. It is not made or supported by Google or Anthropic and can stop working when Google changes NotebookLM.
- The daily task needs the Claude desktop app and runs only while the app is open and the computer is awake.

## Commands

| Command | What it does |
|---|---|
| `/interview-prep-desk-voice:setup` | Checks the NotebookLM tool, schedules the daily voice task and turns on the voice controls in your dashboard. |
| `/interview-prep-desk-voice:voice-mock <company>` | Builds or refreshes the voice mock for one interview now. |

Installing it also installs the core plugin, `interview-prep-desk`, which it needs.

Step-by-step guide: https://github.com/dantonoli/interview-prep-desk/blob/main/docs/guide.md#step-7-rehearse-out-loud-in-notebooklm

Documentation and privacy notes: https://github.com/dantonoli/interview-prep-desk
