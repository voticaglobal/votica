import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const items = JSON.parse(readFileSync("public/parts/subset-76-102.json", "utf8"));

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
  .grid { display:grid; grid-template-columns: repeat(5, 1fr); gap:6px; }
  .cell { border:1px solid #ccc; padding:4px; text-align:center; }
  .cell img { width:100%; height:260px; object-fit:contain; background:#f2f2f2; }
  .cap { font-size:18px; font-weight:bold; color:#000; }
</style></head><body><div class="grid">${cells}</div></body></html>`;

const htmlPath = join(process.cwd(), "scratch-zoom.html");
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scratch-zoom-1.png", fullPage: true });
await browser.close();
