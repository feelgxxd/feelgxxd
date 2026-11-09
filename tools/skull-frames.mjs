// One-shot: renders the site's 3D ASCII skull at N angles and saves the frames.
// Same projection and shading as the site's AsciiScene.astro.
// usage: node tools/skull-frames.mjs <path-to-site>/src/lib/ascii-meshes.ts [frames]
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [, , meshPath, nArg] = process.argv;
const { MESH_DEFS } = await import(pathToFileURL(meshPath).href);
const def = MESH_DEFS.find((d) => d.name === 'SKULL');
const gen = def.build();
let r;
do r = gen.next(); while (!r.done);
const pts = r.value, scale = def.scale;

const W = 112, H = 56, HARD = ' .:-=+*#%@', N = Number(nArg) || 60;
const frames = [];
for (let f = 0; f < N; f++) {
  const ax = def.tilt, ay = (f / N) * Math.PI * 2;
  const zb = new Float32Array(W * H), buf = new Array(W * H).fill(' '), mat = new Uint8Array(W * H);
  const ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay);
  const SX = 0.9 * W, SY = 1.233 * H, Z0 = 8;
  for (const [x0, y0, z0, nx0, ny0, nz0, hole] of pts) {
    const y1 = y0 * ca - z0 * sa, z1 = y0 * sa + z0 * ca;
    const x2 = x0 * cb + z1 * sb, z2 = -x0 * sb + z1 * cb;
    const ny1 = ny0 * ca - nz0 * sa, nz1 = ny0 * sa + nz0 * ca;
    const nx2 = nx0 * cb + nz1 * sb, nz2 = -nx0 * sb + nz1 * cb;
    const ooz = 1 / (z2 + Z0);
    const px = (W / 2 + SX * scale * x2 * ooz) | 0, py = (H / 2 - SY * scale * y1 * ooz) | 0;
    if (px < 0 || px >= W || py < 0 || py >= H) continue;
    const i = px + py * W;
    if (ooz > zb[i]) {
      zb[i] = ooz;
      const sk = hole !== 4;
      const lum = sk ? nx2 * -0.3 + ny1 * 0.35 + nz2 * -0.88 : nx2 * -0.45 + ny1 * 0.6 + nz2 * -0.65;
      mat[i] = hole ?? 0;
      buf[i] = hole === 1 ? ' ' : sk ? (lum > 0 ? HARD[Math.min(9, (lum * 10) | 0)] : ' ') : lum > 0 ? '.,-~:;=!*#$@'[Math.min(11, (lum * 12) | 0)] : '.';
    }
  }
  // rows of [text, swordMask] — sword chars are drawn dimmer
  const rows = [];
  for (let y = 0; y < H; y++) {
    let t = '', m = '';
    for (let x = 0; x < W; x++) { t += buf[y * W + x]; m += mat[y * W + x] === 4 ? '1' : '0'; }
    rows.push([t, m]);
  }
  frames.push(rows);
}
writeFileSync(new URL('./skull-frames.json', import.meta.url), JSON.stringify({ W, H, frames }));
console.log(`wrote ${N} frames`);
