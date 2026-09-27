---
name: setup
description: Set up or update Interview Prep Desk. Publishes the user's private dashboard artifact, saves their CV as the profile, and schedules the morning prep and the optional NotebookLM voice mock.
disable-model-invocation: true
argument-hint: "[update]"
---

# Interview Prep Desk setup

Set up the user's own Interview Prep Desk, or update an existing one. Ask before each step that publishes, writes or schedules something. Never use an em dash character in anything you write.

Plugin files:

- Dashboard page: `${CLAUDE_PLUGIN_ROOT}/dashboard/interview-prep-desk.html`
- Routine prompts: `${CLAUDE_PLUGIN_ROOT}/templates/prep-routine.md` and `${CLAUDE_PLUGIN_ROOT}/templates/voice-routine.md`
- Data contract: `${CLAUDE_PLUGIN_ROOT}/reference/data-model.md`

User config: `~/.config/interview-prep-desk/config.json`.

The database tool is `ArtifactData`. If it is not loaded yet, load it with ToolSearch "select:ArtifactData".

## 0. Update or new

Read the config if it exists. If it has `dashboard_url`, or the user passed "update", offer to update the dashboard:

1. Read the live artifact with the Artifact tool (action "read", `url` = `dashboard_url`).
2. Copy the plugin's dashboard page into your scratchpad directory (or the current working directory if you have none) and read the copy in full.
3. Publish the copy with `url` = `dashboard_url`. Omit `capabilities` and `icon` so the artifact keeps its own. The database is not touched.
4. Tell the user to reload any dashboard tab or Claude app window that was already open, then report the new version and stop.

Otherwise continue with a new setup.

## 1. Explain and confirm

In a few lines, tell the user what setup creates:

- a private claude.ai artifact (the dashboard) with its own database;
- their CV, saved in that database without contact details;
- a daily morning prep routine;
- optionally, a daily NotebookLM voice mock task on this computer.

Say that the practice chat and the routines run on their own Claude usage. Ask whether to continue.

## 2. Collect

Ask for:

- their CV: a file path (PDF, DOCX, Markdown or text) or pasted text;
- the name the interviewers should use, usually the first name;
- their timezone as an IANA name, for example Europe/Berlin;
- the morning prep time (default 08:55);
- whether they want the optional NotebookLM voice mock (see step 8), and if so its time (default 09:30).

## 3. Profile

Convert the CV to markdown. Remove contact details: email addresses, phone numbers, street address, date of birth, photo references and personal links. Keep every job, date, figure and skill exactly as written; do not add, improve or reword anything. Tell the user briefly what you removed, or that there was nothing to remove.

## 4. Publish the dashboard

Load the `artifact-capabilities` skill first, and `artifact-design` too if your Artifact tool requires it before any publish. Copy the plugin's dashboard page into your scratchpad directory (or the current working directory if you have none), read the copy in full, then publish it with the Artifact tool: `capabilities: {"db": {}, "sample": {}}`, `icon: "briefcase"`, description "Private interview prep dashboard". Keep the returned URL.

Then run one ArtifactData list on the `profile` collection and one on `interviews`. Both are empty on a new dashboard.

## 5. Save the profile

Build the document as a JSON file, `{"name": "<name>", "markdown": "<CV markdown>", "updatedAt": "<date -u +%Y-%m-%dT%H:%M:%SZ>"}`, and save it with ArtifactData set, collection "profile", doc_id "main", using `file_path` so the CV is sent exactly as converted. Get it back and confirm it matches.

## 6. Save the config

Create the folder `~/.config/interview-prep-desk` if it does not exist, then write `config.json` there:

```json
{"dashboard_url": "<url>", "candidate_name": "<name>", "timezone": "<IANA name>", "prep_time": "08:55", "voice_time": null}
```

Set `voice_time` only if the user wants the voice mock. Never store a link that contains `?sk=`.

## 7. Morning prep

Fill `${CLAUDE_PLUGIN_ROOT}/templates/prep-routine.md`: replace `{{DASHBOARD_URL}}`, `{{CANDIDATE_NAME}}` and `{{TIMEZONE}}` with the config values. The schedule is daily at the prep time in the user's timezone, as the cron `CRON_TZ=<timezone> <minute> <hour> * * *`; the `CRON_TZ` prefix keeps the time right across daylight saving changes. Offer two ways to schedule it:

- **Cloud routine** (recommended; runs even when the computer is off). If a skill for scheduled cloud routines is available to you, for example `schedule`, offer to create the routine with it once the user confirms: name "Interview Prep Daily", the filled prompt, and the cron above. Otherwise save the filled prompt as `prep-routine.txt` in the working directory and tell the user to run `/schedule`, paste the prompt and use that cron. Cloud routines have the ArtifactData tool the prompt needs.
- **Desktop scheduled task** (Claude desktop app only; runs while the app is open and the computer is awake). If the scheduled-tasks `create_scheduled_task` tool is available, create a task named "interview-prep" with the filled prompt and a daily cron at the prep time in the computer's local time.

## 8. Voice mock (optional)

Only if the user wants it.

1. Look for the NotebookLM MCP tools from gemini-notebook-mcp-cli (names ending in `server_info`, `notebook_create`, `source_add`, `studio_create`, `studio_status`). If they are missing, explain how to install it from https://github.com/jacob-bd/gemini-notebook-mcp-cli and sign in, then skip this step. Mention that it is an unofficial tool that signs in with Google browser cookies.
2. Call its `server_info`. If auth_status is "stale" or "not_configured", tell the user to run `nlm login` in a terminal, then skip this step.
3. Fill `${CLAUDE_PLUGIN_ROOT}/templates/voice-routine.md` the same way. With the scheduled-tasks `create_scheduled_task` tool, create a daily task named "interview-voice-mock" at the voice time. Tell the user that the task runs in this session's folder and only while the desktop app is open.

## 9. Finish

Give the dashboard link. Tell the user to add an interview with `/interview-prep-desk:add-interview <job link>` or the dashboard's Add interview button, to keep the link private, and that sharing the dashboard shares the CV.
