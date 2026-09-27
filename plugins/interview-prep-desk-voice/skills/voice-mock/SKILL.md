---
name: voice-mock
description: Build or refresh the NotebookLM voice mock interview for one Interview Prep Desk interview now, instead of waiting for the daily voice task.
argument-hint: "<company or interview id>"
---

# Voice mock now

This needs Claude Code with the ArtifactData tool (load it with ToolSearch "select:ArtifactData" if needed) and the NotebookLM MCP server from gemini-notebook-mcp-cli (https://github.com/jacob-bd/gemini-notebook-mcp-cli), an unofficial tool that signs in with Google browser cookies. If ArtifactData is missing, tell the user to run this in Claude Code and stop. If the NotebookLM tools (names ending in `server_info`, `notebook_create`, `source_add`, `studio_create`, `studio_status`) are missing, explain how to install it and stop.

1. Read `~/.config/interview-prep-desk/config.json`. If it is missing, tell the user to run `/interview-prep-desk:setup` and stop.
2. The interview must already have materials. If `materials.generatedAt` is missing, suggest `/interview-prep-desk:prep <company>` first and stop.
3. Read `${CLAUDE_PLUGIN_ROOT}/templates/voice-routine.md` and follow it with the config values, with one change to its step 1: work only on the interview the user named. Treat it as BUILD if it has no `notebook_url` yet and as NEW AUDIO if it has one.
4. The user asked for this run, so creating the notebook, adding the two sources and generating one Audio Overview is approved. Do not delete or share anything.
