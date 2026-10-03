import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const catalog = JSON.parse(readFileSync("public/parts/scripts-out-catalog.json", "utf8"));

async function shoot(items, outPath, cols = 8) {
  const cells = items
    .map(
      (it) => `
      <div class="cell">
        <img src="file://${join(process.cwd(), "public", it.imageUrl).replace(/\\/g, "/")}" />
        <div class="cap">${it.id}</div>
      </div>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#fff; font-family: sans-serif; }
    .grid { display:grid; grid-template-columns: repeat(${cols}, 1fr); gap:2px; }
    .cell { border:1px solid #ddd; padding:2px; text-align:center; }
    .cell img { width:100%; height:90px; object-fit:contain; background:#f6f6f6; }
    .cap { font-size:11px; font-weight:bold; color:#222; }
  </style></head><body><div class="grid">${cells}</div></body></html>`;

  const htmlPath = join(process.cwd(), "scratch-sheet.html");
  writeFileSync(htmlPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 800 } });
  await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log("wrote", outPath, "items:", items.length);
}

const mainChunks = chunk(catalog.main, 52);
for (let i = 0; i < mainChunks.length; i++) {
  await shoot(mainChunks[i], `scratch-sheet-main-${i + 1}.png`);
}

const subChunks = chunk(catalog.sub, 52);
for (let i = 0; i < subChunks.length; i++) {
  await shoot(subChunks[i], `scratch-sheet-sub-${i + 1}.png`);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
