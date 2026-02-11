const sharp = require('sharp');

const src = 'public/source.jpg';

const crops = {
  bert: { left: 140, top: 170, width: 430, height: 430 },
  btk: { left: 760, top: 190, width: 360, height: 360 },
};

const blue = [37, 99, 235];
const red = [239, 68, 68];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

async function process(name, crop) {
  const { data, info } = await sharp(src)
    .extract(crop)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    const [h, s, l] = rgbToHsl(r, g, b);

    const isLogo = s > 0.35 && l > 0.12 && h >= 40 && h <= 170;
    const alpha = isLogo ? 255 : 0;

    const t = Math.min(1, Math.max(0, (l - 0.1) / 0.7));
    const nr = Math.round(mix(blue[0], red[0], t));
    const ng = Math.round(mix(blue[1], red[1], t));
    const nb = Math.round(mix(blue[2], red[2], t));

    out[i * 4] = nr;
    out[i * 4 + 1] = ng;
    out[i * 4 + 2] = nb;
    out[i * 4 + 3] = alpha;
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
