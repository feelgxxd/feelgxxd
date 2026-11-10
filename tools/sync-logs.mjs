// Reads the site's blog posts and writes the newest ones to tools/logs.json.
// usage: node tools/sync-logs.mjs <path-to-site> [count]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , site, nArg] = process.argv;
const dir = join(site, 'src/content/blog');
const posts = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
  const fm = readFileSync(join(dir, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1].trim().replace(/^"(.*)"$/, '$1');
  return { id: f.replace(/\.md$/, ''), title: get('title'), date: get('date')?.slice(0, 10), draft: get('draft') === 'true' };
}).filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date)).slice(0, Number(nArg) || 5);
writeFileSync(new URL('./logs.json', import.meta.url), JSON.stringify(posts, null, 2) + '\n');
console.log(posts.map((p) => `${p.date}  ${p.title}`).join('\n'));
