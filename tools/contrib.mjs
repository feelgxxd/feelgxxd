// Reads the public contribution calendar (no token needed) and writes tools/contrib.json.
// usage: node tools/contrib.mjs [user]
import { writeFileSync } from 'node:fs';

const user = process.argv[2] || 'feelgxxd';
const res = await fetch(`https://github.com/users/${user}/contributions`, { headers: { 'user-agent': 'profile-readme-build' } });
if (!res.ok) throw new Error(`contributions page: HTTP ${res.status}`);
const html = await res.text();

// each day is a <td id=... data-date=...>; its count lives in the <tool-tip for=id> next to it
const dates = new Map();
for (const m of html.matchAll(/<td\b[^>]*>/g)) {
  const id = m[0].match(/\bid="([^"]+)"/)?.[1], date = m[0].match(/data-date="([^"]+)"/)?.[1];
  if (id && date) dates.set(id, date);
}
const days = [];
for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)/g)) {
  const date = dates.get(m[1]);
  if (!date) continue;
  const n = m[2].match(/^\s*(\d[\d,]*) contribution/);
  days.push({ date, count: n ? Number(n[1].replace(/,/g, '')) : 0 });
}
if (days.length < 300) throw new Error(`only found ${days.length} days, the page layout may have changed`);
days.sort((a, b) => a.date.localeCompare(b.date));
const total = days.reduce((s, d) => s + d.count, 0);
writeFileSync(new URL('./contrib.json', import.meta.url), JSON.stringify({ user, total, days }) + '\n');
console.log(`${days.length} days, ${total} contributions, ${days[0].date} .. ${days.at(-1).date}`);
