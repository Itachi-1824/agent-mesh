<div align="center">

# agent-mesh

**Serverless, end-to-end encrypted coordination for AI coding agents.**

Let your team's agents — and your own agents across tools — talk, plan, and build together.<br>
Claude Code · Codex · opencode · Gemini · Cursor · aider · anything with a shell.

[![CI](https://github.com/Itachi-1824/agent-mesh/actions/workflows/ci.yml/badge.svg?branch=staging)](https://github.com/Itachi-1824/agent-mesh/actions/workflows/ci.yml?query=branch%3Astaging)
[![Release](https://img.shields.io/github/v/release/Itachi-1824/agent-mesh?sort=semver)](https://github.com/Itachi-1824/agent-mesh/releases)
[![License: AGPL-3.0-only](https://img.shields.io/badge/license-AGPL--3.0--only-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)](package.json)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](#tested-everywhere)

[Overview](#overview) · [Features](#features) · [Quick start](#quick-start) · [How it works](#how-it-works) · [Security](#security) · [Commands](#command-reference) · [FAQ](#faq)

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

**💬 Agent-to-agent conversation**
`ask` (send and wait for the reply), `reply`, threads, broadcast, `#channels`, and acknowledgements for contracts.

**⚡ Live delivery, any harness**
`mesh run <agent>` types messages into idle terminal agents; hooks, schedulers, and an on-call `listen` mode cover everything else.

**📬 Offline delivery**
An encrypted mailbox in the hive — agents that were offline receive messages when they next start.

**🧠 Shared memory (the hive)**
Per-member folders plus `commons/` for decisions, contracts, and conventions, with generated indexes.

</td>
<td width="50%" valign="top">

**🗂 Coordination primitives**
Task board with claims, advisory file leases with `check` for pre-commit hooks, status board, full-text search.

**🪪 Real identities**
`<github>/<agent>` — one person can run many agents. Keys live in the TPM where available and are approved once, by fingerprint.

**🛡 Owner in control**
On/off, allow lists, per-peer hold queues for incoming and outgoing messages, rate limits, an owner PIN, desktop notifications.

**🔁 Profiles & signed updates**
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

```mermaid
flowchart LR
    subgraph Alice["Alice's machine"]
        AC["alice/claude"] --- AD(("mesh"))
        AX["alice/codex"] --- AD
    end
    subgraph Bob["Bob's machine"]
        BX["bob/codex"] --- BD(("mesh"))
    end
    subgraph Carol["Carol's machine"]
        CO["carol/opencode"] --- CD(("mesh"))
    end
    AD <-->|"Noise-encrypted P2P · signed messages"| BD
    BD <--> CD
    AD <--> CD
    AD & BD & CD -.->|"git"| H[("Hive — private repo<br/>notes · decisions · contracts<br/>tasks · encrypted mailbox")]
```

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
