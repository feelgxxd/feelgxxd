// Builds the profile README: every panel in assets/ (phos = dark, beige = light) and README.md itself.
// Panels are SVGs with an XHTML <foreignObject> inside, so the site's CSS carries over.
// Content that people click or read (repo links, logs) stays as plain markdown.
// usage: node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const here = (p) => new URL(p, import.meta.url);
const ASSETS = new URL('../assets/', import.meta.url);
rmSync(ASSETS, { recursive: true, force: true });
mkdirSync(ASSETS, { recursive: true });

const SITE = 'https://berkbeken.xo.je';
const GH = 'https://github.com/feelgxxd';
const LINKS = {
  site: SITE,
  itch: 'https://berkbeken.itch.io',
  linkedin: 'https://www.linkedin.com/in/berk-beken/',
  mail: 'mailto:berkbeken@outlook.com',
};

// ---------- design tokens (from the site's src/styles/global.css) ----------
const THEMES = {
  dark: {
    name: 'phos', bg: '#0f0e0c', bg2: '#15130f', panel: '#1a1814', panel2: '#211e19', line: '#2d2922', line2: '#443e34',
    fg: '#ece4d2', dim: '#a39a86', mute: '#8a8170', accent: '#ffb000', accentText: '#ffb000', accentInk: '#1a1206',
    orange: '#ff6a1a', red: '#e5432d', redText: '#ff6b52', brown: '#7a5a3a', ok: '#a3d977',
    glow: '0 0 0.6em rgb(255 176 0 / 0.35)', scan: 0.045, label: '#e9dfc8', labelInk: '#1c1914',
  },
  light: {
    name: 'beige', bg: '#e6dfcd', bg2: '#ddd5c0', panel: '#efe9da', panel2: '#f6f1e5', line: '#c8bea6', line2: '#ab9f84',
    fg: '#1c1914', dim: '#574f42', mute: '#655d4e', accent: '#ffad0d', accentText: '#a14f00', accentInk: '#1a1206',
    orange: '#d9540c', red: '#c2321d', redText: '#a8291a', brown: '#8d6a45', ok: '#3f7a1f',
    glow: 'none', scan: 0, label: '#fbf7ee', labelInk: '#1c1914',
  },
};

const font = (file, family, weight) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(here(`fonts/${file}`)).toString('base64')}) format('woff2')}`;
const F = {
  d600: font('chakra-petch-latin-600-normal.woff2', 'Chakra Petch', 600),
  d700: font('chakra-petch-latin-700-normal.woff2', 'Chakra Petch', 700),
  m400: font('ibm-plex-mono-latin-400-normal.woff2', 'IBM Plex Mono', 400),
  m500: font('ibm-plex-mono-latin-500-normal.woff2', 'IBM Plex Mono', 500),
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const vars = (t) => `--bg:${t.bg};--bg-2:${t.bg2};--panel:${t.panel};--panel-2:${t.panel2};--line:${t.line};--line-2:${t.line2};--fg:${t.fg};--dim:${t.dim};--mute:${t.mute};--accent:${t.accent};--accent-text:${t.accentText};--accent-ink:${t.accentInk};--orange:${t.orange};--red:${t.red};--red-text:${t.redText};--brown:${t.brown};--ok:${t.ok};--glow:${t.glow};--scan:${t.scan};--label:${t.label};--label-ink:${t.labelInk}`;

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.root{width:100%;height:100%;color:var(--fg);font:400 15px/1.65 'IBM Plex Mono',ui-monospace,Consolas,monospace;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden}
.dim{color:var(--dim)}
.eyebrow{font:500 11px/1.5 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:.6em}
.led{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:var(--glow);flex:none}
.scan::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(to bottom,rgb(0 0 0 / var(--scan)) 0 1px,transparent 1px 3px),
  radial-gradient(ellipse at center,transparent 60%,rgb(0 0 0 / calc(var(--scan) * 5)) 100%)}
.caret{display:inline-block;width:.55em;height:1.05em;background:var(--accent);vertical-align:-.18em;margin-left:2px;animation:blink 1.1s steps(1) infinite}
.stripe{position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(to right,var(--accent) 0 33%,var(--orange) 33% 66%,var(--red) 66%)}
.tag{display:inline-block;font-size:10px;line-height:1;letter-spacing:.08em;text-transform:uppercase;padding:4px 6px;border:1px solid var(--line-2);border-radius:3px;color:var(--dim);white-space:nowrap}
.tag.live{border-color:var(--ok);color:var(--ok)}
.tag.acc{border-color:var(--accent);color:var(--accent-text)}
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
const logo = (cls) => `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="${logoSrc.match(/viewBox="([^"]+)"/)[1]}" fill="currentColor">${logoSrc.match(/<path[^>]*\/>/)[0]}</svg>`;

// ---------- the ascii screen: a spinning donut, rendered by textel (github.com/feelgxxd/textel) ----------
// tools/textel-donut.svg was made with:
//   npx @feelgxxd/textel@1.0.0 render --example donut --size 112x56 --aspect 1.47 --frames 96 --fps 8 \
//     --color "#301000,#ffb000" --pitch 0.5 -o tools/textel-donut.svg
// Its own frame animation is kept as is; it is only inlined and scaled to fit the screen.
const TEXTEL = readFileSync(here('textel-donut.svg'), 'utf8');
const FPS = Math.round(TEXTEL.match(/<g class="f"/g).length / Number(TEXTEL.match(/animation:t ([\d.]+)s/)[1]));
const asciiFrames = TEXTEL.replace(/<title>[\s\S]*?<\/title>\n?/, '').replace(/^<svg ([^>]*?) width="[^"]*" height="[^"]*"/, '<svg class="tx" $1');
const SCREEN_CSS = (theme, size) => `
  .screen{position:relative;width:${size}px;height:${size}px;border-radius:18px;overflow:hidden;flex:none;
    background:radial-gradient(ellipse at center,color-mix(in srgb,#ffb000 7%,#15130f),#15130f 70%);
    border:1px solid ${theme === 'light' ? '#3a342a' : 'var(--line-2)'};
    box-shadow:inset 0 0 60px rgb(0 0 0 / .55),0 0 0 6px var(--panel),0 0 0 7px var(--line)}
  .screen .lbl{position:absolute;top:12px;font-size:10px;letter-spacing:.15em;color:#8a8170;z-index:1}
  .screen .l{left:14px}.screen .r{right:14px}
  .tx{position:absolute;left:50%;top:50%;width:${Math.round(size * 0.96)}px;height:auto;transform:translate(-50%,-50%);
    filter:drop-shadow(0 0 3px rgb(255 176 0 / .35))}
  .tx text{font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:600}
  .screen::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgb(0 0 0 / .18) 0 1px,transparent 1px 3px)}
  .cap{font-size:11px;color:var(--mute);text-align:center;letter-spacing:.05em}
  .cap b{color:var(--accent-text);font-weight:500}`;
const screen = () => `<div class="screen"><span class="lbl l">MESH: DONUT</span><span class="lbl r">${String(FPS).padStart(2, '0')} FPS</span>
${asciiFrames}
</div>`;

// ================= HERO =================
const W = 830;
const PROOF = [
  'shipped a mobile title at lugal games',
  'c++ software renderer, up to 26× faster with simd',
  'roguelike deckbuilder with a monte carlo balance sim',
  '4 playable games on the site',
];
const HERO_CSS = (t, theme, size) => `
  .root{background:var(--bg);border:1px solid var(--line);border-radius:10px}
  .top{height:3px;background:var(--orange)}
  .hd{display:flex;align-items:center;gap:12px;padding:12px 24px;border-bottom:1px solid var(--line)}
  .hd .mk{width:52px;height:30px;color:var(--fg);flex:none}
  .hd .nm{font:600 15px/1.1 'Chakra Petch',sans-serif;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
  .hd .nm small{display:block;font:400 11px/1.3 'IBM Plex Mono',monospace;color:var(--dim);text-transform:none;letter-spacing:0}
  .hd .sp{flex:1}
  .hd .url{font-size:12px;color:var(--mute)}
  .hd .url b{color:var(--accent-text);font-weight:500}
  .pill{font-size:10px;letter-spacing:.15em;color:var(--mute);display:flex;align-items:center;gap:8px;border:1px solid var(--line-2);border-radius:999px;padding:4px 9px 4px 5px;text-transform:uppercase}
  .pill i{width:22px;height:12px;border-radius:999px;background:var(--panel-2);border:1px solid var(--line-2);position:relative}
  .pill i::after{content:'';position:absolute;top:1px;${theme === 'dark' ? 'left:1px' : 'right:1px'};width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:var(--glow)}
  .wordmark{font:700 var(--wm,100px)/.9 'Chakra Petch',sans-serif;letter-spacing:-.01em;color:var(--accent);display:flex;margin:16px 0 20px}
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
  .scene{display:flex;flex-direction:column;align-items:center;gap:12px}
  ${SCREEN_CSS(theme, size)}`;
const heroParts = (t) => ({
  header: `<div class="top"></div>
<header class="hd">${logo('mk')}<p class="nm">Berk Beken<small>// feelgxxd</small></p><span class="sp"></span>
  <span class="url">berkbeken.<b>xo.je</b></span><span class="pill"><i></i>${t.name}</span></header>`,
  text: `<p class="eyebrow"><span class="led"></span>istanbul, tr · open to remote</p>
    <h1 class="wordmark">${'feelgxxd'.split('').map((c, i) => `<span style="animation-delay:${(-i * 0.4).toFixed(1)}s">${c}</span>`).join('')}</h1>
    <p class="aka"><span class="dim">a.k.a.</span> Berk Beken <span class="dim">/ </span><span class="role">game &amp; software developer</span><span class="caret"></span></p>
    <p class="intro">i build gameplay systems, engine tools and the web around them. this is the source. the tapes, logs and jokes live on the site.</p>`,
  proof: `<ul class="proof">${PROOF.map((p) => `<li><i>✓</i> ${esc(p)}</li>`).join('')}</ul>`,
  scene: `<figure class="scene">${screen()}<figcaption class="cap">rendered with <b>textel</b>. can't drag this one.</figcaption></figure>`,
});
const LABEL_HERO = 'feelgxxd, a.k.a. Berk Beken, game & software developer';
const hero = (t, theme) => {
  const p = heroParts(t);
  return svg(W, 506, [F.d600, F.d700, F.m400, F.m500], HERO_CSS(t, theme, 312) + `
  .body{display:grid;grid-template-columns:1fr 312px;gap:26px;padding:26px 24px 28px;align-items:center}`,
  `<div class="scan" style="position:absolute;inset:0;z-index:5;pointer-events:none"></div>${p.header}
<section class="body"><div>${p.text}${p.proof}</div>${p.scene}</section>`, t, LABEL_HERO);
};

// ================= LINK BUTTONS =================
// [id, label, solid, short label for phones]
const BUTTONS = [
  ['site', '▸ berkbeken.xo.je', true, 'site'],
  ['itch', 'itch.io', false, 'itch'],
  ['linkedin', 'linkedin', false, 'in'],
  ['mail', '✉ mail', false, 'mail'],
];
// phones get a narrow button with bigger text, so the label survives being scaled down
const button = (t, label, solid, w = 196, size = 13) => svg(w, 46, [F.m500], `
  .root{display:flex;align-items:flex-start;justify-content:center;padding-top:1px}
  .btn{display:flex;align-items:center;justify-content:center;gap:.6em;width:${w - 6}px;height:38px;border:1px solid ${solid ? 'var(--accent)' : 'var(--line-2)'};border-radius:4px;
    background:${solid ? 'var(--accent)' : 'var(--panel)'};color:${solid ? 'var(--accent-ink)' : 'var(--fg)'};font:500 ${size}px/1 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 3px 0 0 var(--line)}`,
  `<div class="btn">${esc(label)}</div>`, t, label);

// ================= SECTION HEAD =================
const secHead = (t, idx, title, link) => svg(W, 60, [F.d600, F.m500], `
  .root{display:flex;align-items:baseline;gap:16px;padding:18px 2px 0}
  .idx{color:var(--accent-text);font:500 13px 'IBM Plex Mono',monospace}
  h2{font:600 30px/1.1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em;white-space:nowrap}
  .rule{flex:1;height:1px;align-self:center;background:repeating-linear-gradient(to right,var(--line-2) 0 4px,transparent 4px 8px)}
  .lk{font-size:13px;color:var(--dim);text-decoration:underline;text-decoration-color:var(--line-2);text-underline-offset:3px;white-space:nowrap}`,
  `<span class="idx">${idx}</span><h2>${esc(title)}</h2><span class="rule"></span>${link ? `<span class="lk">${esc(link)} →</span>` : ''}`, t, `${idx} ${title}`);

// ================= TAPES (repos) =================
const TAPES = [
  { side: 'A', kind: 'tool', year: 2026, title: 'tiny renderer', repo: 'tiny-software-renderer', status: 'shipped', demo: true,
    desc: 'multithreaded, tile-based software rasterizer in c++17. no graphics api. pbr, shadow maps, up to 26× faster with simd.', stack: ['C++17', 'SIMD', 'WASM'] },
  { side: 'A', kind: 'tool', year: 2026, title: 'textel', repo: 'textel', status: 'shipped', demo: true,
    desc: 'turns 3d models into animated ascii art, in the terminal and on the web. a cli, a library and two web components.', stack: ['TypeScript', 'Node.js'] },
  { side: 'A', kind: 'sim', year: 2026, title: 'crowd dynamics', repo: 'emergent-crowd-dynamics',
    desc: 'real-time agent-based simulation of pressure, personal space and local order in collective movement.', stack: ['Python'] },
  { side: 'A', kind: 'sim', year: 2026, title: 'cave gen', repo: 'procedural-cave-generation',
    desc: 'a real-time cellular automata playground for game-ready caves, with tunable density, openness and connectivity.', stack: ['Python'] },
  { side: 'B', kind: 'game', year: 2026, title: '8a8atro', repo: '8a8atro',
    desc: 'a smaller demake of balatro, made in pico-8.', stack: ['PICO-8', 'Lua'] },
  { side: 'B', kind: 'game', year: 2025, title: 'crt invaders', repo: 'crt-invaders', status: 'shipped',
    desc: 'space invaders written from scratch in plain javascript, with a crt screen look.', stack: ['JavaScript', 'Canvas'] },
];
const reel = (cx, wound, delay) => `<g transform="translate(${cx} 78)">
  <circle r="${wound}" fill="#3a2c1e"/>
  <g class="spin" style="animation-delay:${delay}s"><circle r="11" fill="var(--panel-2)" stroke="var(--line-2)"/>
  ${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="-1.5" y="-11" width="3" height="5" fill="var(--line-2)" transform="rotate(${a})"/>`).join('')}
  <circle r="4" fill="#15130f"/></g></g>`;
const cassette = (tp, i) => {
  const wl = 12 + ((i * 5) % 8), wr = 19 - ((i * 5) % 8); // wound tape, kept inside the window
  return `<svg xmlns="http://www.w3.org/2000/svg" class="cas" viewBox="0 0 270 158">
  <rect x=".5" y=".5" width="269" height="157" rx="10" fill="var(--panel-2)" stroke="var(--line-2)"/>
  ${[[9, 9], [261, 9], [9, 149], [261, 149]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="var(--bg)" stroke="var(--line-2)"/>`).join('')}
  <rect x="18" y="14" width="234" height="104" rx="5" fill="var(--label)"/>
  <rect x="18" y="98" width="234" height="4" fill="#ffb000"/><rect x="18" y="102" width="234" height="4" fill="#ff6a1a"/><rect x="18" y="106" width="234" height="4" fill="#e5432d"/>
  <text x="28" y="38" font-family="Chakra Petch" font-weight="600" font-size="19" fill="var(--label-ink)" letter-spacing=".02em">${esc(tp.title.toUpperCase())}</text>
  <text x="243" y="37" text-anchor="end" font-family="Chakra Petch" font-weight="600" font-size="22" fill="#c2321d">${tp.side}</text>
  <rect x="70" y="56" width="130" height="44" rx="22" fill="#15130f" stroke="#3a342a"/>
  ${reel(100, wl, 0)}${reel(170, wr, -0.4)}
  <rect x="112" y="72" width="46" height="12" fill="#2a2119" opacity=".9"/>
  <path d="M62 158 L72 132 H198 L208 158" fill="var(--panel)" stroke="var(--line-2)"/>
  <circle cx="100" cy="146" r="4" fill="var(--bg)"/><circle cx="170" cy="146" r="4" fill="var(--bg)"/>
  <text x="28" y="52" font-family="IBM Plex Mono" font-size="9.5" fill="#574f42" letter-spacing=".1em">${esc(tp.stack.join(' // ').toUpperCase())}</text>
</svg>`;
};
const TW = 300, TH = 378;
const tape = (t, tp, i) => svg(TW, TH, [F.d600, F.m400, F.m500], `
  .root{padding:0 5px 8px}
  .card{height:100%;display:flex;flex-direction:column;gap:10px;padding:12px 12px 16px;background:var(--panel);border:1px solid var(--line);border-radius:6px;position:relative;overflow:hidden}
  .hd{display:flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
  .hd b{color:var(--accent-text);font-weight:500}
  .hd .sp{flex:1}
  .cas{width:100%;height:auto;display:block;flex:none}
  .spin{animation:spin ${tp.status === 'shipped' ? 3.2 : 4.4}s linear infinite}
  @keyframes spin{to{transform:rotate(-360deg)}}
  .repo{font-size:12px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .repo span{color:var(--mute)}
  .txt{color:var(--dim);font-size:12px;line-height:1.55}
  .ft{margin-top:auto;display:flex;gap:6px;flex-wrap:wrap}`,
  `<article class="card scan">
  <header class="hd"><b>${tp.side}-${String(i + 1).padStart(2, '0')}</b><span>${tp.kind}</span><span class="sp"></span><span>${tp.year}</span></header>
  ${cassette(tp, i)}
  <p class="repo"><span>feelgxxd/</span>${esc(tp.repo)}</p>
  <p class="txt">${esc(tp.desc)}</p>
  <p class="ft">${tp.status && !tp.demo ? `<span class="tag ${tp.status === 'shipped' ? 'acc' : 'live'}">${tp.status}</span>` : ''}${tp.demo ? '<span class="tag live">● live demo</span>' : ''}${tp.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</p>
  <span class="stripe"></span>
</article>`, t, `${tp.title}: ${tp.desc}`);

// ================= ELSEWHERE (games that are not on github) =================
const ELSEWHERE = [
  { id: 'idle-of-carbon-city', title: 'idle of carbon city', kind: 'mobile', status: 'shipped', cover: 'idle', cta: '▸ google play',
    url: 'https://play.google.com/store/apps/details?id=com.LugalGames.IdleOfCarbonCity',
    desc: 'a mobile idle game from my time at lugal games. 1,000+ downloads on google play.', stack: ['Unity', 'C#'] },
  { title: 'claylings', kind: 'game', status: 'shipped', cover: 'claylings', cta: '▸ play on itch.io', url: 'https://berkbeken.itch.io/claylings',
    desc: 'herd the claylings to safety with your cursor. touch one and it explodes.', stack: ['PICO-8'] },
  { title: 'cinerace', kind: 'web game', status: 'live', cover: 'cinerace', cta: '▸ play daily', url: 'https://cinerace.vercel.app',
    desc: 'a movie connection game. hop from film to film through the people who made them.', stack: ['Next.js', 'TS'] },
];
const EW = 300, EH = 318;
const elsewhere = (t, g) => svg(EW, EH, [F.d600, F.m400, F.m500], `
  .root{padding:0 5px 8px}
  .card{height:100%;display:flex;flex-direction:column;gap:9px;padding:10px 10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:6px;position:relative;overflow:hidden}
  .cv{position:relative;height:146px;border-radius:4px;overflow:hidden;border:1px solid var(--line);background:#000 url(data:image/jpeg;base64,${readFileSync(here(`covers/${g.cover}.jpg`)).toString('base64')}) center/cover;image-rendering:${g.cover === 'claylings' ? 'pixelated' : 'auto'}}
  .cv::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgb(0 0 0 / .14) 0 1px,transparent 1px 3px)}
  .cv .tag{position:absolute;top:8px;right:8px;background:rgb(15 14 12 / .85);z-index:1}
  .row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:0 2px}
  h3{font:600 20px/1.1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em}
  .k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
  .txt{color:var(--dim);font-size:12px;line-height:1.55;padding:0 2px}
  .cta{margin-top:auto;padding:0 2px;font:500 11.5px/1 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-text);display:flex;justify-content:space-between}
  .cta span{color:var(--mute);letter-spacing:.04em;text-transform:none}`,
  `<article class="card">
  <div class="cv"><span class="tag ${g.status === 'wip' ? 'acc' : 'live'}">${g.status}</span></div>
  <div class="row"><h3>${esc(g.title)}</h3><span class="k">${esc(g.kind)}</span></div>
  <p class="txt">${esc(g.desc)}</p>
  <p class="cta">${esc(g.cta)}<span>${esc(g.stack.join(' · '))}</span></p>
  <span class="stripe"></span>
</article>`, t, `${g.title}: ${g.desc}`);

// ================= FOOTER: status bar + tape =================
const digit = (n, period) => `<span class="dg"><span style="animation:roll${n} ${period}s steps(${n}) infinite">${Array.from({ length: n }, (_, i) => i).join('<br/>')}</span></span>`;
const footer = (t) => {
  const run = Array.from({ length: 2 }, () => `<span class="txt">sh*t that i have to deal with on a daily basis</span><span class="sep">◂◂</span><span class="txt ghost">sh*t that i have to deal with on a daily basis</span><span class="sep">●</span>`).join('');
  return svg(W, 46, [F.d700, F.m400, F.m500], `
  .root{display:flex;align-items:stretch;background:var(--bg-2);border:1px solid var(--line);border-radius:6px;font-size:12px;letter-spacing:.03em;color:var(--dim)}
  :where(.root>*:not(style)){display:flex;align-items:center;padding:0 12px;border-right:1px solid var(--line);white-space:nowrap;flex:none}
  .rec{gap:6px;color:var(--red-text);font-weight:500;background:var(--panel);border-radius:6px 0 0 6px}
  .rec i{width:7px;height:7px;border-radius:50%;background:var(--red);animation:blink 1.6s steps(1) infinite}
  .u{color:var(--ok)}.p{color:var(--accent-text)}
  .tk{flex:1;position:relative;overflow:hidden;padding:0;
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
  .tk::before,.tk::after{content:'';position:absolute;left:0;right:0;height:2px;opacity:.5;background:repeating-linear-gradient(90deg,var(--accent) 0 14px,var(--orange) 14px 28px,var(--red) 28px 42px,transparent 42px 56px)}
  .tk::before{top:4px}.tk::after{bottom:4px}
  .track{position:absolute;top:0;bottom:0;left:0;display:flex;align-items:center;width:max-content;animation:tape 40s linear infinite}
  .run{display:flex;align-items:center;flex-shrink:0}
  .txt{font:700 17px/1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.03em;color:var(--accent-text);text-shadow:var(--glow)}
  .ghost{color:transparent;-webkit-text-stroke:1px var(--line-2);text-shadow:none}
  .sep{margin:0 18px;font-size:11px;color:var(--mute)}
  @keyframes tape{to{transform:translateX(-50%)}}
  .tape{color:var(--accent-text);border-right:0;font-variant-numeric:tabular-nums;gap:.5em}
  .tape .l{color:var(--dim)}
  .dg{display:inline-block;height:1.3em;line-height:1.3em;overflow:hidden;vertical-align:middle}
  .dg>span{display:block}
  @keyframes roll10{to{transform:translateY(-13em)}}
  @keyframes roll6{to{transform:translateY(-7.8em)}}`,
  `<span class="rec"><i></i>REC</span>
<span><span class="u">feelgxxd@gh</span>:<span class="p">~</span>$<span class="caret"></span></span>
<span class="tk"><span class="track"><span class="run">${run}</span><span class="run">${run}</span></span></span>
<span class="tape"><span class="l">TAPE</span><span>00${digit(10, 6000)}:${digit(6, 600)}${digit(10, 100)}</span></span>`, t, 'sh*t that i have to deal with on a daily basis');
};

// ================= NOW PLAYING: what is on the deck right now =================
// Edit NOW when the focus changes. The "latest" line follows tools/logs.json by itself.
const LOGS = JSON.parse(readFileSync(here('logs.json'), 'utf8'));
const NOW = {
  title: 'knightfall', desc: 'roguelike deckbuilder. your deck is a chess army.',
  version: '0.2', target: '1.0', progress: 0.2, cover: 'knightfall', stack: ['LÖVE2D', 'Lua'],
  url: 'https://berkbeken.itch.io/knightfall', cta: '▸ play the demo', logs: /^knightfall/i,
};
const nowPlaying = (t) => {
  const last = LOGS.find((p) => NOW.logs.test(p.title));
  return svg(W, 128, [F.d700, F.m400, F.m500], `
  .root{display:grid;grid-template-columns:160px 1fr 190px;gap:22px;align-items:center;padding:12px 22px 12px 12px;background:var(--panel);border:1px solid var(--line);border-radius:8px}
  .cv{position:relative;height:102px;border-radius:5px;overflow:hidden;border:1px solid var(--line);background:#000 url(data:image/jpeg;base64,${readFileSync(here(`covers/${NOW.cover}.jpg`)).toString('base64')}) center/cover}
  .cv::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgb(0 0 0 / .16) 0 1px,transparent 1px 3px)}
  .cv i{position:absolute;left:50%;top:50%;width:0;height:0;margin:-11px 0 0 -7px;border-style:solid;border-width:11px 0 11px 18px;border-color:transparent transparent transparent rgb(255 255 255 / .9);filter:drop-shadow(0 1px 4px rgb(0 0 0 / .6));z-index:1}
  .mid{display:flex;flex-direction:column;gap:6px;min-width:0}
  .eb{display:flex;align-items:center;gap:10px;font:500 10.5px/1 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
  .eb b{color:var(--accent-text);font-weight:500}
  .vu{display:flex;align-items:flex-end;gap:2px;height:12px}
  .vu i{width:3px;background:var(--accent);transform-origin:bottom;animation:vu 1.1s ease-in-out infinite alternate}
  @keyframes vu{to{transform:scaleY(.3)}}
  h2{font:700 30px/1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em}
  .ds{font-size:12.5px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lg{font-size:11.5px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lg span{color:var(--fg)}
  .rt{display:flex;flex-direction:column;gap:9px}
  .vr{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.1em;color:var(--mute);text-transform:uppercase}
  .vr b{color:var(--accent-text);font-weight:500}
  .bar{position:relative;height:8px;border-radius:4px;background:var(--bg-2);border:1px solid var(--line)}
  .bar .f{position:absolute;left:0;top:0;bottom:0;width:${NOW.progress * 100}%;border-radius:4px 0 0 4px;background:var(--accent);box-shadow:var(--glow)}
  .bar .h{position:absolute;top:-4px;left:calc(${NOW.progress * 100}% - 1px);width:2px;height:14px;background:var(--fg);animation:blink 1.1s steps(1) infinite}
  .cta{font:500 12px/1 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-text);display:flex;justify-content:space-between}
  .st{font-size:11px;color:var(--mute);letter-spacing:.03em}`,
  `<div class="cv"><i></i></div>
<div class="mid">
  <p class="eb"><span class="led"></span><b>now playing</b><span class="vu">${[[40, -0.2], [90, -0.5], [60, -0.1], [100, -0.7], [35, -0.3]].map(([h, d]) => `<i style="height:${h}%;animation-delay:${d}s"></i>`).join('')}</span></p>
  <h2>${esc(NOW.title)}</h2>
  <p class="ds">${esc(NOW.desc)}</p>
  ${last ? `<p class="lg">latest log · <span>${esc(last.title.toLowerCase().replace(NOW.logs, '').replace(/^\s*-\s*/, ''))}</span> · ${last.date}</p>` : ''}
</div>
<div class="rt">
  <p class="vr"><span>update <b>${NOW.version}</b></span><span>→ ${NOW.target}</span></p>
  <div class="bar"><span class="f"></span><span class="h"></span></div>
  <p class="cta">${esc(NOW.cta)}</p><p class="st">${esc(NOW.stack.join(' · '))}</p>
</div>`, t, `now playing: ${NOW.title}`);
};

// ================= SIGNAL: the contribution calendar as a tape deck level meter =================
// One series (contributions per week), one hue; lit segments = level, so it reads like a VU meter.
const CONTRIB = (() => { try { return JSON.parse(readFileSync(here('contrib.json'), 'utf8')); } catch { return { total: 0, days: [] }; } })();
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const SIG = (() => {
  const weeks = [];
  CONTRIB.days.forEach((d, i) => { if (i % 7 === 0) weeks.push({ start: d.date, count: 0 }); weeks.at(-1).count += d.count; });
  let streak = 0, best = 0;
  for (const d of CONTRIB.days) { streak = d.count ? streak + 1 : 0; best = Math.max(best, streak); }
  const active = CONTRIB.days.filter((d) => d.count).length;
  const peak = weeks.reduce((m, w) => (w.count > m.count ? w : m), { count: 0 });
  const byMonth = new Map();
  for (const d of CONTRIB.days) { const k = d.date.slice(0, 7); byMonth.set(k, (byMonth.get(k) ?? 0) + d.count); }
  const months = [...byMonth].map(([k, n]) => [`${MONTHS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`, n]);
  const total = CONTRIB.total;
  const alt = `contributions over the last year as a level meter: ${total} in total, ${active} active days, best week ${peak.count}${peak.start ? ` (week of ${peak.start})` : ''}, longest streak ${best} days.`;
  return { weeks, streak: best, active, peak, months, total, alt };
})();
const SEGS = 12;
const signal = (t, theme) => {
  const bar = theme === 'dark' ? '#ffb000' : '#c26a00';
  const max = Math.max(1, SIG.peak.count);
  const cols = SIG.weeks.map((w, i) => {
    const lit = w.count ? Math.max(1, Math.round((w.count / max) * SEGS)) : 0;
    const m = new Date(`${w.start}T00:00:00Z`);
    const label = i === 0 || m.getUTCDate() <= 7 ? MONTHS[m.getUTCMonth()] : '';
    const isPeak = w === SIG.peak;
    return `<div class="c" style="animation-delay:${(i * 18)}ms">${isPeak ? `<b class="pk">${w.count}</b>` : ''}<div class="s">${Array.from({ length: SEGS }, (_, k) => `<i${k < lit ? ' class="on"' : ''}></i>`).join('')}</div><span class="m">${label}</span></div>`;
  }).join('');
  const ro = [['contributions', SIG.total], ['active days', SIG.active], ['best week', SIG.peak.count], ['longest streak', `${SIG.streak}d`]];
  return svg(W, 236, [F.d600, F.m400, F.m500], `
  .root{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 18px 10px;display:flex;flex-direction:column;gap:14px}
  .hd{display:flex;align-items:stretch;border:1px solid var(--line);border-radius:5px;background:var(--bg-2)}
  .ro{flex:1;padding:8px 14px;display:flex;flex-direction:column;gap:4px;border-right:1px solid var(--line)}
  .ro:last-child{border-right:0}
  .ro span{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--mute)}
  .ro b{font:600 22px/1 'Chakra Petch',sans-serif;color:var(--fg);font-variant-numeric:tabular-nums}
  .ch{position:relative;display:flex;justify-content:space-between;align-items:flex-end;height:118px;padding-top:16px}
  .c{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;transform-origin:bottom;animation:rise .5s cubic-bezier(.2,.7,.2,1) both}
  @keyframes rise{from{transform:scaleY(0)}}
  .s{display:flex;flex-direction:column-reverse;gap:2px}
  .s i{display:block;width:10px;height:5px;border-radius:1px;background:var(--line)}
  .s i.on{background:${bar};box-shadow:${theme === 'dark' ? '0 0 4px rgb(255 176 0 / .45)' : 'none'}}
  .pk{position:absolute;top:-16px;font:500 10px/1 'IBM Plex Mono',monospace;color:var(--fg)}
  .m{height:10px;font-size:9px;line-height:10px;color:var(--mute);letter-spacing:.04em;white-space:nowrap;width:10px;text-align:left;overflow:visible}
  .ph{position:absolute;top:10px;bottom:16px;left:0;width:1px;background:var(--accent-text);opacity:.35;animation:sweep 14s linear infinite}
  @keyframes sweep{to{left:100%}}`,
  `<div class="hd">${ro.map(([k, v]) => `<p class="ro"><span>${k}</span><b>${v}</b></p>`).join('')}</div>
<div class="ch">${cols}<span class="ph"></span></div>`, t, SIG.alt);
};

// ================= REPO BANNERS + SOCIAL PREVIEWS =================
// Banner: top of each showcased repo's README (both themes, served from this repo).
// Social: the 1280x640 link-preview card, uploaded by hand in each repo's settings.
const tapeId = (tp, i) => `${tp.side}-${String(i + 1).padStart(2, '0')}`;
const TAPE_TEXT_CSS = `
  .mk{color:var(--fg);flex:none}
  .eb{font:500 11px/1.5 'IBM Plex Mono',monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:.6em}
  .eb b{color:var(--accent-text);font-weight:500}
  .ti{font:700 var(--ts)/1 'Chakra Petch',sans-serif;text-transform:uppercase;letter-spacing:.01em;color:var(--fg)}
  .ds{color:var(--dim);line-height:1.6}
  .tg{display:flex;gap:6px;flex-wrap:wrap}
  .spin{animation:spin 3.6s linear infinite}
  @keyframes spin{to{transform:rotate(-360deg)}}
  .cas{display:block;width:100%;height:auto}`;
const tapeText = (tp, i) => `<p class="eb"><span class="led"></span><b>${tapeId(tp, i)}</b> · ${tp.kind} · ${tp.year}</p>
    <h1 class="ti">${esc(tp.title)}</h1>
    <p class="ds">${esc(tp.desc)}</p>
    <p class="tg">${tp.demo ? '<span class="tag live">● live demo</span>' : tp.status ? `<span class="tag acc">${tp.status}</span>` : ''}${tp.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</p>`;
const banner = (t, tp, i) => svg(W, 236, [F.d600, F.d700, F.m400, F.m500], TAPE_TEXT_CSS + `
  .root{background:var(--bg);border:1px solid var(--line);border-radius:10px}
  .top{height:3px;background:var(--orange)}
  .body{display:grid;grid-template-columns:290px 1fr;gap:28px;padding:20px 26px 0;align-items:center;--ts:44px}
  .txt{display:flex;flex-direction:column;gap:10px;min-width:0}
  .ds{font-size:13px;max-width:52ch}
  .brand{position:absolute;top:16px;right:20px;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--mute);z-index:6}
  .brand .mk{width:36px;height:21px}`,
  `<div class="scan" style="position:absolute;inset:0;z-index:5;pointer-events:none"></div>
<div class="top"></div>
<span class="brand">${logo('mk')}feelgxxd</span>
<section class="body">${cassette(tp, i)}<div class="txt">${tapeText(tp, i)}</div></section>
<span class="stripe"></span>`, t, `${tp.title}: ${tp.desc}`);
// drawn at 830x415 and scaled to 1280x640 when it is rasterized
const social = (t, tp, i) => svg(W, 415, [F.d600, F.d700, F.m400, F.m500], TAPE_TEXT_CSS + `
  .root{background:var(--bg);display:flex;flex-direction:column}
  .fr{position:absolute;inset:18px;border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;overflow:hidden}
  .hd{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--line)}
  .hd .mk{width:50px;height:29px}
  .hd p{font:600 15px/1.1 'Chakra Petch',sans-serif;letter-spacing:.04em;text-transform:uppercase}
  .hd small{display:block;font:400 11px/1.3 'IBM Plex Mono',monospace;color:var(--dim);text-transform:none;letter-spacing:0}
  .body{flex:1;display:grid;grid-template-columns:300px 1fr;gap:30px;padding:0 26px;align-items:center;--ts:48px}
  .txt{display:flex;flex-direction:column;gap:12px;min-width:0}
  .ds{font-size:13.5px}
  .bar{display:flex;align-items:center;gap:12px;padding:12px 22px;border-top:1px solid var(--line);background:var(--bg-2);font-size:12.5px;color:var(--mute)}
  .bar b{color:var(--accent-text);font-weight:400}
  .bar .r{margin-left:auto}
  .fr .stripe{height:3px}`,
  `<div class="scan" style="position:absolute;inset:0;z-index:5;pointer-events:none"></div>
<div class="fr">
  <header class="hd">${logo('mk')}<p>Berk Beken<small>// feelgxxd</small></p></header>
  <section class="body">${cassette(tp, i)}<div class="txt">${tapeText(tp, i)}</div></section>
  <footer class="bar"><span class="led"></span><span><b>github.com/feelgxxd</b>/${esc(tp.repo)}</span><span class="r">berkbeken.xo.je</span></footer>
  <span class="stripe"></span>
</div>`, t, `${tp.title}: ${tp.desc}`);

// ================= write assets =================
mkdirSync(new URL('banners/', ASSETS), { recursive: true });
// social previews are only rebuilt on request: node tools/build.mjs --social && node tools/social.mjs
if (process.argv.includes('--social')) {
  const SOCIAL = new URL('../social/', import.meta.url);
  mkdirSync(SOCIAL, { recursive: true });
  TAPES.forEach((tp, i) => writeFileSync(new URL(`${tp.repo}.svg`, SOCIAL), social(THEMES.dark, tp, i).replace(/width="830" height="415"/, 'width="1280" height="640"')));
}
const files = [];
const put = (name, s) => { writeFileSync(new URL(name, ASSETS), s); files.push([name, s.length]); };
for (const [theme, t] of Object.entries(THEMES)) {
  put(`hero-${theme}.svg`, hero(t, theme));
  BUTTONS.forEach(([id, label, solid, short]) => {
    put(`btn-${id}-${theme}.svg`, button(t, label, solid));
    put(`btn-${id}-mobile-${theme}.svg`, button(t, short, solid, 100, 16));
  });
  put(`sec-tapes-${theme}.svg`, secHead(t, '01', 'selected tapes', 'all repos'));
  put(`sec-elsewhere-${theme}.svg`, secHead(t, '02', 'off github', 'itch.io'));
  put(`sec-logs-${theme}.svg`, secHead(t, '03', 'latest logs', 'all logs'));
  TAPES.forEach((tp, i) => {
    put(`tape-${tp.repo}-${theme}.svg`, tape(t, tp, i));
    put(`banners/${tp.repo}-${theme}.svg`, banner(t, tp, i));
  });
  ELSEWHERE.forEach((g) => put(`game-${g.id ?? g.title}-${theme}.svg`, elsewhere(t, g)));
  put(`now-playing-${theme}.svg`, nowPlaying(t));
  put(`sec-signal-${theme}.svg`, secHead(t, '04', 'signal', 'full history'));
  put(`signal-${theme}.svg`, signal(t, theme));
  put(`footer-${theme}.svg`, footer(t));
}

// ================= README.md =================
// <picture> picks the theme; the hero also picks a one-column layout on narrow screens.
const pic = (name, alt, width, mobile) => {
  const src = (n, th) => `assets/${n}-${th}.svg`;
  const m = mobile ? `<source media="(max-width: 600px) and (prefers-color-scheme: dark)" srcset="${src(mobile, 'dark')}"><source media="(max-width: 600px)" srcset="${src(mobile, 'light')}">` : '';
  return `<picture>${m}<source media="(prefers-color-scheme: dark)" srcset="${src(name, 'dark')}"><source media="(prefers-color-scheme: light)" srcset="${src(name, 'light')}"><img alt="${esc(alt)}" src="${src(name, 'dark')}" width="${width}"></picture>`;
};
const a = (href, inner) => `<a href="${href}">${inner}</a>`;
const readme = `<!-- generated by tools/build.mjs. edit that, not this. -->
${a(SITE, pic('hero', LABEL_HERO, '100%'))}

<p>${BUTTONS.map(([id, label]) => a(LINKS[id], pic(`btn-${id}`, label.replace(/^\W+/, ''), '24%', `btn-${id}-mobile`))).join('&nbsp;')}</p>

${a(NOW.url, pic('now-playing', `now playing: ${NOW.title}, ${NOW.desc}`, '100%'))}

${a(`${GH}?tab=repositories`, pic('sec-tapes', '01 selected tapes', '100%'))}

<p align="center">${TAPES.slice(0, 3).map((tp) => a(`${GH}/${tp.repo}`, pic(`tape-${tp.repo}`, `${tp.title}: ${tp.desc}`, '33%'))).join('')}</p>
<p align="center">${TAPES.slice(3).map((tp) => a(`${GH}/${tp.repo}`, pic(`tape-${tp.repo}`, `${tp.title}: ${tp.desc}`, '33%'))).join('')}</p>

${a(LINKS.itch, pic('sec-elsewhere', '02 off github', '100%'))}

<p align="center">${ELSEWHERE.map((g) => a(g.url, pic(`game-${g.id ?? g.title}`, `${g.title}: ${g.desc}`, '33%'))).join('')}</p>

${a(`${SITE}/blog/`, pic('sec-logs', '03 latest logs', '100%'))}

${LOGS.map((p) => `- \`${p.date}\` &nbsp;[${p.title.toLowerCase()}](${SITE}/blog/${p.id}/)`).join('\n')}

${a(GH, pic('sec-signal', '04 signal', '100%'))}

${pic('signal', SIG.alt, '100%')}

<details><summary><sub>signal, month by month</sub></summary>

| month | contributions |
|:--|--:|
${SIG.months.map(([m, n]) => `| ${m} | ${n} |`).join('\n')}
| **last year** | **${SIG.total}** |

</details>

<br>

${a(SITE, pic('footer', 'sh*t that i have to deal with on a daily basis', '100%'))}
`;
writeFileSync(new URL('../README.md', import.meta.url), readme);

let total = 0;
for (const [n, b] of files) { total += b; if (n.endsWith('-dark.svg')) console.log(`${(b / 1024).toFixed(0).padStart(5)} KB  ${n}`); }
console.log(`${(total / 1024).toFixed(0).padStart(5)} KB  total (${files.length} files)`);
