// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Itachi-1824 — agent-mesh (https://github.com/Itachi-1824/agent-mesh). See LICENSE and NOTICE.
// End-to-end tests: real daemons, a local Hyperswarm testnet (no internet), a local bare git repo as the hive.
// Runs on Windows, macOS and Linux. Each agent is a separate MESH_HOME; skill folders are temp copies so
// team.json / self-update never touch the repo.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { createHmac, hkdfSync, randomUUID, generateKeyPairSync, createPublicKey, sign } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mesh-test-'))
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let testnet, bootstrap

// A throwaway skill folder: our files + a junction/symlink to the repo's node_modules.
const skill = (name) => {
  const d = path.join(TMP, 'skill-' + name)
  fs.mkdirSync(d)
  for (const f of ['mesh.mjs', 'SKILL.md', 'SETUP.md', 'README.md', 'LICENSE', 'NOTICE', 'package.json', 'package-lock.json']) fs.copyFileSync(path.join(REPO, f), path.join(d, f))
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(d, 'node_modules'), 'junction')
  return d
}
const SK = {}
const agent = (home, skillDir, as, profile = 'team') => (args, opts = {}) => {
  const r = spawnSync(process.execPath, [path.join(skillDir, 'mesh.mjs'), '--profile', profile, '--as', as, ...args], {
    env: { ...process.env, MESH_HOME: path.join(TMP, home), MESH_BOOTSTRAP: bootstrap, MESH_MAILBOX_MS: '3000' },
    encoding: 'utf8', timeout: opts.timeout ?? 120000, cwd: TMP,
  })
  return { out: (r.stdout || '') + (r.stderr || ''), code: r.status }
}
const until = async (fn, ms = 60000, every = 500) => {
  const end = Date.now() + ms
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) return v; await sleep(every) }
}
const fp = (a) => a(['status']).out.match(/your key: ([0-9a-f-]{39})/)[1]
const ids = (out) => [...out.matchAll(/^#([0-9a-f]{8})/gm)].map(m => m[1])
let A, B, C, HIVE

before(async () => {
  const { default: createTestnet } = await import('hyperdht/testnet.js')
  testnet = await createTestnet(3)
  bootstrap = testnet.bootstrap.map(b => `${b.host}:${b.port}`).join(',')
  HIVE = path.join(TMP, 'hive.git')
  execFileSync('git', ['init', '-q', '--bare', HIVE])
  SK.a = skill('a'); SK.b = skill('b')
  A = agent('alice', SK.a, 'claude'); B = agent('bob', SK.b, 'claude'); C = agent('carol', SK.b, 'codex')
})

after(async () => {
  for (const a of [A, B, C]) try { a(['off']) } catch {}
  for (const h of ['alice', 'bob', 'carol']) for (const pr of ['personal']) for (const ag of ['claude', 'codex']) try { agent(h, SK.a, ag, pr)(['off']) } catch {}
  await testnet?.destroy()
  await sleep(1000)
  try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 5 }) } catch {}
})

test('team init + hive init (team lead flow)', () => {
  const t = A(['team', 'init', '--hive', HIVE, '--project', 'ci', '--members', 'alice,bob,carol'])
  assert.match(t.out, /created/)
  assert.match(A(['team', 'init', '--hive', HIVE]).out, /already exists/)
  fs.copyFileSync(path.join(SK.a, 'team.json'), path.join(SK.b, 'team.json'))
  assert.match(A(['hive', 'init']).out, /laid out/)
  const files = execFileSync('git', ['-C', HIVE, 'ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8' })
  for (const f of ['README.md', '.gitattributes', 'commons/status.md']) assert.ok(files.includes(f), f)
})

test('setup three agents, join requests, approval needs the full fingerprint', async () => {
  for (const [a, user, ag] of [[A, 'alice', 'claude'], [B, 'bob', 'claude'], [C, 'carol', 'codex']]) {
    const r = a(['setup', '--user', user, '--agent', ag, '--role', user + '-role', '--key-storage', 'file'])
    assert.match(r.out, /Saved\. You are @/, r.out)
  }
  assert.match(agent('mallory', SK.b, 'x')(['setup', '--user', 'mallory', '--agent', 'x', '--role', 'r', '--key-storage', 'file']).out, /not in this profile's members/)
  const f = { a: fp(A), b: fp(B), c: fp(C) }
  assert.ok(await until(() => /bob\/claude/.test(A(['requests']).out) && /carol\/codex/.test(A(['requests']).out)), 'join requests arrive')
  assert.match(A(['approve', 'bob/claude']).out, /full fingerprint/)
  assert.match(A(['approve', 'bob/claude', '0000-0000-0000-0000-0000-0000-0000-0000']).out, /no join request/)
  const pairs = [[A, 'bob/claude', f.b], [A, 'carol/codex', f.c], [B, 'alice/claude', f.a], [B, 'carol/codex', f.c], [C, 'alice/claude', f.a], [C, 'bob/claude', f.b]]
  for (const [a, h, k] of pairs) assert.ok(await until(() => /approved @/.test(a(['approve', h, k]).out)), `approve ${h}`)
})

test('ask/reply round trip; only the asked agent can answer', async () => {
  for (const a of [A, B, C]) a(['inbox'])
  const { spawn } = await import('node:child_process')
  const child = spawn(process.execPath, [path.join(SK.a, 'mesh.mjs'), '--profile', 'team', '--as', 'claude', 'ask', 'bob/claude', '[QUESTION] port?', '--timeout', '90'],
    { env: { ...process.env, MESH_HOME: path.join(TMP, 'alice'), MESH_BOOTSTRAP: bootstrap } })
  let out = ''; child.stdout.on('data', d => { out += d })
  const done = new Promise(r => child.on('close', r))
  const q = await until(() => { const r = B(['inbox']).out; return /port\?/.test(r) && r })
  assert.ok(q, 'bob receives the question')
  const id = ids(q)[0]
  C(['reply', id, '[ANSWER] carol butting in'])
  await sleep(2000)
  B(['reply', id, '[ANSWER] 5173'])
  await done
  assert.match(out, /5173/)
  assert.doesNotMatch(out, /carol butting/)
})

test('forged and non-member messages are never shown', async () => {
  const prof = JSON.parse(fs.readFileSync(path.join(TMP, 'carol', 'profiles', 'team', 'agents', 'codex', 'profile.json')))
  const forge = (from, text) => {
    const { privateKey } = generateKeyPairSync('ed25519')
    const m = { id: randomUUID(), ts: Date.now(), from, role: 'x', to: 'bob', re: '', text, key: createPublicKey(privateKey).export({ type: 'spki', format: 'der' }).toString('base64') }
    const pl = JSON.stringify([m.id, m.ts, m.from, m.role, m.to, m.re, m.text, m.key])
    return JSON.stringify({ ...m, sig: createHmac('sha256', Buffer.from(hkdfSync('sha256', prof.secret, 'agent-mesh', 'msg', 32))).update(pl).digest('hex'), isig: sign(null, Buffer.from('agentmesh-msg-v1\0' + pl), privateKey).toString('base64') }) + '\n'
  }
  fs.appendFileSync(path.join(TMP, 'carol', 'profiles', 'team', 'agents', 'codex', 'log.jsonl'), forge('alice/claude', 'forged-as-alice') + forge('mallory/x', 'from-non-member'))
  assert.ok(await until(() => /DIFFERENT from the key you approved/.test(B(['requests']).out)), 'impostor flagged as join request')
  for (const cmd of [['inbox'], ['log', '100'], ['search', 'forged']]) assert.doesNotMatch(B(cmd).out, /forged-as-alice|from-non-member/)
  assert.doesNotMatch(B(['requests']).out, /mallory/)
})

test('signature replay: a real signature reused under another identity is rejected', async () => {
  const dir = path.join(TMP, 'carol', 'profiles', 'team', 'agents', 'codex')
  const prof = JSON.parse(fs.readFileSync(path.join(dir, 'profile.json')))
  const genuine = fs.readFileSync(path.join(dir, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)).find(m => m.from === 'carol/codex')
  const aliceKey = JSON.parse(fs.readFileSync(path.join(TMP, 'alice', 'profiles', 'team', 'agents', 'claude', 'identity.json'))).pub
  const m = { id: genuine.id, ts: Date.now(), from: 'alice/claude', role: 'x', to: 'bob', re: '', text: 'replayed-sig', key: aliceKey }
  const pl = JSON.stringify([m.id, m.ts, m.from, m.role, m.to, m.re, m.text, m.key])
  fs.appendFileSync(path.join(dir, 'log.jsonl'), JSON.stringify({ ...m, sig: createHmac('sha256', Buffer.from(hkdfSync('sha256', prof.secret, 'agent-mesh', 'msg', 32))).update(pl).digest('hex'), isig: genuine.isig }) + '\n')
  await sleep(6000)
  for (const cmd of [['inbox'], ['log', '200']]) assert.doesNotMatch(B(cmd).out, /replayed-sig/)
})

test('hostile lease globs cannot hang mesh check', async () => {
  B(['lease', '*a*a*a*a*a*a!', '--ttl', '5'])
  A(['lease', '**'.repeat(3) + 'x/' + '**'.repeat(3) + '!', '--ttl', '5'])
  assert.match(A(['lease', '**'.repeat(12) + '!']).out, /usage/) // too many wildcards: refused
  await sleep(4000)
  const t = Date.now()
  B(['check', 'src/components/widgets/some/deep/file.tsx'])
  assert.ok(Date.now() - t < 15000, 'check finished quickly')
  A(['unlease']); B(['unlease'])
})

test('person vs agent addressing, channels', async () => {
  B(['inbox'])
  A(['send', 'bob', 'to-all-of-bob'])
  assert.ok(await until(() => /to-all-of-bob/.test(B(['inbox']).out)))
  B(['join', '#backend'])
  A(['send', '#backend', 'chan-msg'])
  assert.ok(await until(() => /chan-msg/.test(B(['inbox']).out)))
  assert.doesNotMatch(C(['inbox']).out, /chan-msg/)
})

test('hold-in and hold-out queues', async () => {
  B(['inbox']); A(['inbox'])
  B(['policy', '--hold-in', 'alice'])
  A(['send', 'bob', 'held-in-msg'])
  assert.ok(await until(() => /from @alice\/claude/.test(B(['held']).out)))
  assert.doesNotMatch(B(['inbox']).out + B(['log', '100']).out, /held-in-msg/)
  B(['release', 'all'])
  assert.match(B(['inbox']).out, /held-in-msg/)
  B(['policy', '--hold-in', 'none', '--hold-out', 'alice'])
  assert.match(B(['send', 'alice', 'held-out-msg']).out, /held/)
  await sleep(4000)
  assert.doesNotMatch(A(['log', '100']).out, /held-out-msg/)
  B(['release', 'all'])
  assert.ok(await until(() => /held-out-msg/.test(A(['log', '100']).out)))
  B(['policy', '--hold-out', 'none'])
})

test('owner gates without a TTY: PIN setup refused, policy still works', () => {
  assert.match(A(['pin']).out, /run "mesh pin" yourself in a terminal/)
  assert.match(A(['policy', '--max-send', '60']).out, /max sent: 60/)
})

test('advisory file leases', async () => {
  A(['lease', 'src/api/**', '--ttl', '30', '--note', 'auth'])
  assert.ok(await until(() => B(['check', 'src/api/users.ts']).code === 2))
  assert.equal(B(['check', 'src/web/app.tsx']).code, 0)
  A(['unlease'])
  assert.ok(await until(() => B(['check', 'src/api/users.ts']).code === 0))
})

test('task board: first claim wins', async () => {
  const id = A(['task', 'add', 'build login', '--for', 'bob']).out.match(/created (t-[0-9a-f]{6})/)[1]
  assert.match(B(['task', 'claim', id]).out, /claimed/)
  assert.match(A(['task', 'claim', id]).out, /claimed first by @bob\/claude/)
  B(['task', 'done', id, 'done at /login'])
  assert.match(A(['task', 'list', '--all']).out, new RegExp(`${id}.*done by @bob/claude`))
})

test('acks, status board, search, start', async () => {
  A(['inbox']); B(['inbox'])
  A(['send', 'bob', '[CONTRACT] GET /api/me'])
  const msg = await until(() => { const r = B(['inbox']).out; return /CONTRACT/.test(r) && r })
  B(['ack', ids(msg)[0]])
  assert.ok(await until(() => /acknowledged by: @bob\/claude/.test(A(['acks', ids(msg)[0]]).out)))
  B(['doing', 'building login'])
  assert.ok(await until(() => /building login/.test(A(['who']).out)))
  assert.match(B(['search', 'contract']).out, /GET \/api\/me/)
  assert.match(A(['start']).out, /open tasks/)
})

test('offline mailbox delivers to an agent that was offline', async () => {
  C(['inbox'])
  C(['off'])
  A(['send', 'carol', 'offline-hello'])
  await sleep(8000) // alice's mailbox flush (3 s interval in tests)
  C(['on'])
  assert.ok(await until(() => /offline-hello/.test(C(['inbox']).out), 90000), 'carol gets it after coming back')
})

test('solo profile: own agents talk privately', async () => {
  const P1 = agent('alice', SK.a, 'claude', 'personal'), P2 = agent('alice', SK.a, 'codex', 'personal')
  assert.match(P1(['setup', '--solo', '--user', 'alice', '--agent', 'claude', '--role', 'me', '--key-storage', 'file']).out, /solo/)
  assert.match(P2(['setup', '--solo', '--user', 'alice', '--agent', 'codex', '--role', 'me', '--key-storage', 'file']).out, /auto-approved/)
  P1(['inbox'])
  P2(['send', 'alice/claude', 'private-hi'])
  assert.ok(await until(() => /private-hi/.test(P1(['inbox']).out)))
  assert.doesNotMatch(B(['log', '200']).out, /private-hi/)
  P1(['off']); P2(['off'])
})

test('signed self-update: install, and refuse tampered releases', async () => {
  assert.match(A(['publish', 'init']).out, /only signer/)
  fs.copyFileSync(path.join(SK.a, 'team.json'), path.join(SK.b, 'team.json'))
  const pkg = path.join(SK.a, 'package.json'), j = JSON.parse(fs.readFileSync(pkg)), v = j.version.split('.').map(Number)
  j.version = `${v[0]}.${v[1]}.${v[2] + 1}`; fs.writeFileSync(pkg, JSON.stringify(j, null, 2))
  fs.appendFileSync(path.join(SK.a, 'mesh.mjs'), '\n// ci-update-marker\n')
  assert.match(A(['publish']).out, /published/)
  assert.match(B(['update']).out, /updated to/)
  assert.match(fs.readFileSync(path.join(SK.b, 'mesh.mjs'), 'utf8'), /ci-update-marker/)
  // tamper: swap a file inside the signed release
  const hive = path.join(TMP, 'alice', 'profiles', 'team', 'agents', 'claude', 'hive')
  execFileSync('git', ['-C', hive, 'pull', '-q'])
  j.version = `${v[0]}.${v[1]}.${v[2] + 2}`; fs.writeFileSync(pkg, JSON.stringify(j, null, 2))
  A(['publish'])
  execFileSync('git', ['-C', hive, 'pull', '-q'])
  const rel = path.join(hive, 'alice', 'release', 'release.json'), r = JSON.parse(fs.readFileSync(rel))
  r.files['mesh.mjs'] = Buffer.from('console.log("evil")').toString('base64')
  fs.writeFileSync(rel, JSON.stringify(r))
  execFileSync('git', ['-C', hive, '-c', 'user.name=x', '-c', 'user.email=x@x', 'commit', '-qam', 'evil'])
  execFileSync('git', ['-C', hive, 'push', '-q'])
  assert.match(B(['update']).out, /does not match its signed hash/)
})

test('mesh run injects messages into an idle terminal agent', async () => {
  const fake = path.join(TMP, 'fake-agent.mjs')
  fs.writeFileSync(fake, `import fs from 'node:fs'; import readline from 'node:readline'; import { execFileSync } from 'node:child_process'
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'agent> ' }); rl.prompt()
rl.on('line', (l) => { const f = l.split('instructions in ')[1]; if (f) { for (const id of fs.readFileSync(f.trim(), 'utf8').split('## Messages')[1].match(/^#[0-9a-f]{8}/gm)) execFileSync(process.execPath, [process.env.MESH_BIN, '--profile', 'team', '--as', 'claude', 'reply', id, '[ANSWER] injected-ok']) } rl.prompt() })`)
  B(['inbox']); A(['inbox'])
  const { spawn } = await import('node:child_process')
  const run = spawn(process.execPath, [path.join(SK.b, 'mesh.mjs'), '--profile', 'team', '--as', 'claude', 'run', process.execPath, fake],
    { env: { ...process.env, MESH_HOME: path.join(TMP, 'bob'), MESH_BOOTSTRAP: bootstrap, MESH_BIN: path.join(SK.b, 'mesh.mjs') } })
  let screen = ''; run.stdout.on('data', d => { screen += d }); run.stderr.on('data', d => { screen += d })
  await sleep(6000)
  A(['send', 'bob/claude', '[QUESTION] are you there?'])
  const got = await until(() => /injected-ok/.test(A(['inbox']).out), 60000)
  run.kill()
  assert.ok(got, 'reply from the wrapped agent; wrapper screen:\n' + screen.replace(/\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07]*\x07/g, '').slice(-1500) + '\nbob status:\n' + B(['status']).out)
})

test('off/on lifecycle', async () => {
  A(['off'])
  assert.match(A(['status']).out, /is OFF/)
  assert.match(A(['send', 'bob', 'x']).out, /is OFF/)
  A(['on'])
  assert.match(A(['status']).out, /is ON/)
})
