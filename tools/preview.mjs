// Local preview: renders README.md roughly the way GitHub's profile column does, per theme and width.
// usage: node tools/preview.mjs   -> preview/*.html (open in a browser)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const md = readFileSync(new URL('../README.md', import.meta.url), 'utf8').replace(/<!--.*?-->\n?/g, '');
const outDir = new URL('../preview/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const inline = (s) => s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

for (const [theme, bg, box, fg, link, codeBg] of [['dark', '#0d1117', '#30363d', '#e6edf3', '#4493f8', '#656c7633'], ['light', '#ffffff', '#d1d9e0', '#1f2328', '#0969da', '#818b981f']]) {
  for (const [name, w] of [['desk', 880], ['mob', 390]]) {
    let body = md.replace(/<source[^>]*>/g, '').replace(/src="assets\/([a-z0-9-]+)-dark\.svg"/g, `src="../assets/$1-${theme}.svg"`);
    if (name === 'mob') body = body.replace(/assets\/(hero|btn-[a-z]+)-(dark|light)\.svg/g, 'assets/$1-mobile-$2.svg');
    body = body.split(/\n\s*\n/).map((b) => {
      if (b.startsWith('- ')) return `<ul>${b.split('\n').map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
      return b.startsWith('<p') || b.startsWith('<br') ? b : `<p>${b}</p>`;
    }).join('\n');
    writeFileSync(new URL(`preview-${theme}-${name}.html`, outDir), `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:${bg};color:${fg};font:16px/1.5 -apple-system,'Segoe UI',sans-serif;padding:24px}
.box{width:${w}px;border:1px solid ${box};border-radius:6px;padding:${name === 'mob' ? 16 : 24}px;margin:auto;box-sizing:border-box}
.box p,.box ul{margin:0 0 16px} img{max-width:100%;vertical-align:middle;border-style:none} a{color:${link};text-decoration:none}
ul{padding-left:2em} code{font:85% ui-monospace,Consolas,monospace;background:${codeBg};padding:.2em .4em;border-radius:6px}
.h{font:12px ui-monospace,monospace;margin-bottom:16px}</style>
<div class="box"><div class="h">feelgxxd / README.md</div>${body}</div>`);
  }
}
console.log('preview/ written');
