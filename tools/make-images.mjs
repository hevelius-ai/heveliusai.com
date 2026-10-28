// Renders the PNG icons and the 1200x630 share image from the logo files with Chromium.
// Run after a logo change: npm run images
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const site = new URL("../site/", import.meta.url);
const dataUri = (rel, type) => `data:${type};base64,${readFileSync(new URL(rel, site)).toString("base64")}`;
const favicon = dataUri("favicon.svg", "image/svg+xml");
const emblem = dataUri("img/emblem.svg", "image/svg+xml");
const montserrat = dataUri("fonts/montserrat-latin-600-normal.woff2", "font/woff2");
const plexMono = dataUri("fonts/ibm-plex-mono-latin-500-normal.woff2", "font/woff2");

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const [size, name] of [[180, "apple-touch-icon"], [192, "icon-192"], [512, "icon-512"]]) {
  await page.setViewportSize({ width: size, height: size });
  // iOS rounds the corners itself, so the touch icon is a full square.
  const bg = name === "apple-touch-icon" ? "#0B1F3A" : "transparent";
  await page.setContent(`<style>html,body{margin:0;background:${bg}}img{display:block;width:${size}px;height:${size}px}</style><img src="${favicon}">`);
  await page.screenshot({ path: new URL(`img/${name}.png`, site).pathname, omitBackground: bg === "transparent" });
}

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<style>
@font-face{font-family:M;font-weight:600;src:url(${montserrat}) format("woff2")}
@font-face{font-family:P;font-weight:500;src:url(${plexMono}) format("woff2")}
html,body{margin:0;width:1200px;height:630px;background:#0B1F3A;color:#F2F4F7;overflow:hidden}
.c{display:flex;align-items:center;gap:56px;height:100%;padding:0 72px;box-sizing:border-box}
img{width:470px;height:470px;flex:none}
.name{font:600 30px/1 M;letter-spacing:.32em;color:#C0C6CF;margin:0 0 28px}
h1{font:600 52px/1.12 M;letter-spacing:-.02em;margin:0 0 32px}
.url{font:500 24px/1 P;color:#C0C6CF;margin:0}
</style><div class="c"><img src="${emblem}"><div><p class="name">HEVELIUS AI GROUP</p><h1>AI you can trust, because you can verify it.</h1><p class="url">heveliusai.com</p></div></div>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL("img/share.png", site).pathname });

// One share image per page beside the main one: navy, the simplified mark, the page's name.
for (const [name, title] of [["agile-dev-team", "Agile Dev Team"], ["advisory", "AI advisory"], ["about", "About Hevelius AI Group"]]) {
  await page.setContent(`<style>
@font-face{font-family:M;font-weight:600;src:url(${montserrat}) format("woff2")}
@font-face{font-family:P;font-weight:500;src:url(${plexMono}) format("woff2")}
html,body{margin:0;width:1200px;height:630px;background:#0B1F3A;color:#F2F4F7;overflow:hidden}
.c{display:flex;align-items:center;gap:72px;height:100%;padding:0 96px;box-sizing:border-box}
img{width:360px;height:360px;flex:none}
.name{font:600 30px/1 M;letter-spacing:.32em;color:#C0C6CF;margin:0 0 28px}
h1{font:600 64px/1.1 M;letter-spacing:-.02em;margin:0 0 32px}
.url{font:500 24px/1 P;color:#C0C6CF;margin:0}
</style><div class="c"><img src="${favicon}"><div><p class="name">HEVELIUS AI GROUP</p><h1>${title}</h1><p class="url">heveliusai.com/${name}</p></div></div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(`img/share-${name}.png`, site).pathname });
}

await browser.close();
console.log("Images written to site/img");
