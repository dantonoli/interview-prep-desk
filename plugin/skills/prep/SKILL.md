---
name: prep
description: Run the Interview Prep Desk research and write the briefing, FAQ, quiz and flashcards now for one interview, instead of waiting for the morning routine.
argument-hint: "<company or interview id>"
---

# Prep one interview now

1. Read `~/.config/interview-prep-desk/config.json` for `dashboard_url`, `candidate_name` and `timezone`. If it is missing, tell the user to run `/interview-prep-desk:setup` and stop.
2. Read `${CLAUDE_PLUGIN_ROOT}/templates/prep-routine.md` and follow it, using the config values for `{{DASHBOARD_URL}}`, `{{CANDIDATE_NAME}}` and `{{TIMEZONE}}`, with one change to its step 2: prep only the interview the user named (match the company or the id, and ask if several match), even if it is not due yet. If the user named none, prep every interview that needs it.
3. When done, tell the user the dashboard now shows the materials, and point out the gaps the briefing found.
