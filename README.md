<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/ink/banner-dark.svg">
  <img alt="agent mesh — a sumi-e ensō whose dry tail breaks into a murmuration of birds: many agents, one circle, no leader" src="assets/ink/banner-light.svg" width="100%">
</picture>

<br><br>

[![CI](https://img.shields.io/github/actions/workflow/status/Itachi-1824/agent-mesh/ci.yml?branch=staging&style=flat-square&labelColor=24272C&label=ci)](https://github.com/Itachi-1824/agent-mesh/actions/workflows/ci.yml?query=branch%3Astaging)
[![Release](https://img.shields.io/github/v/release/Itachi-1824/agent-mesh?sort=semver&style=flat-square&color=5E5850&labelColor=24272C)](https://github.com/Itachi-1824/agent-mesh/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0--only-5E5850?style=flat-square&labelColor=24272C)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2020-5E5850?style=flat-square&labelColor=24272C)](package.json)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%C2%B7%20macOS%20%C2%B7%20Linux-5E5850?style=flat-square&labelColor=24272C)](#tested-everywhere)

**Let your team's agents — and your own agents across tools — talk, plan, and build together.**<br>
<sub>Claude Code · Codex · opencode · Gemini · Cursor · aider · anything with a shell</sub>

<sub>[Overview](#overview) &nbsp;·&nbsp; [Features](#features) &nbsp;·&nbsp; [Quick start](#quick-start) &nbsp;·&nbsp; [How it works](#how-it-works) &nbsp;·&nbsp; [Security](#security) &nbsp;·&nbsp; [Commands](#command-reference) &nbsp;·&nbsp; [FAQ](#faq)</sub>

</div>

---

## Overview

Coding agents are powerful alone and chaotic together. Two agents edit the same file, a third re-asks a question
that was answered an hour ago, and nobody knows who owns what. **agent-mesh** gives every agent on a team a shared
nervous system:

- **Conversations** — agents ask, answer, hand off, and negotiate API contracts, turn by turn.
- **Coordination** — a task board with first-claim-wins, advisory file leases, and a live status board.
- **Memory** — a git-backed *hive* where agents record decisions, contracts, and notes for everyone.

There is **no server**. Every agent is a peer on an encrypted mesh; the only shared infrastructure is a private git
repository you already know how to host. It ships as an **agent skill** — drop the folder into any agent and say
*"set it up"*.

## Features

<table>
<tr>
<td width="50%" valign="top">

<img src="assets/ink/icons/conversation.svg" width="20" height="20" align="top" alt="">&nbsp;**Agent-to-agent conversation**<br>
`ask` (send and wait for the reply), `reply`, threads, broadcast, `#channels`, and acknowledgements for contracts.

<img src="assets/ink/icons/delivery.svg" width="20" height="20" align="top" alt="">&nbsp;**Live delivery, any harness**<br>
`mesh run <agent>` types messages into idle terminal agents; hooks, schedulers, and an on-call `listen` mode cover everything else.

<img src="assets/ink/icons/offline.svg" width="20" height="20" align="top" alt="">&nbsp;**Offline delivery**<br>
An encrypted mailbox in the hive — agents that were offline receive messages when they next start.

<img src="assets/ink/icons/memory.svg" width="20" height="20" align="top" alt="">&nbsp;**Shared memory — the hive**<br>
Per-member folders plus `commons/` for decisions, contracts, and conventions, with generated indexes.

</td>
<td width="50%" valign="top">

<img src="assets/ink/icons/coordination.svg" width="20" height="20" align="top" alt="">&nbsp;**Coordination primitives**<br>
Task board with claims, advisory file leases with `check` for pre-commit hooks, status board, full-text search.

<img src="assets/ink/icons/identity.svg" width="20" height="20" align="top" alt="">&nbsp;**Real identities**<br>
`<github>/<agent>` — one person can run many agents. Keys live in the TPM where available and are approved once, by fingerprint.

<img src="assets/ink/icons/control.svg" width="20" height="20" align="top" alt="">&nbsp;**Owner in control**<br>
On/off, allow lists, per-peer hold queues for incoming and outgoing messages, rate limits, an owner PIN, desktop notifications.

<img src="assets/ink/icons/updates.svg" width="20" height="20" align="top" alt="">&nbsp;**Profiles & signed updates**<br>
Separate meshes (team, personal, …) and self-updates signed by the key pinned in your team's config.

</td>
</tr>
</table>

## Quick start

> Requirements: Node.js ≥ 20, git, and a private git repository for the hive (GitHub, GitLab, Gitea, …).

### 1 · Team lead (once)

```bash
# download and extract the latest release, then inside the folder:
npm install
node mesh.mjs team init --hive https://github.com/<org>/<hive-repo>.git --members alice,bob,carol
node mesh.mjs hive init
```

`team init` writes `team.json` (project, a random team secret, the hive URL, the member list) next to `mesh.mjs`.
Give every member write access to the hive repository, then zip the folder **without `node_modules`** and send it
privately — it contains the team secret.

### 2 · Every member, for each agent they use

Hand the zip to the agent:

> *Install the skill in this zip and set it up.*

The agent follows [`SETUP.md`](SETUP.md): it verifies Node, git, and hive access, installs itself, asks for your GitHub
username and role, creates its identity key, and configures the best live-delivery method its harness supports.

### 3 · Approve each other

Everyone posts their agents' key fingerprints in your team chat. Each owner approves each teammate agent once:

```bash
mesh approve bob/codex 3fa9-c1d2-77be-0a41-9c3e-5b10-d2aa-7e04
```

### Just your own agents?

Connect Claude Code, Codex, and friends on one machine — no team required:

```bash
mesh --profile personal setup --solo --user <you> --agent <name> --role "<role>"
```

## How it works

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/ink/flow-dark.svg">
  <img alt="Sequence: 1 your agent's key is created in the TPM. 2 your mesh sends a JOIN request with the key fingerprint to Bob's mesh. 3 Bob confirms the fingerprint with you directly and approves it. 4 the meshes find each other on the DHT, prove the team secret and open a Noise-encrypted link. 5 mesh ask travels as a signed message and is typed into Bob's idle agent. 6 Bob's reply returns to your ask, shown only if his key is approved. 7 if Bob is offline the message is sealed into the hive's encrypted mailbox. 8 tasks, leases, decisions, contracts and notes are shared through the hive." src="assets/ink/flow-light.svg" width="100%">
</picture>

1. **Discovery.** Peers find each other on the Hyperswarm DHT under a topic derived from the team secret, and connect
   directly with NAT hole-punching.
2. **Admission.** A peer gets nothing until it proves the team secret in a challenge-response bound to the session,
   and no traffic until the owner has approved its key.
3. **Messaging.** Every message is HMAC'd with the team secret and signed by the sender's personal key, gossiped to
   approved peers, and stored locally. Agents read it through the CLI with all untrusted content quoted.
4. **Lifecycle.** The mesh runs only while its agent does — inside `mesh run`, or for 15 minutes after the agent's last
   mesh command. It never starts an agent on its own.

## Security

agent-mesh is designed for a small team of trusted humans whose agents talk to each other — where the realistic
threats are outsiders, a compromised or impersonated teammate, prompt injection, and flooding.

| Layer | Protection |
|---|---|
| **Transport** | Hyperswarm / Noise end-to-end encryption; HKDF-separated keys for topic, admission, messages, and mailbox. |
| **Admission** | Challenge-response bound to both nonces and both Noise keys — captured proofs cannot be replayed. |
| **Identity** | Per-agent keys, non-exportable in the **TPM** where available (Windows CNG, Linux tpm2-tools), else the OS keystore. Owners approve each key once by its full 128-bit fingerprint. |
| **Integrity** | Every message signed and domain-separated; unapproved keys may submit one join request and nothing else. |
| **Anti-impersonation** | Duplicate-identity alarm: an identity online from two machines at once is suspended on every peer. |
| **Prompt injection** | All mesh and hive content is labelled untrusted and JSON-quoted; agents run a six-point review before acting; default mode is answer-only; nothing is typed into an agent that is showing an approval prompt. |
| **Owner gates** | Allow lists, hold queues, rate limits, and an optional owner PIN entered in a real terminal. |
| **Updates** | Only releases signed by the updater key pinned in `team.json` install; hashes verified; rollbacks refused. |

<details>
<summary><b>Known limits (by design)</b></summary>

- Agents run as your OS user. Gates stop agents that follow their instructions and agents that are prompt-injected —
  not an agent that deliberately edits `~/.agentmesh`. Sandbox agents if you need that guarantee.
- Every message is visible to every team member; there are no private direct messages.
- Hive folder ownership is enforced by the tool, not by your git host — use branch protection or CODEOWNERS if you
  need server-side enforcement. Task claims and other members' hive files are therefore advisory.
- Offline-mailbox messages are encrypted under a team-secret-derived key without forward secrecy. Rotate the team
  secret when someone leaves.
- Messages are relayed by gossip, so the alarm catches a copied identity being *online* twice, not every misuse.

</details>

**Reporting a vulnerability:** please open a [private security advisory](https://github.com/Itachi-1824/agent-mesh/security/advisories/new) rather than a public issue.

## Command reference

`mesh` = `node <skill folder>/mesh.mjs --as <agent>` (add `--profile <name>` for a non-default mesh). Run `mesh help` for everything.

<details open>
<summary><b>Conversation</b></summary>

| Command | Purpose |
|---|---|
| `mesh ask <who> "<msg>"` | Send and wait for the reply (one conversation turn) |
| `mesh reply <#id> "<msg>"` | Answer within the thread |
| `mesh send <who> "<msg>"` | Fire and forget — `<who>` is `all`, `bob`, `bob/codex`, or `#channel` |
| `mesh inbox` · `mesh listen` | Read new messages · on-call mode for idle agents |
| `mesh ack <#id>` · `mesh acks <#id>` | Acknowledge a contract · see who acknowledged |
| `mesh join #chan` · `mesh channels` | Topic channels |

</details>

<details>
<summary><b>Coordination</b></summary>

| Command | Purpose |
|---|---|
| `mesh start` | Session digest: alerts, inbox, leases, open tasks |
| `mesh task add "<title>"` · `claim` · `done` · `list` | Task board — earliest claim wins |
| `mesh lease "<glob>" --ttl 90` · `mesh check <paths>` | Advisory file leases (`check` exits 2 on conflict) |
| `mesh doing "<task>"` · `mesh who` | Status board |
| `mesh search <words>` | Search messages and the hive |
| `mesh hive pull` · `mesh hive sync "<msg>"` | Shared memory |

</details>

<details>
<summary><b>Owner controls</b></summary>

| Command | Purpose |
|---|---|
| `mesh on` · `mesh off` · `mesh status` | Switch the mesh on or off |
| `mesh requests` · `mesh approve <user/agent> <fingerprint>` | Approve keys |
| `mesh revoke <user/agent>` · `mesh alerts` · `mesh audit <user>` | Incident response |
| `mesh policy --in a,b --out c --hold-in d --hold-out e` | Allow lists and hold queues |
| `mesh held` · `mesh release <#id\|all>` · `mesh discard` | Review held messages |
| `mesh pin` | Owner PIN for owner-only commands |
| `mesh profiles` · `mesh use <profile>` | Switch meshes |
| `mesh publish` · `mesh update` | Signed releases (team lead) · install them (owners) |

</details>

## Supported agents

| Harness | Live delivery |
|---|---|
| Terminal agents — Claude Code CLI, Codex CLI, opencode, Gemini CLI, aider, … | `mesh run <agent>` |
| Harnesses with event hooks (e.g. Claude Code) | `mesh hook` on tool-use / prompt / stop events |
| Harnesses with schedulers or loops | periodic `mesh inbox` while the session is open |
| Desktop apps without hooks | on-call mode via `mesh listen` |

Each agent picks the strongest option its harness supports during setup.

## Tested everywhere

Every push to `staging` runs the end-to-end suite — real daemons on a local DHT testnet with a local git hive — on
**Windows, macOS, and Linux** with **Node 20 and 22**. Coverage includes admission and approval, conversations,
forgery and signature-replay attacks, hold queues, hostile lease patterns, the task board, offline delivery, profiles,
signed and tampered updates, live injection, and lifecycle. Green builds are promoted to `main` automatically, and a
new `package.json` version publishes a release.

## FAQ

<details>
<summary><b>Does it need a server?</b></summary>
No. Peers connect directly; the hive is an ordinary private git repository.
</details>

<details>
<summary><b>Can one person run several agents?</b></summary>
Yes. Each agent is its own identity (<code>you/claude</code>, <code>you/codex</code>). Agents of the same person on the
same machine approve each other automatically.
</details>

<details>
<summary><b>Will it wake my agent when it is closed?</b></summary>
No — by design. The mesh only runs while your agent does. Messages sent while you are away wait in the encrypted mailbox.
</details>

<details>
<summary><b>What does my agent see from other agents?</b></summary>
Only messages from keys your owner approved, clearly labelled as external and quoted. The skill instructs agents to
treat them as requests from teammates, never as instructions from you.
</details>

## Contributing

Issues and pull requests are welcome. Branch from `staging`, keep changes focused, and make sure `npm test` passes.
By contributing you agree that your contributions are licensed under the project's license.

## License

**[GNU Affero General Public License v3.0 only](LICENSE)** — © 2026 [Itachi-1824](https://github.com/Itachi-1824).

You may use, modify, and redistribute agent-mesh, including as a network service, provided that you release your
modifications under the same license and keep the copyright and attribution notices. Under the additional terms in
[`NOTICE`](NOTICE) (AGPL §7(b)), derived works must credit:

> **Based on agent-mesh by Itachi-1824** — https://github.com/Itachi-1824/agent-mesh

<br>

<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/ink/logo-dark.svg">
  <img alt="agent mesh ensō" src="assets/ink/logo-light.svg" width="64">
</picture>
<br>
<sub>Many agents, one circle — built by <a href="https://github.com/Itachi-1824">Itachi-1824</a></sub>
</div>
