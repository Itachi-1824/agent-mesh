// SPDX-License-Identifier: AGPL-3.0-only
// README artwork for agent-mesh — logo, banner, architecture diagram, icons — from one set of design tokens.
// Direction: editorial, ink on paper, hairline threads, a single persimmon accent. Run: node assets/build.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = path.dirname(fileURLToPath(import.meta.url))
const SERIF = `'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif`
const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
const MONO = `ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`

const THEMES = {
  dark: { bg: '#11100E', surface: '#181714', rule: '#34312B', thread: '#5A554B', ink: '#EEE8DC', muted: '#9C9587', faint: '#6B655A', accent: '#E0663F' },
  light: { bg: '#F4EFE6', surface: '#FAF7F1', rule: '#D9D0C1', thread: '#B4AA99', ink: '#1A1815', muted: '#6B6458', faint: '#9A9283', accent: '#C8502B' },
}

// ── The mark: a trefoil knot — one continuous thread woven over and under itself, a single bead riding on it. ──────
// Three strands, one line: nothing holds without the others. Crossings alternate (over, under, over…) like a real knot.
const knot = (() => {
  const raw = (t) => [Math.sin(t) + 2 * Math.sin(2 * t), -(Math.cos(t) - 2 * Math.cos(2 * t))]
  const rs = Array.from({ length: 2000 }, (_, i) => raw(i / 2000 * Math.PI * 2))
  const [x0, x1, y0, y1] = [Math.min(...rs.map(p => p[0])), Math.max(...rs.map(p => p[0])), Math.min(...rs.map(p => p[1])), Math.max(...rs.map(p => p[1]))]
  const k = 196 / Math.max(x1 - x0, y1 - y0) // fit the knot (incl. stroke) inside the 240 box, optically centred
  const P = (t) => { const [x, y] = raw(t); return [120 + (x - (x0 + x1) / 2) * k, 120 + (y - (y0 + y1) / 2) * k] }
  const N = 1440, ts = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2), pts = ts.map(P)
  const poly = (a, b) => { let d = ''; for (let i = 0; i <= 120; i++) { const [x, y] = P(a + (b - a) * i / 120); d += (i ? ' L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2) } return d }
  // find the self-crossings: pairs of far-apart parameters that land on the same point
  const events = []
  for (let i = 0; i < N; i++) for (let j = i + 60; j < N - 60 + i && j < N; j++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[j]
    if (Math.hypot(x1 - x2, y1 - y2) < 1.2 && !events.some(e => Math.abs(e.a - ts[i]) < 0.15 && Math.abs(e.b - ts[j]) < 0.15)) events.push({ a: ts[i], b: ts[j] })
  }
  const along = events.flatMap((e, k) => [{ t: e.a, k }, { t: e.b, k }]).sort((x, y) => x.t - y.t)
  const over = along.filter((_, i) => i % 2 === 0).map(e => e.t) // alternate over/under along the thread
  return { full: poly(0, Math.PI * 2) + ' Z', over, poly, P }
})()
// Gaps at the crossings are cut with a mask (true transparency), so the mark works on any background.
let markId = 0
const markSvg = (ink, accent) => {
  const W = 11, id = `knot${markId++}`
  const [bx, by] = knot.P(5.15)
  const cuts = knot.over.map(t => `<path d="${knot.poly(t - 0.2, t + 0.2)}" stroke="#000" stroke-width="${W + 15}" stroke-linecap="butt" fill="none"/>`).join('')
  const overs = knot.over.map(t => `<path d="${knot.poly(t - 0.32, t + 0.32)}" stroke="${ink}" stroke-width="${W}" stroke-linecap="round" fill="none"/>`).join('')
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
    <rect width="240" height="240" fill="#fff"/>${cuts}<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="17" fill="#000"/>
  </mask>
  <path d="${knot.full}" stroke="${ink}" stroke-width="${W}" fill="none" stroke-linejoin="round" mask="url(#${id})"/>
  ${overs}
  <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="11" fill="${accent}"/>`
}
const markAt = (t, x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 240})">${markSvg(t.ink, t.accent)}</g>`

// ── Banner ──────────────────────────────────────────────────────────────────────────────────────────────────────
// Right side: a small "loom" — agents joined by gently curved hairline threads, one thread in the accent colour.
function banner(t) {
  const W = 1280, H = 420
  // Four agents on an elliptical orbit around the hive: symmetric, calm, one accent thread.
  const O = { x: 1010, y: 212, rx: 196, ry: 118 }
  const at = (deg) => ({ x: +(O.x + O.rx * Math.cos(deg * Math.PI / 180)).toFixed(1), y: +(O.y + O.ry * Math.sin(deg * Math.PI / 180)).toFixed(1) })
  const A = [
    { ...at(214), label: 'alice/claude', lx: -14, ly: -22, anchor: 'start' },
    { ...at(326), label: 'bob/codex', lx: 14, ly: -22, anchor: 'end' },
    { ...at(34), label: 'carol/opencode', lx: 14, ly: 34, anchor: 'end' },
    { ...at(146), label: 'dave/gemini', lx: -14, ly: 34, anchor: 'start' },
  ]
  const bend = (p, q, k) => { const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2; return `M${p.x} ${p.y} Q${(mx + (O.x - mx) * k).toFixed(1)} ${(my + (O.y - my) * k).toFixed(1)} ${q.x} ${q.y}` }
  const chords = [[0, 2], [1, 3]].map(([i, j]) => bend(A[i], A[j], 0))
  const sides = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j]) => bend(A[i], A[j], 0.42))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">agent-mesh</title>
  <desc id="desc">Serverless, end-to-end encrypted coordination for AI coding agents.</desc>
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${t.rule}"/>

  <!-- orbit, threads, hive -->
  <ellipse cx="${O.x}" cy="${O.y}" rx="${O.rx + 44}" ry="${O.ry + 34}" fill="none" stroke="${t.rule}" stroke-dasharray="1 7" stroke-linecap="round" stroke-width="1.6"/>
  <ellipse cx="${O.x}" cy="${O.y}" rx="${O.rx}" ry="${O.ry}" fill="none" stroke="${t.thread}" stroke-width="1"/>
  <g fill="none" stroke-linecap="round">
    ${sides.map(d => `<path d="${d}" stroke="${t.thread}" stroke-width="1.1"/>`).join('\n    ')}
    <path d="${chords[1]}" stroke="${t.thread}" stroke-width="1.1"/>
    ${A.map(a => `<path d="M${a.x} ${a.y} L${O.x} ${O.y}" stroke="${t.thread}" stroke-width="1" stroke-dasharray="2 5"/>`).join('')}
    <path d="${chords[0]}" stroke="${t.accent}" stroke-width="2.2"/>
  </g>
  <circle cx="${O.x}" cy="${O.y}" r="22" fill="${t.bg}" stroke="${t.ink}" stroke-width="1.4"/>
  <circle cx="${O.x}" cy="${O.y}" r="12" fill="none" stroke="${t.ink}" stroke-width="1.4"/>
  <circle cx="${O.x}" cy="${O.y}" r="3.5" fill="${t.ink}"/>
  <text x="${O.x}" y="${O.y + 46}" text-anchor="middle" font-family="${MONO}" font-size="11.5" letter-spacing="2.2" fill="${t.muted}">HIVE</text>
  ${A.map((a, i) => `<circle cx="${a.x}" cy="${a.y}" r="11" fill="${t.bg}" stroke="${i % 2 ? t.thread : t.accent}" stroke-width="1"/><circle cx="${a.x}" cy="${a.y}" r="5.5" fill="${i % 2 ? t.ink : t.accent}"/>`).join('\n  ')}
  <g font-family="${MONO}" font-size="12" letter-spacing="1.6" fill="${t.muted}">
    ${A.map(a => `<text x="${a.x + a.lx}" y="${a.y + a.ly}" text-anchor="${a.anchor}">${a.label.toUpperCase()}</text>`).join('\n    ')}
  </g>

  <!-- wordmark -->
  ${markAt(t, 70, 112, 124)}
  <text x="224" y="178" font-family="${SERIF}" font-size="82" fill="${t.ink}" letter-spacing="-1">agent<tspan fill="${t.accent}">·</tspan>mesh</text>
  <text x="228" y="226" font-family="${SANS}" font-size="20" fill="${t.muted}">Serverless, end-to-end encrypted coordination</text>
  <text x="228" y="254" font-family="${SANS}" font-size="20" fill="${t.muted}">for AI coding agents — and the people behind them.</text>
  <line x1="228" y1="292" x2="700" y2="292" stroke="${t.rule}"/>
  <text x="228" y="322" font-family="${MONO}" font-size="12.5" letter-spacing="2.4" fill="${t.ink}">PEER-TO-PEER <tspan fill="${t.accent}">/</tspan> END-TO-END ENCRYPTED <tspan fill="${t.accent}">/</tspan> ANY AGENT</text>
</svg>
`
}

// ── Architecture ────────────────────────────────────────────────────────────────────────────────────────────────
function architecture(t) {
  const W = 1200, H = 600
  const cols = [
    { x: 60, title: 'Alice', agents: ['alice/claude', 'alice/codex'] },
    { x: 440, title: 'Bob', agents: ['bob/codex'] },
    { x: 820, title: 'Carol', agents: ['carol/opencode', 'carol/gemini'] },
  ]
  const CW = 320, top = 70
  const meshY = 300
  const col = (c) => {
    const cx = c.x + CW / 2
    const step = 150, start = cx - (c.agents.length - 1) * step / 2
    const ag = c.agents.map((a, i) => {
      const x = start + i * step
      return `<circle cx="${x}" cy="${top + 108}" r="5" fill="${t.ink}"/>
      <text x="${x}" y="${top + 86}" text-anchor="middle" font-family="${MONO}" font-size="12.5" fill="${t.ink}">${a}</text>
      <path d="M${x} ${top + 113} C${x} ${top + 170}, ${cx} ${meshY - 70}, ${cx} ${meshY - 13}" fill="none" stroke="${t.thread}" stroke-width="1.1"/>`
    }).join('')
    return `<g>
      <text x="${c.x}" y="${top}" font-family="${MONO}" font-size="11.5" letter-spacing="2.2" fill="${t.faint}">${c.title.toUpperCase()}'S MACHINE</text>
      <line x1="${c.x}" y1="${top + 14}" x2="${c.x + CW}" y2="${top + 14}" stroke="${t.rule}"/>
      ${ag}
      <circle cx="${cx}" cy="${meshY}" r="13" fill="${t.bg}" stroke="${t.ink}" stroke-width="1.4"/>
      <circle cx="${cx}" cy="${meshY}" r="4" fill="${t.ink}"/>
      <text x="${cx + 24}" y="${meshY + 4.5}" font-family="${SERIF}" font-style="italic" font-size="17" fill="${t.muted}">mesh</text>
    </g>`
  }
  const m = cols.map(c => ({ x: c.x + CW / 2, y: meshY }))
  const hive = { x: W / 2, y: 500 }
  const arc = (p, q, lift, stroke, w) => `<path d="M${p.x + 13} ${p.y} C${p.x + 110} ${p.y - lift}, ${q.x - 110} ${q.y - lift}, ${q.x - 13} ${q.y}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">How agent-mesh works</title>
  <desc id="desc">Each person's agents talk to a local mesh process; mesh processes connect directly, peer to peer, over encrypted links, and share a private git hive.</desc>
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="none" stroke="${t.rule}"/>
  ${cols.map(col).join('\n')}
  ${arc(m[0], m[1], 64, t.accent, 2)}
  ${arc(m[1], m[2], 64, t.accent, 2)}
  <path d="M${m[0].x} ${m[0].y + 13} C${m[0].x + 40} ${m[0].y + 96}, ${m[2].x - 40} ${m[2].y + 96}, ${m[2].x} ${m[2].y + 13}" fill="none" stroke="${t.accent}" stroke-width="1.4" stroke-opacity=".55"/>
  <g font-family="${MONO}" font-size="11.5" letter-spacing="1.8" fill="${t.accent}" text-anchor="middle">
    <text x="${(m[0].x + m[1].x) / 2}" y="${meshY - 58}">ENCRYPTED · PEER-TO-PEER</text>
    <text x="${(m[1].x + m[2].x) / 2}" y="${meshY - 58}">SIGNED MESSAGES</text>
  </g>
  ${m.map(p => `<line x1="${p.x}" y1="${p.y + 13}" x2="${hive.x + (p.x - hive.x) * 0.18}" y2="${hive.y - 40}" stroke="${t.thread}" stroke-width="1" stroke-dasharray="2 5"/>`).join('')}
  <rect x="${hive.x - 270}" y="${hive.y - 40}" width="540" height="76" fill="${t.surface}" stroke="${t.ink}" stroke-width="1.2"/>
  <text x="${hive.x}" y="${hive.y - 8}" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="${t.ink}">The hive <tspan font-style="italic" fill="${t.muted}">— a private git repository</tspan></text>
  <text x="${hive.x}" y="${hive.y + 20}" text-anchor="middle" font-family="${MONO}" font-size="11.5" letter-spacing="1.8" fill="${t.muted}">NOTES · DECISIONS · CONTRACTS · TASKS · OFFLINE MAILBOX</text>
</svg>
`
}

// ── Icons: monoline ink, one accent detail each. Neutral grey reads on both GitHub themes. ──────────────────────────
const IC = '#8B8478', AC = '#D4572E'
const icon = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${IC}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`
const ICONS = {
  conversation: icon(`<path d="M4 6.5C4 5.1 5.1 4 6.5 4h7C14.9 4 16 5.1 16 6.5v4c0 1.4-1.1 2.5-2.5 2.5H9l-3.5 3v-3H6.5C5.1 13 4 11.9 4 10.5z"/><path d="M18.5 9.5h.5c1.1 0 2 .9 2 2v3.5c0 1.1-.9 2-2 2h-1v2.5L15 17h-3" /><circle cx="10" cy="8.5" r=".9" fill="${AC}" stroke="${AC}"/>`),
  delivery: icon(`<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/><circle cx="21" cy="12" r="1" fill="${AC}" stroke="${AC}"/>`),
  offline: icon(`<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/><circle cx="18.5" cy="5.5" r="2.2" fill="${AC}" stroke="none"/>`),
  memory: icon(`<path d="M5 4.5h11.5L19 7v12.5H5z"/><path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4"/><circle cx="16.5" cy="16.5" r="1" fill="${AC}" stroke="${AC}"/>`),
  coordination: icon(`<path d="M5 6.5l1.5 1.5L9 5.5M5 12.5l1.5 1.5L9 11.5"/><path d="M12 7h7M12 13h7M12 18.5h7"/><circle cx="6.5" cy="18.5" r="1.3" fill="${AC}" stroke="${AC}"/>`),
  identity: icon(`<circle cx="8.5" cy="12" r="4"/><path d="M12.5 12H21M17.5 12v3M20 12v2"/><circle cx="8.5" cy="12" r="1.2" fill="${AC}" stroke="${AC}"/>`),
  control: icon(`<path d="M12 3.5l7 2.5v5.5c0 4.3-3 7.5-7 9-4-1.5-7-4.7-7-9V6z"/><path d="M9 12l2 2 4-4.5" stroke="${AC}"/>`),
  updates: icon(`<path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M19.5 4.5V9H15M4.5 19.5V15H9"/><circle cx="12" cy="12" r="1.3" fill="${AC}" stroke="${AC}"/>`),
}

// standalone logo (works on both themes: ink stroke with a mid-tone, accent node)
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-labelledby="t"><title id="t">agent-mesh</title>${markSvg(THEMES.light.ink, THEMES.light.accent)}</svg>
`

fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true })
for (const [name, t] of Object.entries(THEMES)) {
  fs.writeFileSync(path.join(OUT, `banner-${name}.svg`), banner(t))
  fs.writeFileSync(path.join(OUT, `architecture-${name}.svg`), architecture(t))
  fs.writeFileSync(path.join(OUT, `logo-${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-labelledby="t"><title id="t">agent-mesh</title>${markSvg(t.ink, t.accent)}</svg>\n`)
}
fs.writeFileSync(path.join(OUT, 'logo.svg'), logo)
for (const [n, s] of Object.entries(ICONS)) fs.writeFileSync(path.join(OUT, 'icons', `${n}.svg`), s)
console.log('assets written to', OUT)
