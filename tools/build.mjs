// Builds the README panels (assets/*.svg) in two themes: phos (dark) and beige (light).
// Every panel is an SVG with an XHTML <foreignObject> inside, so the site's CSS carries over.
// usage: node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const here = (p) => new URL(p, import.meta.url);
const out = (p) => new URL(`../assets/${p}`, import.meta.url);
mkdirSync(out(''), { recursive: true });

// ---------- design tokens (copied from the site's src/styles/global.css) ----------
const THEMES = {
  dark: {
    bg: '#0f0e0c', bg2: '#15130f', panel: '#1a1814', panel2: '#211e19', line: '#2d2922', line2: '#443e34',
    fg: '#ece4d2', dim: '#a39a86', mute: '#8a8170', accent: '#ffb000', accentText: '#ffb000', accentInk: '#1a1206',
    orange: '#ff6a1a', red: '#e5432d', redText: '#ff6b52', brown: '#7a5a3a', ok: '#a3d977',
    glow: '0 0 0.6em rgb(255 176 0 / 0.35)', scan: 0.045,
  },
  light: {
    bg: '#e6dfcd', bg2: '#ddd5c0', panel: '#efe9da', panel2: '#f6f1e5', line: '#c8bea6', line2: '#ab9f84',
    fg: '#1c1914', dim: '#574f42', mute: '#655d4e', accent: '#ffad0d', accentText: '#a14f00', accentInk: '#1a1206',
    orange: '#d9540c', red: '#c2321d', redText: '#a8291a', brown: '#8d6a45', ok: '#3f7a1f',
    glow: 'none', scan: 0,
  },
};

const font = (file, family, weight) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(here(`fonts/${file}`)).toString('base64')}) format('woff2')}`;
const FONTS = {
  display600: font('chakra-petch-latin-600-normal.woff2', 'Chakra Petch', 600),
  display700: font('chakra-petch-latin-700-normal.woff2', 'Chakra Petch', 700),
  mono400: font('ibm-plex-mono-latin-400-normal.woff2', 'IBM Plex Mono', 400),
  mono500: font('ibm-plex-mono-latin-500-normal.woff2', 'IBM Plex Mono', 500),
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const vars = (t) => `--bg:${t.bg};--bg-2:${t.bg2};--panel:${t.panel};--panel-2:${t.panel2};--line:${t.line};--line-2:${t.line2};--fg:${t.fg};--dim:${t.dim};--mute:${t.mute};--accent:${t.accent};--accent-text:${t.accentText};--accent-ink:${t.accentInk};--orange:${t.orange};--red:${t.red};--red-text:${t.redText};--brown:${t.brown};--ok:${t.ok};--glow:${t.glow};--scan:${t.scan}`;

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.root{width:100%;height:100%;color:var(--fg);font:400 15px/1.65 'IBM Plex Mono',ui-monospace,Consolas,monospace;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden}
.display{font-family:'Chakra Petch','IBM Plex Mono',sans-serif;font-weight:600;line-height:1.1;letter-spacing:.01em}
.dim{color:var(--dim)}
.eyebrow{font:500 11px/1.5 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:.6em}
.led{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:var(--glow);flex:none}
.scan::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(to bottom,rgb(0 0 0 / var(--scan)) 0 1px,transparent 1px 3px),
  radial-gradient(ellipse at center,transparent 60%,rgb(0 0 0 / calc(var(--scan) * 5)) 100%)}
.caret{display:inline-block;width:.55em;height:1.05em;background:var(--accent);vertical-align:-.18em;margin-left:2px;animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important}}
`;

const svg = (w, h, fonts, css, html, t, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>${fonts.join('')}</style>
<foreignObject x="0" y="0" width="${w}" height="${h}">
<div xmlns="http://www.w3.org/1999/xhtml" class="root" style="${vars(t)}">
<style>${BASE_CSS}${css}</style>
${html}
</div>
</foreignObject>
</svg>
`;

// ---------- logo ----------
const logoSrc = readFileSync(here('feelgxxd.svg'), 'utf8');
const logoPath = logoSrc.match(/<path[^>]*\/>/)[0];
const logoVB = logoSrc.match(/viewBox="([^"]+)"/)[1];
const logo = (cls) => `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="${logoVB}" fill="currentColor">${logoPath}</svg>`;

// ---------- skull frames ----------
const SK = JSON.parse(readFileSync(here('skull-frames.json'), 'utf8'));
const SPIN_S = 9; // one full turn
const skullFrames = () => SK.frames.map((rows, i) => {
  const lines = rows.map(([txt, mask]) => {
    let s = '', open = false;
    for (let c = 0; c < txt.length; c++) {
      const sw = mask[c] === '1';
      if (sw !== open) { s += sw ? '<b>' : '</b>'; open = sw; }
      s += esc(txt[c]);
    }
    if (open) s += '</b>';
    return s.replace(/\s+$/, '');
  }).join('\n');
  return `<pre class="fr" style="animation-delay:${((i * SPIN_S) / SK.frames.length).toFixed(3)}s">${lines}</pre>`;
}).join('\n');

// ================= HERO =================
const W = 830;
const hero = (t, theme) => {
  const word = 'feelgxxd'.split('').map((c, i) => `<span style="animation-delay:${(-i * 0.4).toFixed(1)}s">${c}</span>`).join('');
  const proof = [
    'shipped a mobile title at lugal games',
    'c++ software renderer, up to 26× faster with simd',
    'roguelike deckbuilder with a monte carlo balance sim',
    '4 playable games on the site',
  ].map((p) => `<li><i>✓</i> ${esc(p)}</li>`).join('');
  const role = 'game &amp; software developer';
  const css = `
  .root{background:var(--bg);border:1px solid var(--line);border-radius:10px}
  .top{height:3px;background:var(--orange)}
  .hd{display:flex;align-items:center;gap:12px;padding:12px 26px;border-bottom:1px solid var(--line)}
  .hd .mk{width:52px;height:30px;color:var(--fg)}
  .hd .nm{font:600 15px/1.1 'Chakra Petch',sans-serif;letter-spacing:.04em;text-transform:uppercase}
  .hd .nm small{display:block;font:400 11px/1.3 'IBM Plex Mono',monospace;color:var(--dim);text-transform:none;letter-spacing:0}
  .hd .sp{flex:1}
  .hd .path{font-size:12px;color:var(--mute)}
  .hd .path b{color:var(--accent-text);font-weight:500}
  .hd .pill{font-size:10px;letter-spacing:.15em;color:var(--mute);display:flex;align-items:center;gap:8px;border:1px solid var(--line-2);border-radius:4px;padding:5px 8px}
  .hd .pill i{width:7px;height:7px;border-radius:50%;background:var(--red);animation:blink 1.6s steps(1) infinite}
  .body{display:grid;grid-template-columns:1fr 312px;gap:26px;padding:28px 26px 30px;align-items:center}
  .wordmark{font:700 100px/.9 'Chakra Petch',sans-serif;letter-spacing:-.01em;color:var(--accent);display:flex;margin:16px 0 20px}
  .wordmark span{display:inline-block;animation:bob 3.2s ease-in-out infinite;
    text-shadow:1px 1px 0 var(--brown),2px 2px 0 var(--brown),3px 3px 0 var(--brown),4px 4px 0 var(--brown),5px 5px 0 var(--brown),6px 6px 0 var(--brown),7px 7px 0 color-mix(in srgb,var(--brown) 70%,var(--bg)),10px 14px 24px rgb(0 0 0 / .45)}
  @keyframes bob{50%{transform:translateY(-5px)}}
  .aka{font-size:14px;margin-bottom:10px;white-space:nowrap}
  .role{color:var(--accent-text);display:inline-block;vertical-align:bottom;overflow:hidden;white-space:nowrap;width:0;animation:type 1.4s steps(25) .9s forwards}
  @keyframes type{to{width:25ch}}
  .intro{color:var(--dim);font-size:13.5px;line-height:1.7;max-width:46ch}
  .proof{list-style:none;margin-top:16px;display:flex;flex-direction:column;align-items:flex-start;gap:7px}
  .proof li{padding:3px 10px 3px 8px;border:1px solid var(--line-2);border-radius:4px;font-size:11.5px;background:var(--panel);white-space:nowrap}
  .proof i{font-style:normal;color:var(--ok)}
  .scene{display:flex;flex-direction:column;gap:12px}
  .screen{position:relative;width:312px;height:312px;border-radius:18px;overflow:hidden;
    background:radial-gradient(ellipse at center,color-mix(in srgb,#ffb000 7%,#15130f),#15130f 70%);
    border:1px solid ${theme === 'light' ? '#3a342a' : 'var(--line-2)'};
    box-shadow:inset 0 0 60px rgb(0 0 0 / .55),0 0 0 6px var(--panel),0 0 0 7px var(--line)}
  .screen .lbl{position:absolute;top:12px;font-size:10px;letter-spacing:.15em;color:#8a8170;z-index:1}
  .screen .l{left:14px}.screen .r{right:14px}
  .fr{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.33);
    font:600 12px/1 'IBM Plex Mono',monospace;letter-spacing:.08em;white-space:pre;color:#ffb000;text-shadow:0 0 .6em rgb(255 176 0 / .35);
    visibility:hidden;animation:fr ${SPIN_S}s steps(1,end) infinite}
  .fr b{font-weight:600;opacity:.75}
  @keyframes fr{0%{visibility:visible}${(100 / SK.frames.length).toFixed(4)}%{visibility:hidden}100%{visibility:hidden}}
  .screen::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgb(0 0 0 / .18) 0 1px,transparent 1px 3px)}
  .cap{font-size:11px;color:var(--mute);text-align:center;letter-spacing:.05em}
  `;
  const html = `<div class="scan" style="position:absolute;inset:0;z-index:5;pointer-events:none"></div>
<div class="top"></div>
<header class="hd">
  ${logo('mk')}
  <p class="nm">Berk Beken<small>// feelgxxd</small></p>
  <span class="sp"></span>
  <span class="path">github.com/<b>feelgxxd</b></span>
  <span class="pill"><i></i>REC</span>
</header>
<section class="body">
  <div>
    <p class="eyebrow"><span class="led"></span>istanbul, tr · open to remote</p>
    <h1 class="wordmark">${word}</h1>
    <p class="aka"><span class="dim">a.k.a.</span> Berk Beken <span class="dim">/ </span><span class="role">${role}</span><span class="caret"></span></p>
    <p class="intro">i build gameplay systems, engine tools and the web around them. this is the source. the tapes, logs and jokes live on the site.</p>
    <ul class="proof">${proof}</ul>
  </div>
  <figure class="scene">
    <div class="screen">
      <span class="lbl l">MESH: SKULL</span><span class="lbl r">07 FPS</span>
      ${skullFrames()}
    </div>
    <figcaption class="cap">can't drag this one. github said no.</figcaption>
  </figure>
</section>`;
  return svg(W, 512, [FONTS.display600, FONTS.display700, FONTS.mono400, FONTS.mono500], css, html, t, 'feelgxxd, a.k.a. Berk Beken, game & software developer');
};

// ================= BUTTONS (each its own image, so each is a link) =================
const button = (t, label, solid, w) => svg(w, 44, [FONTS.mono500], `
  .root{display:flex;align-items:center;justify-content:center;background:transparent}
  .btn{display:flex;align-items:center;justify-content:center;gap:.6em;width:${w - 4}px;height:38px;margin-bottom:4px;border:1px solid ${solid ? 'var(--accent)' : 'var(--line-2)'};border-radius:4px;
    background:${solid ? 'var(--accent)' : 'var(--panel)'};color:${solid ? 'var(--accent-ink)' : 'var(--fg)'};font:500 13px/1 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 3px 0 0 var(--line)}`,
  `<div class="btn">${esc(label)}</div>`, t, label);

// ================= TICKER =================
const ticker = (t) => {
  const run = Array.from({ length: 3 }, () => `<span class="txt">sh*t that i have to deal with on a daily basis</span><span class="sep">◂◂</span><span class="txt ghost">sh*t that i have to deal with on a daily basis</span><span class="sep">●</span>`).join('');
  const css = `
  .root{background:transparent}
  .ticker{position:absolute;inset:0;overflow:hidden;border:1px solid var(--line);border-radius:6px;
    background:repeating-linear-gradient(90deg,transparent 0 6px,color-mix(in srgb,var(--accent) 5%,transparent) 6px 7px),var(--bg-2);
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}
  .ticker::before,.ticker::after{content:'';position:absolute;left:0;right:0;height:3px;opacity:.55;
    background:repeating-linear-gradient(90deg,var(--accent) 0 18px,var(--orange) 18px 36px,var(--red) 36px 54px,transparent 54px 72px)}
  .ticker::before{top:4px}.ticker::after{bottom:4px}
  .track{position:absolute;top:0;bottom:0;left:0;display:flex;align-items:center;width:max-content;animation:tape 48s linear infinite}
  .run{display:flex;align-items:center;flex-shrink:0}
  .txt{font:700 34px/1.1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap;color:var(--accent-text);text-shadow:var(--glow)}
  .ghost{color:transparent;-webkit-text-stroke:1px var(--line-2);text-shadow:none}
  .sep{margin:0 30px;font-size:14px;color:var(--mute)}
  @keyframes tape{to{transform:translateX(-50%)}}`;
  return svg(W, 72, [FONTS.display700, FONTS.mono400], css, `<div class="ticker"><div class="track"><div class="run">${run}</div><div class="run">${run}</div></div></div>`, t, 'sh*t that i have to deal with on a daily basis');
};

// ================= SECTION HEAD =================
const secHead = (t, idx, title, link) => svg(W, 56, [FONTS.display600, FONTS.mono500], `
  .root{display:flex;align-items:baseline;gap:16px;padding:14px 2px 0}
  .idx{color:var(--accent-text);font:500 13px 'IBM Plex Mono',monospace}
  h2{font:600 30px/1.1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em}
  .rule{flex:1;height:1px;align-self:center;background:repeating-linear-gradient(to right,var(--line-2) 0 4px,transparent 4px 8px)}
  .lk{font-size:13px;color:var(--dim);text-decoration:underline;text-decoration-color:var(--line-2);text-underline-offset:3px}`,
  `<span class="idx">${idx}</span><h2>${esc(title)}</h2><span class="rule"></span>${link ? `<span class="lk">${esc(link)} →</span>` : ''}`, t, `${idx} ${title}`);

// ================= TRACK CARDS =================
const LANES = [
  {
    id: 'gameplay', title: 'gameplay',
    text: 'mechanics, progression, economies and balance, plus the systems and tests that keep them honest.',
    items: [['knightfall', 'wip'], ['cinerace', 'live'], ['idle of carbon city', 'shipped'], ['claylings', 'shipped']],
    stack: ['Unity', 'C#', 'LÖVE2D', 'Lua'],
  },
  {
    id: 'engine', title: 'engine & tools',
    text: 'rendering, multithreading and simd, procedural generation, and the tools and simulators that make the rest faster.',
    items: [['tiny renderer', 'shipped'], ['textel', 'shipped'], ['knightfall', 'wip']],
    stack: ['C++17', 'SIMD', 'WebAssembly', 'CMake'],
  },
  {
    id: 'web', title: 'web & infra',
    text: 'client platforms, live event systems and deployment.',
    items: [['summit check-in', 'shipped'], ['veviski', 'live'], ['fular digital', 'paused'], ['merin protection', 'live']],
    stack: ['JavaScript', 'SQL', 'CI/CD'],
  },
];
const CW = 300, CH = 392;
const card = (t, lane, i) => svg(CW, CH, [FONTS.display600, FONTS.mono400, FONTS.mono500], `
  .root{padding:0 5px}
  .lane{height:100%;display:flex;flex-direction:column;gap:12px;padding:18px 18px 16px;background:var(--panel);border:1px solid var(--line);border-radius:6px;position:relative;overflow:hidden}
  .hd{display:flex;align-items:center;justify-content:space-between}
  .trk{font-size:10.5px;letter-spacing:.18em;color:var(--mute)}
  .vu{display:flex;align-items:flex-end;gap:2px;height:14px}
  .vu i{width:3px;background:var(--accent);opacity:.8;transform-origin:bottom;animation:vu 1.1s ease-in-out infinite alternate}
  @keyframes vu{to{transform:scaleY(.35)}}
  h3{font:600 26px/1.1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em}
  .txt{color:var(--dim);font-size:13px;line-height:1.6}
  ul{list-style:none;border-top:1px dashed var(--line)}
  li{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:12.5px;text-transform:uppercase}
  li em{font-style:normal;font-size:10px;letter-spacing:.12em;color:var(--mute);align-self:center}
  li em.live{color:var(--ok)}
  .stack{margin-top:auto;font-size:11px;color:var(--mute);letter-spacing:.06em}
  .stripe{position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(to right,var(--accent) 0 33%,var(--orange) 33% 66%,var(--red) 66%)}`,
  `<article class="lane scan">
  <header class="hd"><span class="trk">TRACK ${String(i + 1).padStart(2, '0')}</span>
    <span class="vu">${[[40, -0.2], [80, -0.5], [60, -0.1], [100, -0.7], [30, -0.3]].map(([h, d]) => `<i style="height:${h}%;animation-delay:${d + i * 0.13}s"></i>`).join('')}</span></header>
  <h3>${esc(lane.title)}</h3>
  <p class="txt">${esc(lane.text)}</p>
  <ul>${lane.items.map(([n, s]) => `<li><span>${esc(n)}</span><em class="${s}">${s}</em></li>`).join('')}</ul>
  <p class="stack">${lane.stack.map(esc).join(' · ')}</p>
  <span class="stripe"></span>
</article>`, t, `track ${i + 1}: ${lane.title}`);

// ---------- write ----------
const files = [];
const put = (name, s) => { writeFileSync(out(name), s); files.push([name, s.length]); };
for (const [theme, t] of Object.entries(THEMES)) {
  put(`hero-${theme}.svg`, hero(t, theme));
  put(`btn-projects-${theme}.svg`, button(t, '▸ see projects', true, 200));
  put(`btn-contact-${theme}.svg`, button(t, '✉ get in touch', false, 200));
  put(`ticker-${theme}.svg`, ticker(t));
  put(`sec-01-${theme}.svg`, secHead(t, '01', 'what i do', 'see the map'));
  LANES.forEach((l, i) => put(`track-${l.id}-${theme}.svg`, card(t, l, i)));
}
for (const [n, b] of files) console.log(`${(b / 1024).toFixed(0).padStart(5)} KB  ${n}`);
