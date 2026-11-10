// Renders a spinning ASCII donut (donut.c math) into frames for the hero screen.
// Same 112x56 grid and luminance ramp as the site's AsciiScene. Loops seamlessly:
// A turns twice and B once over the loop.
// usage: node tools/donut-frames.mjs [frames]
import { writeFileSync } from 'node:fs';

const W = 112, H = 56, N = Number(process.argv[2]) || 96;
const RAMP = '.,-~:;=!*#$@';
const R1 = 1, R2 = 2, K2 = 6, K1 = 56;
const ASPECT = 1.47; // glyphs are ~1.47x taller than wide at the site's font settings

const frames = [];
for (let f = 0; f < N; f++) {
  const A = (f / N) * Math.PI * 4, B = (f / N) * Math.PI * 2;
  const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
  const out = new Array(W * H).fill(' '), zb = new Float32Array(W * H);
  for (let t = 0; t < Math.PI * 2; t += 0.03) {
    const ct = Math.cos(t), st = Math.sin(t);
    for (let p = 0; p < Math.PI * 2; p += 0.008) {
      const cp = Math.cos(p), sp = Math.sin(p);
      const cx = R2 + R1 * ct, cy = R1 * st;
      const x = cx * (cB * cp + sA * sB * sp) - cy * cA * sB;
      const y = cx * (sB * cp - sA * cB * sp) + cy * cA * cB;
      const z = K2 + cA * cx * sp + cy * sA, ooz = 1 / z;
      const xp = (W / 2 + K1 * ooz * x) | 0, yp = (H / 2 - (K1 / ASPECT) * ooz * y) | 0;
      if (xp < 0 || xp >= W || yp < 0 || yp >= H) continue;
      const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);
      const i = xp + yp * W;
      if (L > 0 && ooz > zb[i]) { zb[i] = ooz; out[i] = RAMP[Math.min(11, (L * 8) | 0)]; }
    }
  }
  const rows = [];
  for (let y = 0; y < H; y++) rows.push([out.slice(y * W, y * W + W).join(''), '0'.repeat(W)]);
  frames.push(rows);
}
writeFileSync(new URL('./donut-frames.json', import.meta.url), JSON.stringify({ W, H, frames }));
console.log(`wrote ${N} frames`);
