const sharp = require('sharp');

const src = 'public/source.jpg';

const crops = {
  bert: { left: 140, top: 170, width: 430, height: 430 },
  btk: { left: 760, top: 190, width: 360, height: 360 },
};

const blue = [37, 99, 235];
const red = [239, 68, 68];

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function isLogoPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  const greenish = h >= 70 && h <= 170 && s > 0.28 && v > 0.18;
  const yellowish = h >= 40 && h <= 75 && s > 0.35 && v > 0.4;
  const brightYellow = r > 170 && g > 140 && b < 120;
  return greenish || yellowish || brightYellow;
}

function cleanupMask(mask, width, height) {
  const idx = (x, y) => y * width + x;
  const next = new Uint8Array(mask.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = idx(x, y);
      let neighbors = 0;
      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          if (xx === 0 && yy === 0) continue;
          neighbors += mask[idx(x + xx, y + yy)] ? 1 : 0;
        }
      }
      if (mask[i]) {
        next[i] = neighbors >= 3 ? 1 : 0; // remove isolated noise
      } else {
        next[i] = neighbors >= 6 ? 1 : 0; // fill tiny holes
      }
    }
  }
  return next;
}

async function process(name, crop) {
  const { data, info } = await sharp(src)
    .extract(crop)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = new Uint8Array(info.width * info.height);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    mask[i] = isLogoPixel(r, g, b) ? 1 : 0;
  }

  const cleaned = cleanupMask(mask, info.width, info.height);

  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    if (!cleaned[i]) {
      out[i * 4 + 3] = 0;
      continue;
    }
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const t = Math.min(1, Math.max(0, (l - 0.1) / 0.85));
    const nr = Math.round(mix(blue[0], red[0], t));
    const ng = Math.round(mix(blue[1], red[1], t));
    const nb = Math.round(mix(blue[2], red[2], t));

    out[i * 4] = nr;
    out[i * 4 + 1] = ng;
    out[i * 4 + 2] = nb;
    out[i * 4 + 3] = 255;
  }

  const outPath = `public/${name}-logo.png`;
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(outPath);
  console.log('wrote', outPath);
}

(async () => {
  await process('bert', crops.bert);
  await process('btk', crops.btk);
})();
