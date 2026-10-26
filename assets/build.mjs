// SPDX-License-Identifier: AGPL-3.0-only
// README artwork for agent-mesh — sumi-e ink on washi paper, generated from one set of design tokens.
//
//   Banner  An ensō — one brush circle, many bristles: many agents, one whole, always open. Its dry tail does not
//           fade; it breaks into birds — a murmuration released into the sky: no leader, no server.
//   Flow    How it works: the real sequence — identity, join, approval, admission, ask/reply, offline mailbox, hive —
//           drawn as ink lifelines with brush-tipped arrows and numbered seals.
//   Seal    A vermilion hanko signs every piece.
//
// Deterministic (seeded): rebuilding produces identical files. Run: node assets/build.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ink') // new folder name busts GitHub's image cache
const SERIF = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif`
const MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`

const THEMES = {
  // washi paper and sumi ink
  light: { paper: '#F2ECE0', paperShade: '#E4DAC6', fiber: '#B5A78B', ink: '#1A1916', wash: '#3B3833', stone: '#2B2925', title: '#1A1916', muted: '#6F6A60', faint: '#A39C8E', seal: '#A0453A', sealInk: '#F2ECE0', noiseAlpha: 0.10, washOp: 1 },
  // the same painting at night: lacquer-black ground, ink becomes pale mineral white
  dark: { paper: '#121210', paperShade: '#1B1A17', fiber: '#3D3A34', ink: '#E9E2D2', wash: '#CFC6B4', stone: '#D9D1C0', title: '#EEE7D8', muted: '#958E80', faint: '#5F5A51', seal: '#9C463B', sealInk: '#121210', noiseAlpha: 0.08, washOp: 0.35 },
}

// ── deterministic randomness ──────────────────────────────────────────────────────────────────────────────────────
const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
const f1 = (n) => n.toFixed(1)
const hex = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255

// ── filters: washi grain and ink bleed (rendered by the viewer's browser; works inside GitHub's <img>) ─────────────
const defs = (t, id) => `<defs>
    <filter id="${id}-washi" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="3" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 ${hex(t.fiber, 0)}  0 0 0 0 ${hex(t.fiber, 1)}  0 0 0 0 ${hex(t.fiber, 2)}  0 0 0 ${t.noiseAlpha * 2.2} -${t.noiseAlpha * 0.6}"/>
    </filter>
    <filter id="${id}-bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="${id}-wash" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
    <radialGradient id="${id}-vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="${t.paperShade}" stop-opacity="0"/><stop offset="1" stop-color="${t.paperShade}" stop-opacity=".9"/></radialGradient>
  </defs>`

// paper: base, soft vignette, grain, and long washi fibres
function washi(t, id, W, H, seed) {
  const r = rng(seed); let fibres = ''
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 18 + r() * 70, c = (r() - 0.5) * 18
    const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l
    fibres += `<path d="M${f1(x)} ${f1(y)}Q${f1((x + x2) / 2 - Math.sin(a) * c)} ${f1((y + y2) / 2 + Math.cos(a) * c)} ${f1(x2)} ${f1(y2)}" stroke-opacity="${(0.06 + r() * 0.12).toFixed(2)}"/>`
  }
  return `<rect width="${W}" height="${H}" fill="${t.paper}"/>
  <rect width="${W}" height="${H}" fill="url(#${id}-vignette)"/>
  <rect width="${W}" height="${H}" filter="url(#${id}-washi)"/>
  <g fill="none" stroke="${t.fiber}" stroke-width=".6" stroke-linecap="round">${fibres}</g>`
}

// ── The ensō: bristle tracks travel the circle — the brush lands wet and heavy, tapers, dries, splits. ─────────────
// Returns the svg plus where (and in which direction) the dry tail leaves the paper, so the birds can take over.
function enso(t, { cx, cy, R, seed, scale = 1, bristles = 30, start = -1.7, sweep = Math.PI * 2 - 0.62 }) {
  const r = rng(seed); let out = ''
  for (let b = 0; b < bristles; b++) {
    const pos = (b / (bristles - 1)) * 2 - 1 + gauss(r) * 0.05
    const lift = 0.8 + 0.18 * (1 - Math.abs(pos)) + r() * 0.03
    const begin = Math.abs(pos) * 0.03 + r() * 0.015, phase = r() * 100
    const op = 0.6 + 0.38 * (1 - Math.abs(pos)) * (0.7 + 0.3 * r())
    const base = (0.55 + r() * 0.6) * scale
    let run = [], parts = ''
    const flush = () => {
      for (let k = 0; k + 1 < run.length; k += 6) {
        const part = run.slice(k, k + 7); if (part.length < 2) continue
        const p = part.reduce((s, q) => s + q[2], 0) / part.length
        parts += `<path d="M${part.map(([x, y]) => f1(x) + ' ' + f1(y)).join('L')}" stroke-width="${(base * (0.25 + 1.7 * p)).toFixed(2)}"/>`
      }
      run = []
    }
    const steps = Math.round(300 * Math.max(0.5, scale))
    for (let i = 0; i <= steps; i++) {
      const u = begin + (lift - begin) * (i / steps), a = start + u * sweep
      const press = Math.min(1, (u + 0.02) / 0.05) * Math.pow(1 - u, 0.7) * (0.84 + 0.16 * Math.sin(u * 8 + 1.1))
      const spread = (9 + 13 * press) * scale // wide where the brush is loaded, narrowing as it runs dry
      const rr = R + pos * spread * 0.55 + Math.sin(u * 11 + phase) * 0.45 * scale
      const dry = Math.max(0, (u - 0.42) / 0.58)
      const noise = Math.sin(u * 47 + phase) + 0.6 * Math.sin(u * 113 + phase * 1.7) + 0.4 * Math.sin(u * 211 + phase * 0.3)
      if (noise > 1.9 - 3.5 * dry * dry - Math.abs(pos) * 0.4 * dry) flush()
      else run.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, press])
    }
    flush()
    if (parts) out += `<g stroke="${t.ink}" opacity="${op.toFixed(2)}">${parts}</g>`
  }
  const end = start + sweep * 0.97
  return {
    svg: `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${out}</g>`,
    tail: { x: cx + Math.cos(end) * R, y: cy + Math.sin(end) * R, dir: end + Math.PI / 2 },
  }
}

// a single bird: near birds are calligraphic swallows (two curved wing strokes), far birds are ink flecks
const bird = (x, y, heading, size, op, flap) => {
  if (size < 2.2) {
    const dx = Math.cos(heading) * size, dy = Math.sin(heading) * size
    return `<path d="M${f1(x - dx)} ${f1(y - dy)}L${f1(x + dx)} ${f1(y + dy)}" stroke-opacity="${op.toFixed(2)}" stroke-width=".9"/>`
  }
  const c = Math.cos(heading), s = Math.sin(heading), P = (u, v) => [x + u * c - v * s, y + u * s + v * c]
  const wing = size * 1.25, lift = size * (0.25 + 0.45 * flap)
  const [lx, ly] = P(-size * 0.55, -wing), [lcx, lcy] = P(size * 0.15, -wing * 0.35 - lift)
  const [rx, ry] = P(-size * 0.55, wing), [rcx, rcy] = P(size * 0.15, wing * 0.35 + lift)
  return `<path d="M${f1(lx)} ${f1(ly)}Q${f1(lcx)} ${f1(lcy)} ${f1(x)} ${f1(y)}Q${f1(rcx)} ${f1(rcy)} ${f1(rx)} ${f1(ry)}" stroke-opacity="${op.toFixed(2)}" stroke-width="${(0.7 + size * 0.16).toFixed(2)}"/>`
}

// the murmuration: released from the ensō's tail, carried along a sweeping arc, spreading and shrinking with distance
function release(t, { from, to, bend, n, seed, near = 7, far = 1.2, spread = 70 }) {
  const r = rng(seed); let out = ''
  const P = (v) => { // cubic: leave along the tail's direction, then curve towards the open sky
    const c1 = [from.x + Math.cos(from.dir) * bend, from.y + Math.sin(from.dir) * bend]
    const c2 = [to.x + (from.x > to.x ? 140 : -120), to.y + 50]
    const m = 1 - v
    return [m ** 3 * from.x + 3 * m * m * v * c1[0] + 3 * m * v * v * c2[0] + v ** 3 * to.x, m ** 3 * from.y + 3 * m * m * v * c1[1] + 3 * m * v * v * c2[1] + v ** 3 * to.y]
  }
  for (let i = 0; i < n; i++) {
    const v = 0.04 + 0.96 * Math.pow(r(), 0.55) // few birds leave the brush first; the flock gathers as it rises
    const [x0, y0] = P(v), [x1, y1] = P(Math.min(1, v + 0.004))
    const tx = x1 - x0, ty = y1 - y0, tl = Math.hypot(tx, ty) || 1
    const w = 5 + spread * Math.pow(v, 1.2) // a thin thread leaving the brush, a cloud in the distance
    const off = gauss(r) * w, along = gauss(r) * w * 0.6
    const x = x0 - ty / tl * off + tx / tl * along, y = y0 + tx / tl * off + ty / tl * along
    const size = near - (near - far) * Math.pow(v, 0.7) + gauss(r) * 0.5
    const op = (0.92 - 0.55 * v) * (0.55 + 0.45 * Math.exp(-(off * off) / (2 * w * w))) * (0.75 + 0.25 * r())
    out += bird(x, y, Math.atan2(ty, tx) + gauss(r) * 0.25, Math.max(0.8, size), op, r())
  }
  return `<g fill="none" stroke="${t.ink}" stroke-linecap="round" stroke-linejoin="round">${out}</g>`
}

// ink wash (bokashi): a soft, uneven grey cloud
const wash = (t, id, cx, cy, rx, ry, op) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${t.wash}" opacity="${(op * t.washOp).toFixed(3)}" filter="url(#${id}-wash)"/>`

// the hanko: a vermilion seal, carved with a tiny ensō and one bird in negative space, slightly worn
function seal(t, x, y, s, seed) {
  const r = rng(seed); let worn = ''
  for (let i = 0; i < 26; i++) worn += `<circle cx="${f1(x + r() * s)}" cy="${f1(y + r() * s)}" r="${f1(0.4 + r() * 1.2 * s / 44)}" fill="${t.sealInk}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`
  const c = s / 2
  return `<g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.09}" fill="${t.seal}"/>
    <path d="M${f1(x + c + s * 0.25)} ${f1(y + c - s * 0.12)}A${f1(s * 0.27)} ${f1(s * 0.27)} 0 1 1 ${f1(x + c + s * 0.08)} ${f1(y + c - s * 0.26)}" fill="none" stroke="${t.sealInk}" stroke-width="${f1(s * 0.075)}" stroke-linecap="round"/>
    <path d="M${f1(x + c + s * 0.14)} ${f1(y + c - s * 0.32)}q${f1(s * 0.06)} ${f1(s * 0.04)} ${f1(s * 0.12)} ${f1(-s * 0.02)}q${f1(s * 0.04)} ${f1(-s * 0.06)} ${f1(s * 0.11)} ${f1(-s * 0.06)}" fill="none" stroke="${t.sealInk}" stroke-width="${f1(s * 0.05)}" stroke-linecap="round"/>
    ${worn}
  </g>`
}

// ── Banner ──────────────────────────────────────────────────────────────────────────────────────────────────────
function banner(t, id) {
  const W = 1280, H = 440
  const e = enso(t, { cx: 905, cy: 236, R: 128, seed: 21, scale: 1.05 })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">agent mesh</title>
  <desc id="desc">A sumi-e ink painting: a brush ensō whose dry tail breaks into a murmuration of birds carried across the sky — many agents, one circle, no leader.</desc>
  ${defs(t, id)}
  ${washi(t, id, W, H, 5)}
  ${wash(t, id, 905, 250, 190, 120, 0.09)}
  ${wash(t, id, 650, 80, 170, 55, 0.05)}
  <g filter="url(#${id}-bleed)">${e.svg}</g>
  ${release(t, { from: e.tail, to: { x: 640, y: 64 }, bend: 70, n: 430, seed: 13, near: 7.5, far: 1.3, spread: 58 })}
  ${seal(t, 1092, 330, 34, 4)}

  <text x="92" y="196" font-family="${SERIF}" font-size="78" fill="${t.title}" letter-spacing="-.5">agent mesh</text>
  <text x="96" y="244" font-family="${SERIF}" font-style="italic" font-size="21" fill="${t.muted}">Many agents, one circle. No leader, no server.</text>
  <line x1="96" y1="284" x2="470" y2="284" stroke="${t.faint}" stroke-opacity=".6"/>
  <text x="96" y="314" font-family="${MONO}" font-size="11.5" letter-spacing="3.2" fill="${t.muted}">PEER-TO-PEER · END-TO-END ENCRYPTED · ANY AGENT</text>
</svg>
`
}

// ── How it works: the real sequence, drawn in ink. Five lifelines, eight numbered steps, brush-tipped arrows. ────────
function flow(t, id) {
  const W = 1200, H = 800
  const cols = [
    { x: 120, name: 'YOUR AGENT', sub: 'alice/claude' },
    { x: 345, name: 'YOUR MESH', sub: 'this machine' },
    { x: 600, name: 'THE HIVE', sub: 'private git repo' },
    { x: 855, name: "BOB'S MESH", sub: 'his machine' },
    { x: 1080, name: "BOB'S AGENT", sub: 'bob/codex' },
  ]
  const X = cols.map(c => c.x), top = 118, bottom = H - 70
  const r = rng(404), wob = () => (r() - 0.5) * 3
  let INK = '', TOP = '' // INK: strokes (ink-bleed filter) · TOP: labels, notes, seals (crisp)

  // an ink stroke from x1 to x2, gently bowed, with a two-stroke brush arrowhead
  const arrow = (x1, x2, y, { both = false, dashed = false, red = false } = {}) => {
    const dir = Math.sign(x2 - x1), mx = (x1 + x2) / 2, bow = -5 + wob(), ink = red ? t.seal : t.ink
    const head = (x, d) => `<path d="M${f1(x - d * 11)} ${f1(y - 5)}Q${f1(x - d * 4)} ${f1(y - 1.5)} ${f1(x)} ${f1(y)}M${f1(x - d * 11)} ${f1(y + 5)}Q${f1(x - d * 4)} ${f1(y + 1.5)} ${f1(x)} ${f1(y)}" stroke="${ink}" stroke-width="1.6"/>`
    INK += `<path d="M${f1(x1 + dir * 10)} ${f1(y + wob() * 0.3)}Q${f1(mx)} ${f1(y + bow)} ${f1(x2 - dir * 12)} ${f1(y + wob() * 0.3)}" stroke="${ink}" stroke-width="1.5" ${dashed ? 'stroke-dasharray="1 6"' : ''} stroke-opacity=".85"/>`
    INK += head(x2 - dir * 10, dir) + (both ? head(x1 + dir * 10, -dir) : '')
  }
  const label = (x, y, text, { mono = false, size } = {}) => {
    TOP += `<text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-family="${mono ? MONO : SERIF}" ${mono ? '' : 'font-style="italic"'} font-size="${size || (mono ? 12 : 15)}" fill="${mono ? t.title : t.muted}" stroke="${t.paper}" stroke-width="6" stroke-linejoin="round" paint-order="stroke">${text}</text>`
  }
  const note = (x, y, w, lines, lx = x) => {
    lines.forEach((l, i) => label(x, y + i * 19, l, { size: 14 }))
  }
  const seal = (n, y) => { TOP += `<rect x="34" y="${y - 13}" width="26" height="26" rx="3" fill="${t.seal}"/><text x="47" y="${y + 5}" text-anchor="middle" font-family="${SERIF}" font-size="15" fill="${t.sealInk}">${n}</text>` }
  const mid = (a, b) => (X[a] + X[b]) / 2

  const Y = [168, 238, 304, 380, 458, 536, 612, 688]
  // 1 — identity
  seal(1, Y[0]); note(X[1], Y[0] - 2, 300, ['your key is created in the TPM — it never leaves'])
  // 2 — join request
  seal(2, Y[1]); arrow(X[1], X[3], Y[1]); label(mid(1, 3), Y[1] - 17, '[JOIN] request + key fingerprint', { mono: true })
  // 3 — approval, out of band
  seal(3, Y[2]); note(X[3] + 20, Y[2] - 2, 330, ['Bob confirms the fingerprint with you directly,', 'then: mesh approve alice/claude &lt;fingerprint&gt;'], X[3])
  // 4 — discovery + admission
  seal(4, Y[3]); arrow(X[1], X[3], Y[3], { both: true, red: true }); label(mid(1, 3), Y[3] - 18, 'find each other on the DHT · prove the team secret · Noise-encrypted link')
  // 5 — a question
  seal(5, Y[4])
  arrow(X[0], X[1], Y[4]); label(mid(0, 1), Y[4] - 17, 'mesh ask bob "port?"', { mono: true })
  arrow(X[1], X[3], Y[4], { red: true }); label(mid(1, 3), Y[4] - 17, 'signed by alice · HMAC with the team secret')
  arrow(X[3], X[4], Y[4]); label(mid(3, 4), Y[4] - 17, 'typed into the idle agent')
  // 6 — the answer
  seal(6, Y[5])
  arrow(X[4], X[3], Y[5]); label(mid(3, 4), Y[5] - 17, 'mesh reply "5173"', { mono: true })
  arrow(X[3], X[1], Y[5], { red: true }); label(mid(1, 3), Y[5] - 17, 'shown only if bob’s key is approved')
  arrow(X[1], X[0], Y[5]); label(mid(0, 1), Y[5] - 17, 'ask returns the answer')
  // 7 — offline delivery
  seal(7, Y[6])
  arrow(X[1], X[2], Y[6], { dashed: true }); label(mid(1, 2), Y[6] - 17, 'Bob offline? sealed into the mailbox')
  arrow(X[2], X[3], Y[6], { dashed: true }); label(mid(2, 3), Y[6] - 17, 'delivered when he starts')
  // 8 — shared memory and coordination
  seal(8, Y[7])
  arrow(X[0], X[2], Y[7], { both: true, dashed: true }); arrow(X[4], X[2], Y[7], { both: true, dashed: true })
  label(X[2], Y[7] + 26, 'tasks · file leases · decisions · contracts · notes', { mono: true, size: 11.5 })

  // lifelines: faint vertical dry-brush strokes
  const life = cols.map((c, i) => {
    const rr = rng(500 + i); let d = ''
    for (let k = 0; k < 3; k++) {
      let p = ''
      for (let y = top + 20; y <= bottom; y += 8) p += (y === top + 20 ? 'M' : 'L') + f1(c.x + (k - 1) * 1.4 + Math.sin(y / 40 + k) * 0.6) + ' ' + y
      d += `<path d="${p}" stroke-opacity="${(0.07 + rr() * 0.07).toFixed(2)}" stroke-width="${f1(0.8 + rr() * 0.8)}"/>`
    }
    return d
  }).join('')
  const head = (c) => `<text x="${c.x}" y="${top - 26}" text-anchor="middle" font-family="${MONO}" font-size="11.5" letter-spacing="3" fill="${t.title}">${c.name}</text>
    <text x="${c.x}" y="${top - 7}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="15" fill="${t.muted}">${c.sub}</text>
    <path d="M${c.x - 26} ${top + 6}Q${c.x} ${top + 3} ${c.x + 26} ${top + 6}" stroke="${t.ink}" stroke-width="2" stroke-opacity=".7" fill="none"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">How agent-mesh works</title>
  <desc id="desc">Sequence: 1 your agent's key is created in the TPM. 2 your mesh sends a JOIN request with the key fingerprint to Bob's mesh. 3 Bob confirms the fingerprint with you directly and approves it. 4 the two meshes find each other on the DHT, prove the team secret and open a Noise-encrypted link. 5 your agent runs mesh ask; the signed message travels to Bob's mesh and is typed into Bob's idle agent. 6 Bob's agent replies; the reply is shown only if Bob's key is approved, and your ask returns it. 7 if Bob is offline the message is sealed into the encrypted mailbox in the hive and delivered when he starts. 8 both sides share tasks, file leases, decisions, contracts and notes through the hive.</desc>
  ${defs(t, id)}
  ${washi(t, id, W, H, 11)}
  <g fill="none" stroke="${t.ink}" stroke-linecap="round">${life}</g>
  ${cols.map(head).join('\n  ')}
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">${INK}</g>
  ${TOP}
  <text x="${W / 2}" y="${H - 26}" text-anchor="middle" font-family="${MONO}" font-size="10.5" letter-spacing="2.6" fill="${t.muted}">NO SERVER IN BETWEEN · EVERY MESSAGE SIGNED · EVERY LINK ENCRYPTED · THE MESH RUNS ONLY WHILE YOUR AGENT DOES</text>
</svg>
`
}

// ── Logo: the ensō, three birds leaving its tail (transparent ground) ─────────────────────────────────────────────
function logo(t, id) {
  const e = enso(t, { cx: 116, cy: 128, R: 74, seed: 21, scale: 1.3, bristles: 26 })
  const birds = [[0, 9, 0.9], [1, 7, 0.75], [2, 5.4, 0.55]].map(([k, s, op]) => {
    const d = 26 + k * 22, a = e.tail.dir - 0.35 - k * 0.12
    return bird(e.tail.x + Math.cos(a) * d, e.tail.y + Math.sin(a) * d, a, s, op, 0.6)
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-labelledby="t"><title id="t">agent mesh</title>
  ${defs(t, id)}
  <g filter="url(#${id}-bleed)">${e.svg}</g>
  <g fill="none" stroke="${t.ink}" stroke-linecap="round" stroke-linejoin="round">${birds}</g>
</svg>
`
}

// ── Icons: monoline, neutral stone (reads on both GitHub themes), one vermilion-seal detail each. ──────────────────
const IC = '#8C887F', AC = '#A0453A'
const icon = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${IC}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`
const ICONS = {
  conversation: icon(`<path d="M4 6.5C4 5.1 5.1 4 6.5 4h7C14.9 4 16 5.1 16 6.5v4c0 1.4-1.1 2.5-2.5 2.5H9l-3.5 3v-3H6.5C5.1 13 4 11.9 4 10.5z"/><path d="M18.5 9.5h.5c1.1 0 2 .9 2 2v3.5c0 1.1-.9 2-2 2h-1v2.5L15 17h-3"/><path d="M8 8.5h4" stroke="${AC}"/>`),
  delivery: icon(`<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/><circle cx="21" cy="12" r=".9" fill="${AC}" stroke="${AC}"/>`),
  offline: icon(`<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/><path d="M15.5 16h3" stroke="${AC}"/>`),
  memory: icon(`<path d="M5 4.5h11.5L19 7v12.5H5z"/><path d="M8.5 9.5h7M8.5 13h7"/><path d="M8.5 16.5h4" stroke="${AC}"/>`),
  coordination: icon(`<path d="M5 6.5l1.5 1.5L9 5.5M5 12.5l1.5 1.5L9 11.5"/><path d="M12 7h7M12 13h7M12 18.5h7"/><path d="M5.3 18.5h2.4" stroke="${AC}"/>`),
  identity: icon(`<circle cx="8.5" cy="12" r="4"/><path d="M12.5 12H21M17.5 12v3M20 12v2"/><circle cx="8.5" cy="12" r="1.1" fill="${AC}" stroke="${AC}"/>`),
  control: icon(`<path d="M12 3.5l7 2.5v5.5c0 4.3-3 7.5-7 9-4-1.5-7-4.7-7-9V6z"/><path d="M9 12l2 2 4-4.5" stroke="${AC}"/>`),
  updates: icon(`<path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M19.5 4.5V9H15M4.5 19.5V15H9"/><circle cx="12" cy="12" r="1.1" fill="${AC}" stroke="${AC}"/>`),
}

fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true }) // also creates OUT
for (const [name, t] of Object.entries(THEMES)) {
  fs.writeFileSync(path.join(OUT, `banner-${name}.svg`), banner(t, 'b' + name[0]))
  fs.writeFileSync(path.join(OUT, `flow-${name}.svg`), flow(t, 'f' + name[0]))
  fs.writeFileSync(path.join(OUT, `logo-${name}.svg`), logo(t, 'l' + name[0]))
}
fs.writeFileSync(path.join(OUT, 'logo.svg'), logo({ ...THEMES.light, ink: '#4F4B45' }, 'lx'))
for (const [n, s] of Object.entries(ICONS)) fs.writeFileSync(path.join(OUT, 'icons', `${n}.svg`), s)
for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.svg'))) console.log(f.padEnd(22), Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + ' KB')
