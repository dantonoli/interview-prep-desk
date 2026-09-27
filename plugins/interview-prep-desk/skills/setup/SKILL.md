---
name: setup
description: Set up or update Interview Prep Desk. Publishes the user's private dashboard artifact, saves their CV as the profile, and schedules the morning prep.
disable-model-invocation: true
argument-hint: "[update]"
---

# Interview Prep Desk setup

Set up the user's own Interview Prep Desk, or update an existing one. Ask before each step that publishes, writes or schedules something. Never use an em dash character in anything you write.

Plugin files:

- Dashboard page: `${CLAUDE_PLUGIN_ROOT}/dashboard/interview-prep-desk.html`
- Routine prompt: `${CLAUDE_PLUGIN_ROOT}/templates/prep-routine.md`
- Data contract: `${CLAUDE_PLUGIN_ROOT}/reference/data-model.md`

User config: `~/.config/interview-prep-desk/config.json`.

The database tool is `ArtifactData`. If it is not loaded yet, load it with ToolSearch "select:ArtifactData".

## 0. Check where you run

This skill needs Claude Code (the terminal, an IDE extension, or the Code tab of the Claude desktop app) with the Artifact and ArtifactData tools. If either tool is not available, for example in claude.ai chat or in Cowork, tell the user that Interview Prep Desk runs in Claude Code and stop.

## 1. Update or new

Read the config if it exists. If it has `dashboard_url`, or the user passed "update", offer to update the dashboard:

1. Read the live artifact with the Artifact tool (action "read", `url` = `dashboard_url`).
2. Copy the plugin's dashboard page into your scratchpad directory (or the current working directory if you have none) and read the copy in full.
3. Publish the copy with `url` = `dashboard_url`. Omit `capabilities` and `icon` so the artifact keeps its own. The database is not touched.
4. Tell the user to reload any dashboard tab or Claude app window that was already open, then report the new version and stop.

Otherwise continue with a new setup.

## 2. Explain and confirm

In a few lines, tell the user what setup creates:

- a private claude.ai artifact (the dashboard) with its own database;
- their CV, saved in that database without contact details;
- a small config file on this computer;
- a daily morning prep routine, only if they confirm it.

Say that the practice chat and the routine run on their own Claude usage, and that nothing is sent to the plugin's author. Ask whether to continue.

## 3. Collect

Ask for:

- their CV: a file path (PDF, DOCX, Markdown or text) or pasted text;
- the name the interviewers should use, usually the first name;
- their timezone as an IANA name, for example Europe/Berlin;
- the morning prep time (default 08:55).

## 4. Profile

Convert the CV to markdown. Remove contact details: email addresses, phone numbers, street address, date of birth, photo references and personal links. Keep every job, date, figure and skill exactly as written; do not add, improve or reword anything. Tell the user briefly what you removed, or that there was nothing to remove.

## 5. Publish the dashboard

Load the `artifact-capabilities` skill first, and `artifact-design` too if your Artifact tool requires it before any publish. Copy the plugin's dashboard page into your scratchpad directory (or the current working directory if you have none), read the copy in full, then publish it with the Artifact tool: `capabilities: {"db": {}, "sample": {}}`, `icon: "briefcase"`, description "Private interview prep dashboard". Keep the returned URL.

Then run one ArtifactData list on the `profile` collection and one on `interviews`. Both are empty on a new dashboard.

## 6. Save the profile

Build the document as a JSON file, `{"name": "<name>", "markdown": "<CV markdown>", "updatedAt": "<date -u +%Y-%m-%dT%H:%M:%SZ>"}`, and save it with ArtifactData set, collection "profile", doc_id "main", using `file_path` so the CV is sent exactly as converted. Get it back and confirm it matches.

## 7. Save the config

Create the folder `~/.config/interview-prep-desk` if it does not exist, then write `config.json` there:

```json
{"dashboard_url": "<url>", "candidate_name": "<name>", "timezone": "<IANA name>", "prep_time": "08:55"}
```

Never store a link that contains `?sk=`.

## 8. Morning prep

Fill `${CLAUDE_PLUGIN_ROOT}/templates/prep-routine.md`: replace `{{DASHBOARD_URL}}`, `{{CANDIDATE_NAME}}` and `{{TIMEZONE}}` with the config values. The schedule is daily at the prep time in the user's timezone, as the cron `CRON_TZ=<timezone> <minute> <hour> * * *`; the `CRON_TZ` prefix keeps the time right across daylight saving changes. Offer two ways to schedule it, and create nothing until the user confirms:

- **Cloud routine** (recommended; runs even when the computer is off). If a skill for scheduled cloud routines is available to you, for example `schedule`, offer to create the routine with it: name "Interview Prep Daily", the filled prompt, and the cron above. Otherwise save the filled prompt as `prep-routine.txt` in the working directory and tell the user to run `/schedule`, paste the prompt and use that cron. Cloud routines have the ArtifactData tool the prompt needs.
- **Desktop scheduled task** (Claude desktop app only; runs while the app is open and the computer is awake). If the scheduled-tasks `create_scheduled_task` tool is available, create a task named "interview-prep" with the filled prompt and a daily cron at the prep time in the computer's local time.

## 9. Finish

Give the dashboard link. Tell the user to add an interview with `/interview-prep-desk:add-interview <job link>` or the dashboard's Add interview button, to keep the link private, and that sharing the dashboard shares the CV.
