# Claude Code

@AGENTS.md

Claude-specific notes:

- Test dashboard changes by publishing `plugins/interview-prep-desk/dashboard/interview-prep-desk.html` to your own test artifact with `capabilities: {"db": {}, "sample": {}}`, seeded from `examples/`.
- Try a plugin locally with `claude --plugin-dir ./plugins/interview-prep-desk` (or the voice add-on's folder) before pushing.
