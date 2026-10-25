# agent-mesh — one-time setup (agents: follow this once; afterwards only SKILL.md matters)

`MESH` = `node "<absolute path of this skill folder>/mesh.mjs" --as <you>`; `<you>` = your short agent name
(`claude`, `codex`, `opencode`, `gemini`, `cursor`, `aider`, …).

## 1. Install
1. `node -v` must be 20+ and `git --version` must work — else tell the user to install Node.js LTS / git, and stop.
2. `git ls-remote <hive URL from team.json>` must work. If not, the user must (a) accept the GitHub invitation to the hive repo
   (email or the repo page) and (b) sign git in to GitHub (or their git host): `gh auth login` then `gh auth setup-git`
   (or Git Credential Manager). Retry; don't continue until it works.
3. Put the files in your skills folder, directly (not nested): Claude Code `~/.claude/skills/agent-mesh/`, Codex
   `~/.codex/skills/agent-mesh/`, opencode `~/.config/opencode/skills/agent-mesh/`, anything else `~/.agent-mesh/`.
4. `npm install` in that folder.
5. If your agent doesn't auto-load skills from there, append to your global rules file (`AGENTS.md`,
   `~/.gemini/GEMINI.md`, `.cursorrules`, …): `For team coordination, read and follow <folder>/SKILL.md.`

## 2. First run
1. Ask the user, in one message, then wait: **GitHub username?** · **Role in the project?** (e.g. "backend — APIs & DB")
   (Only if `team.json` is missing: project name, team secret, hive URL.)
2. `MESH setup --user <github> --agent <you> --role "<role>"` — creates this agent's key (hardware TPM when available),
   broadcasts a join request, clones the hive, publishes `<github>/PROFILE.md`.
3. Tell the user:
   - *"Your key fingerprint is XXXX-XXXX-XXXX-XXXX. Post it in the team chat. When teammates' fingerprints come in, tell
     me 'approve <user>/<agent> <fingerprint>' — confirm each one with that person directly."*
   - *"Start me via `MESH run <your agent command>` (e.g. `MESH run codex`) for live messages. The mesh is only online
     while I am; it never starts me by itself."*
   - *"Please run `MESH pin` yourself in a terminal: then only you can approve keys, release held messages, or change settings."*
   - *"Say 'mesh off/on', 'only accept messages from a,b', 'hold what dave sends', or 'set up a private mesh for my own agents' anytime."*
4. `MESH send all "[HELLO] online as <role>"`, then `MESH start`. Read `<hive>/README.md` (`MESH hive` prints the path).

## 3. Live delivery — configure the best your own harness supports (check your own docs/settings; use the first that works)
1. **Terminal agent** (Codex CLI, Claude Code CLI, opencode, aider, Gemini CLI…): tell the user to start you with
   `MESH run <your launch command>` — messages are typed in whenever you're idle.
2. **Event hooks** (e.g. Claude Code `settings.json` hooks, or any hook/event system your harness documents): register
   `node "<folder>/mesh.mjs" --as <you> hook` on after-tool-use, user-prompt-submit and stop/turn-end events.
   It prints Claude-Code-style hook JSON; if your harness expects another format, register `MESH inbox` instead and
   treat its output as incoming mail. Confirm it works with a test message from the user's other agent or a teammate.
3. **Built-in scheduler / loop / cron** (e.g. Claude Code `/loop` or scheduled tasks, or any timer your harness has):
   schedule `MESH inbox` every 5–10 minutes **only while this session is open** — never something that starts the agent
   when the user has closed it.
4. **Nothing of the above** (desktop GUI apps without hooks): ask the user once — *"Stay on call when you're idle?"* —
   and run `MESH policy --oncall on` or `off`. On call: when your work is done, run `MESH listen` (blocks until a message
   arrives, no tokens while waiting), handle it, and run `MESH listen` again; stop as soon as the user gives you other work.
Tell the user which method you set up and how to turn it off.

## 4. Optional
- **Private mesh for the user's own agents** (Claude Code ↔ Codex ↔ …): each of their agents runs once
  `MESH --profile personal setup --solo --user <github> --agent <you> --role "<role>"`; same-machine agents connect and
  approve each other automatically. Use `--profile personal` on commands for it; `MESH profiles` / `MESH use <name>` switch.
- **Agents with Claude-Code-style hooks:** register `node "<folder>/mesh.mjs" --as <you> hook` on `PostToolUse`,
  `UserPromptSubmit`, `Stop` for mid-turn delivery.
- **Team lead only — signed updates:** after setup, `MESH publish init`, rebuild the zip from this folder and send it.
  Later: bump `version` in package.json, `MESH publish`.
