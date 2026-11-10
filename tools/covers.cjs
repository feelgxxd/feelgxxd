// One-shot: crops the site's screenshots into small card covers (tools/covers/*.jpg).
// usage: NODE_PATH=<site>/node_modules node tools/covers.cjs <site>
const sharp = require('sharp');
const site = process.argv[2];
const src = {
  knightfall: 'public/media/projects/knightfall/03_combo.webp',
  claylings: 'public/media/2025/09/GIF-13-09-2025-00-54-28-still.webp',
  cinerace: 'screenshots_for_projects/web/cinerace.png',
};
(async () => {
  for (const [k, p] of Object.entries(src)) {
    const info = await sharp(`${site}/${p}`).resize(560, 300, { fit: 'cover', position: 'centre', kernel: k === 'claylings' ? 'nearest' : 'lanczos3' }).jpeg({ quality: 74, mozjpeg: true }).toFile(`${__dirname}/covers/${k}.jpg`);
    console.log(k, info.size);
  }
})();
