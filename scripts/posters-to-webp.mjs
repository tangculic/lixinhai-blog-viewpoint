/**
 * Re-encodes every poster and gallery photograph as WebP.
 *
 *   node scripts/posters-to-webp.mjs [--keep-jpg]
 *
 * The JPEGs were already compressed about as far as JPEG goes; this is a codec change,
 * not another quality cut. WebP's entropy coding and its predictors do roughly 40-50%
 * better than baseline JPEG at matching visual quality, and every browser this site
 * targets has supported it since 2020 — so the strip pays about half as much for the same
 * picture, which is the whole cost of swiping through a poster's gallery.
 *
 * Dimensions are left alone. The largest slot on screen is a 340px-wide plate, so 800px
 * of source is already about right for a 2x phone.
 *
 * The originals are deleted once each replacement is written and verified, unless
 * `--keep-jpg` is passed; `git` is the undo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(
  ROOT,
  "public/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters",
);

/**
 * 78 rather than the usual 80: these are flat, poster-like illustrations and photographs
 * of bright scenes, where WebP holds up well below the point it starts to show on
 * detailed texture. Checked against the largest and busiest file in the set.
 */
const QUALITY = 78;

const keepJpg = process.argv.includes("--keep-jpg");

const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".jpg"));
if (!files.length) {
  console.log("nothing to convert — no .jpg left in the posters folder");
  process.exit(0);
}

let before = 0;
let after = 0;
const worse = [];

for (const file of files.sort()) {
  const from = path.join(DIR, file);
  const to = from.replace(/\.jpg$/i, ".webp");

  const source = fs.statSync(from).size;
  await sharp(from).webp({ quality: QUALITY, effort: 6 }).toFile(to);
  const result = fs.statSync(to).size;

  before += source;
  after += result;

  // A file WebP cannot beat is left as a JPEG rather than shipped larger for the sake of
  // consistency — `posterImage` falls back per file, so a mixed set is fine.
  if (result >= source) {
    worse.push(file);
    fs.unlinkSync(to);
    after += source - result;
    continue;
  }

  if (!keepJpg) fs.unlinkSync(from);
  console.log(
    `${file.padEnd(38)} ${(source / 1024).toFixed(0).padStart(5)}KB -> ${(result / 1024)
      .toFixed(0)
      .padStart(5)}KB  (${(100 - (result / source) * 100).toFixed(0)}% off)`,
  );
}

console.log(
  `\n${files.length} files: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB` +
    ` (${(100 - (after / before) * 100).toFixed(0)}% off)`,
);
if (worse.length) console.log(`left as JPEG (WebP was no smaller): ${worse.join(", ")}`);
