// Rasterizes social/*.svg (written by build.mjs) into 1280x640 PNGs with headless Edge or Chrome.
// Upload each PNG in its repo: Settings -> General -> Social preview.
// usage: node tools/build.mjs --social && node tools/social.mjs
import { readdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BROWSER = process.env.BROWSER ?? [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find((p) => existsSync(p));
if (!BROWSER) throw new Error('no Edge/Chrome found, set BROWSER=');

const dir = fileURLToPath(new URL('../social/', import.meta.url));
for (const f of readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
  const png = dir + f.replace(/\.svg$/, '.png');
  execFileSync(BROWSER, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,640',
    '--virtual-time-budget=2000', `--screenshot=${png}`, pathToFileURL(dir + f).href], { stdio: 'ignore' });
  rmSync(dir + f);
  console.log('wrote', png);
}
