// Minimal static server for site/, used by the checks and for local preview: npm run serve
// Serves text files gzip-compressed, and /advisory from advisory.html, as GitHub Pages does.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";

const root = new URL("../site/", import.meta.url).pathname;
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".webmanifest": "application/manifest+json",
};
const compressible = new Set([".html", ".css", ".js", ".svg", ".txt", ".xml", ".webmanifest"]);

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  else if (!extname(path)) path += ".html";
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    let body = await readFile(file);
    const ext = extname(file);
    const headers = { "content-type": types[ext] || "application/octet-stream", "cache-control": "no-store" };
    if (compressible.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      body = gzipSync(body);
      headers["content-encoding"] = "gzip";
    }
    res.writeHead(200, headers).end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  }
}).listen(port, () => console.log(`Serving site/ at http://localhost:${port}/`));
