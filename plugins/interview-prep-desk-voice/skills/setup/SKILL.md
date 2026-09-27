---
name: setup
description: Set up the optional NotebookLM voice mock for an existing Interview Prep Desk. Checks the NotebookLM tool, schedules the daily voice task on this computer and turns on the voice controls in the dashboard.
disable-model-invocation: true
---

# Voice mock setup

Add the NotebookLM voice mock to an existing Interview Prep Desk. Ask before each step that installs, writes or schedules something. Never use an em dash character in anything you write. The database tool is `ArtifactData`; if it is not loaded yet, load it with ToolSearch "select:ArtifactData".

1. **Check where you run.** This needs Claude Code in the Claude desktop app, with the ArtifactData tool and the scheduled-tasks tools. If ArtifactData is missing (for example in claude.ai chat), tell the user to run this in Claude Code and stop.
2. **Check the core setup.** Read `~/.config/interview-prep-desk/config.json`. If it is missing, tell the user to run `/interview-prep-desk:setup` first and stop.
3. **Explain the trade-off and ask.** The voice mock uploads the CV, the job description and briefing excerpts to Google NotebookLM (Gemini Notebook) in the user's own Google account. It works through gemini-notebook-mcp-cli, an unofficial community tool that signs in with Google browser cookies and can stop working when Google changes the service. Ask whether to continue.
4. **Check the NotebookLM tool.** Look for its MCP tools (names ending in `server_info`, `notebook_create`, `source_add`, `studio_create`, `studio_status`). If they are missing, point the user to https://github.com/jacob-bd/gemini-notebook-mcp-cli to install it and sign in, then stop. Call `server_info`; if auth_status is "stale" or "not_configured", tell the user to run `nlm login` in a terminal and stop.
5. **Schedule the daily task.** Ask for the daily voice time (default 09:30). Fill `${CLAUDE_PLUGIN_ROOT}/templates/voice-routine.md` with the config values for `{{DASHBOARD_URL}}`, `{{CANDIDATE_NAME}}` and `{{TIMEZONE}}`. With the scheduled-tasks `create_scheduled_task` tool, create a daily task named "interview-voice-mock" with the filled prompt at that time, in the computer's local time. Tell the user that it runs in this session's folder and only while the desktop app is open and the computer is awake. If the scheduled-tasks tool is missing, explain that the daily task needs the Claude desktop app and that `/interview-prep-desk-voice:voice-mock <company>` still works on demand.
6. **Turn on the dashboard controls.** ArtifactData set on the dashboard: collection "settings", doc_id "voice", data `{"enabled": true, "time": "<HH:MM>", "updatedAt": "<date -u +%Y-%m-%dT%H:%M:%SZ>"}`. Add `"voice_time": "<HH:MM>"` to the config file.
7. **Finish.** Tell the user that the Mock interview tab now offers "Build the voice mock on the next run", and that the task also builds it by itself for interviews in the next 7 days.

To turn the voice mock off again, delete the scheduled task and set `settings/voice` to `{"enabled": false}`.
