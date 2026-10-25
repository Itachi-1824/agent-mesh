// SPDX-License-Identifier: AGPL-3.0-only
// README artwork for agent-mesh, generated from one set of design tokens.
//
//   Murmuration — thousands of birds moving as one, with no leader: the mesh. (banner)
//   Ensō        — a single brush circle made of many bristles: many agents, one whole, always open. (logo)
//
// Everything is deterministic (seeded), so rebuilding produces identical files. Run: node assets/build.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = path.dirname(fileURLToPath(import.meta.url))
const SERIF = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif`
const MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`

const THEMES = {
  dark: { bg: '#0F1216', ink: '#E7E2D6', gold: '#CDBE96', title: '#F0EBE0', muted: '#8F8B82', faint: '#5E5C57', rule: '#24282F', panel: '#13171C', grain: '#FFFFFF' },
  light: { bg: '#F5F2EB', ink: '#2A2C30', gold: '#9A8758', title: '#1E2023', muted: '#76736B', faint: '#A8A398', rule: '#DFDACE', panel: '#F9F7F2', grain: '#3A3326' },
}

// ── deterministic randomness ──────────────────────────────────────────────────────────────────────────────────────
const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
const f1 = (n) => n.toFixed(1)

// ── paper grain: a whisper of texture, like printed stock ─────────────────────────────────────────────────────────
function grain(t, W, H, n, seed) {
  const r = rng(seed); let d = ''
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H; d += `M${f1(x)} ${f1(y)}h.01` }
  return `<path d="${d}" stroke="${t.grain}" stroke-opacity=".07" stroke-width="1.1" stroke-linecap="round"/>`
}

// ── Ensō: ~20 bristle tracks travel the circle. The brush lands heavy and spread, then thins and dries; dry-brush
//    breaks open up towards the tail and the outer bristles lift off first. Left open, as an ensō is.
function enso(t, { cx, cy, R, seed, scale = 1, bristles = 26, start = -1.85, gap = 0.5, goldShare = 0.1 }) {
  const r = rng(seed), sweep = Math.PI * 2 - gap
  let out = ''
  for (let b = 0; b < bristles; b++) {
    const pos = (b / (bristles - 1)) * 2 - 1 + gauss(r) * 0.06 // position across the brush, −1…1
    const lift = 0.8 + 0.18 * (1 - Math.abs(pos)) + r() * 0.03 // outer bristles lift off first
    const begin = Math.abs(pos) * 0.03 + r() * 0.015 // the brush lands from its centre outwards
    const phase = r() * 100
    const op = 0.55 + 0.4 * (1 - Math.abs(pos)) * (0.65 + 0.35 * r())
    const base = (1.1 + r() * 0.9) * scale
    const col = r() < goldShare ? t.gold : t.ink
    const steps = Math.round(260 * Math.max(0.6, scale))
    let run = [], parts = '' // consecutive inked points: [x, y, pressure]
    const flush = () => {
      // emit the run as short sections whose width follows brush pressure → tapering, wet-to-dry
      for (let k = 0; k + 1 < run.length; k += 6) {
        const part = run.slice(k, k + 7)
        if (part.length < 2) continue
        const p = part.reduce((s, q) => s + q[2], 0) / part.length
        parts += `<path d="M${part.map(([x, y]) => f1(x) + ' ' + f1(y)).join('L')}" stroke-width="${(base * (0.3 + 1.6 * p)).toFixed(2)}"/>`
      }
      run = []
    }
    for (let i = 0; i <= steps; i++) {
      const u = begin + (lift - begin) * (i / steps), a = start + u * sweep
      const press = Math.pow(1 - u, 0.7) * (0.84 + 0.16 * Math.sin(u * 8 + 1.1))
      const spread = (11 + 5 * press) * scale // the brush keeps its width; bristles thin and separate as it dries
      const rr = R + pos * spread * 0.55 + Math.sin(u * 11 + phase) * 0.4 * scale
      const dry = Math.max(0, (u - 0.42) / 0.58)
      const noise = Math.sin(u * 47 + phase) + 0.6 * Math.sin(u * 113 + phase * 1.7) + 0.4 * Math.sin(u * 211 + phase * 0.3)
      if (noise > 1.9 - 3.5 * dry * dry - Math.abs(pos) * 0.4 * dry) flush()
      else run.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, press])
    }
    flush()
    // opacity on the whole bristle, so overlapping sections never stack into darker beads
    if (parts) out += `<g stroke="${col}" opacity="${op.toFixed(2)}">${parts}</g>`
  }
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${out}</g>`
}

// ── Murmuration: birds around an organic ∞. Two depth layers, chevrons at the edges, a few stragglers. ────────────
function murmuration(t, { cx, cy, A, B, n, seed, fadeFrom = 0, fadeTo = 0 }) {
  const r = rng(seed)
  const fade = (x) => fadeTo > fadeFrom ? Math.min(1, Math.max(0, (x - fadeFrom) / (fadeTo - fadeFrom))) : 1
  const centre = (s) => {
    const lobe = Math.sin(s) < 0 ? 0.84 : 1
    return [cx + A * lobe * Math.sin(s) + 18 * Math.sin(2 * s + 0.7), cy + B * lobe * Math.sin(s) * Math.cos(s) + 14 * Math.sin(3 * s)]
  }
  const layers = { far: '', near: '', chev: '' }
  for (let i = 0; i < n; i++) {
    let s; do { s = r() * Math.PI * 2 } while (r() > 0.42 + 0.58 * Math.pow(Math.sin(2 * s + 0.4), 2)) // density swells
    const [x0, y0] = centre(s), [x1, y1] = centre(s + 0.001)
    const tx = x1 - x0, ty = y1 - y0, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl
    const w = 13 + 30 * (0.5 + 0.5 * Math.sin(3 * s + 1.3))
    const off = gauss(r) * w, along = gauss(r) * 7
    const x = x0 + nx * off + tx / tl * along, y = y0 + ny * off + ty / tl * along
    const heading = Math.atan2(ty, tx) + gauss(r) * 0.2 + Math.sin(x / 70 + y / 90) * 0.16
    const core = Math.exp(-(off * off) / (2 * w * w))
    const far = r() < 0.45
    const len = far ? 1.4 + r() * 2.2 : 2.2 + r() * 4.2 * (0.45 + 0.55 * core)
    let op = (0.16 + 0.74 * core) * (0.6 + 0.4 * r()) * (far ? 0.5 : 1) * fade(x)
    if (op < 0.03) continue
    const col = r() < 0.06 ? t.gold : t.ink
    const dx = Math.cos(heading) * len / 2, dy = Math.sin(heading) * len / 2
    // edge birds are drawn as tiny chevrons — wings — the rest as ticks
    if (!far && Math.abs(off) > 1.5 * w && r() < 0.5) {
      const l = 1.6 + r() * 1.8, bx = Math.cos(heading), by = Math.sin(heading), px = -by, py = bx
      layers.chev += `<path d="M${f1(x - bx * l + px * l * .9)} ${f1(y - by * l + py * l * .9)}L${f1(x)} ${f1(y)}L${f1(x - bx * l - px * l * .9)} ${f1(y - by * l - py * l * .9)}" stroke="${col}" stroke-opacity="${op.toFixed(2)}"/>`
    } else layers[far ? 'far' : 'near'] += `<path d="M${f1(x - dx)} ${f1(y - dy)}L${f1(x + dx)} ${f1(y + dy)}" stroke="${col}" stroke-opacity="${op.toFixed(2)}"/>`
  }
  let strays = ''
  for (let i = 0; i < 46; i++) { // a few birds peeling away from the flock
    const x = cx - A * 0.6 + r() * A * 1.9, y = cy - B * 1.25 + r() * B * 2.5, h = -0.4 + r() * 0.5, l = 1.5 + r() * 1.6
    const bx = Math.cos(h), by = Math.sin(h)
    strays += `<path d="M${f1(x - bx * l - by * l)} ${f1(y - by * l + bx * l)}L${f1(x)} ${f1(y)}L${f1(x - bx * l + by * l)} ${f1(y - by * l - bx * l)}" stroke="${t.ink}" stroke-opacity="${((0.12 + r() * 0.3) * fade(x)).toFixed(2)}"/>`
  }
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke-width=".75">${layers.far}</g><g stroke-width="1">${layers.near}</g><g stroke-width=".9">${layers.chev}${strays}</g>
  </g>`
}

// ── Banner ──────────────────────────────────────────────────────────────────────────────────────────────────────
function banner(t) {
  const W = 1280, H = 420
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">agent mesh</title>
  <desc id="desc">A murmuration of birds forming an infinity loop beside the words "agent mesh" — no leader, no server, many agents moving as one.</desc>
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  ${grain(t, W, H, 1400, 5)}
  ${murmuration(t, { cx: 985, cy: 210, A: 228, B: 214, n: 3600, seed: 11, fadeFrom: 650, fadeTo: 790 })}
  ${enso(t, { cx: 128, cy: 164, R: 36, seed: 21, scale: 0.62, bristles: 18 })}
  <text x="190" y="186" font-family="${SERIF}" font-size="76" fill="${t.title}" letter-spacing="-.5">agent mesh</text>
  <text x="194" y="232" font-family="${SERIF}" font-style="italic" font-size="21" fill="${t.muted}">No leader. No server. Many agents, moving as one.</text>
  <line x1="194" y1="270" x2="548" y2="270" stroke="${t.rule}"/>
  <text x="194" y="300" font-family="${MONO}" font-size="11.5" letter-spacing="3.2" fill="${t.muted}">PEER-TO-PEER <tspan fill="${t.gold}">·</tspan> END-TO-END ENCRYPTED <tspan fill="${t.gold}">·</tspan> ANY AGENT</text>
</svg>
`
}

// ── Architecture: every mesh is a small ensō; links are bundles of fine gold thread; the hive is a large ensō. ───
function architecture(t) {
  const W = 1200, H = 620
  const cols = [
    { x: 70, who: "ALICE'S MACHINE", agents: ['alice/claude', 'alice/codex'] },
    { x: 450, who: "BOB'S MACHINE", agents: ['bob/codex'] },
    { x: 830, who: "CAROL'S MACHINE", agents: ['carol/opencode', 'carol/gemini'] },
  ]
  const CW = 300, top = 78, meshY = 318
  const nodes = cols.map(c => ({ x: c.x + CW / 2, y: meshY }))
  const col = (c, i) => {
    const cx = c.x + CW / 2, step = 140, s0 = cx - (c.agents.length - 1) * step / 2
    const agents = c.agents.map((a, k) => {
      const x = s0 + k * step
      return `<text x="${x}" y="${top + 86}" text-anchor="middle" font-family="${MONO}" font-size="12.5" fill="${t.ink}">${a}</text>
      <circle cx="${x}" cy="${top + 106}" r="3" fill="${t.ink}"/>
      <path d="M${x} ${top + 112} C${x} ${top + 170}, ${cx} ${meshY - 86}, ${cx} ${meshY - 26}" fill="none" stroke="${t.muted}" stroke-opacity=".7" stroke-width="1"/>`
    }).join('')
    return `<text x="${c.x}" y="${top}" font-family="${MONO}" font-size="11" letter-spacing="2.6" fill="${t.faint}">${c.who}</text>
    <line x1="${c.x}" y1="${top + 14}" x2="${c.x + CW}" y2="${top + 14}" stroke="${t.rule}"/>
    ${agents}
    ${enso(t, { cx, cy: meshY, R: 15, seed: 40 + i, scale: 0.28, bristles: 10, goldShare: 0 })}
    <text x="${cx + 28}" y="${meshY + 5}" font-family="${SERIF}" font-style="italic" font-size="16" fill="${t.muted}">mesh</text>`
  }
  const bundle = (p, q, lift, label) => {
    const lines = [-3, 0, 3].map((o, k) => `<path d="M${p.x + 22} ${p.y + o} C${p.x + 110} ${p.y - lift + o}, ${q.x - 110} ${q.y - lift + o}, ${q.x - 22} ${q.y + o}" fill="none" stroke="${t.gold}" stroke-opacity="${[0.45, 0.95, 0.45][k]}" stroke-width="${[0.8, 1.2, 0.8][k]}"/>`).join('')
    return lines + `<text x="${(p.x + q.x) / 2}" y="${p.y - lift * 0.75 - 14}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="15" fill="${t.gold}">${label}</text>`
  }
  const hive = { x: W / 2, y: 512 }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">How agent-mesh works</title>
  <desc id="desc">Each person's agents talk to a local mesh; meshes connect directly, peer to peer, over encrypted links, and share a private git repository called the hive.</desc>
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  ${grain(t, W, H, 900, 9)}
  ${cols.map(col).join('\n')}
  ${bundle(nodes[0], nodes[1], 74, 'encrypted, peer to peer')}
  ${bundle(nodes[1], nodes[2], 74, 'signed by every sender')}
  <path d="M${nodes[0].x} ${meshY + 24} C${nodes[0].x + 60} ${meshY + 96}, ${nodes[2].x - 60} ${meshY + 96}, ${nodes[2].x} ${meshY + 24}" fill="none" stroke="${t.gold}" stroke-opacity=".4" stroke-width=".9"/>
  ${nodes.map(n => `<path d="M${n.x} ${n.y + 24} Q${(n.x + hive.x) / 2} ${(n.y + hive.y) / 2 + 30} ${hive.x + (n.x - hive.x) * 0.22} ${hive.y - 30}" fill="none" stroke="${t.muted}" stroke-opacity=".55" stroke-width=".9" stroke-dasharray="1.5 5" stroke-linecap="round"/>`).join('')}
  ${enso(t, { cx: hive.x - 210, cy: hive.y, R: 30, seed: 77, scale: 0.5, bristles: 16 })}
  <text x="${hive.x - 160}" y="${hive.y - 4}" font-family="${SERIF}" font-size="24" fill="${t.title}">The hive <tspan font-style="italic" font-size="19" fill="${t.muted}">— shared memory in a private git repository</tspan></text>
  <text x="${hive.x - 160}" y="${hive.y + 24}" font-family="${MONO}" font-size="11" letter-spacing="2.4" fill="${t.muted}">NOTES · DECISIONS · CONTRACTS · TASKS · OFFLINE MAILBOX</text>
</svg>
`
}

// ── Icons: monoline, neutral stone (reads on both GitHub themes), one pale-gold detail each. ───────────────────────
const IC = '#8C887F', GD = '#B4A276'
const icon = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${IC}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`
const ICONS = {
  conversation: icon(`<path d="M4 6.5C4 5.1 5.1 4 6.5 4h7C14.9 4 16 5.1 16 6.5v4c0 1.4-1.1 2.5-2.5 2.5H9l-3.5 3v-3H6.5C5.1 13 4 11.9 4 10.5z"/><path d="M18.5 9.5h.5c1.1 0 2 .9 2 2v3.5c0 1.1-.9 2-2 2h-1v2.5L15 17h-3"/><path d="M8 8.5h4" stroke="${GD}"/>`),
  delivery: icon(`<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/><circle cx="21" cy="12" r=".9" fill="${GD}" stroke="${GD}"/>`),
  offline: icon(`<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/><path d="M15.5 16h3" stroke="${GD}"/>`),
  memory: icon(`<path d="M5 4.5h11.5L19 7v12.5H5z"/><path d="M8.5 9.5h7M8.5 13h7"/><path d="M8.5 16.5h4" stroke="${GD}"/>`),
  coordination: icon(`<path d="M5 6.5l1.5 1.5L9 5.5M5 12.5l1.5 1.5L9 11.5"/><path d="M12 7h7M12 13h7M12 18.5h7"/><path d="M5.3 18.5h2.4" stroke="${GD}"/>`),
  identity: icon(`<circle cx="8.5" cy="12" r="4"/><path d="M12.5 12H21M17.5 12v3M20 12v2"/><circle cx="8.5" cy="12" r="1.1" fill="${GD}" stroke="${GD}"/>`),
  control: icon(`<path d="M12 3.5l7 2.5v5.5c0 4.3-3 7.5-7 9-4-1.5-7-4.7-7-9V6z"/><path d="M9 12l2 2 4-4.5" stroke="${GD}"/>`),
  updates: icon(`<path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M19.5 4.5V9H15M4.5 19.5V15H9"/><circle cx="12" cy="12" r="1.1" fill="${GD}" stroke="${GD}"/>`),
}

// ── Logos (transparent background) ──────────────────────────────────────────────────────────────────────────────
const logo = (t) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-labelledby="t"><title id="t">agent mesh</title>${enso(t, { cx: 120, cy: 120, R: 76, seed: 21, scale: 1.35, bristles: 22 })}</svg>\n`

fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true })
for (const [name, t] of Object.entries(THEMES)) {
  fs.writeFileSync(path.join(OUT, `banner-${name}.svg`), banner(t))
  fs.writeFileSync(path.join(OUT, `architecture-${name}.svg`), architecture(t))
  fs.writeFileSync(path.join(OUT, `logo-${name}.svg`), logo(t))
}
fs.writeFileSync(path.join(OUT, 'logo.svg'), logo({ ...THEMES.light, ink: '#55524C', gold: THEMES.light.gold }))
for (const [n, s] of Object.entries(ICONS)) fs.writeFileSync(path.join(OUT, 'icons', `${n}.svg`), s)
for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.svg'))) console.log(f.padEnd(26), Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + ' KB')
