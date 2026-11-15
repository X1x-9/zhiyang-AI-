import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/print-doc-pdf.mjs <input.html> <output.pdf>");
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), "doc-pdf-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "about:blank",
]);

async function waitTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Chrome DevTools target not available");
}

const wsUrl = await waitTarget();
const ws = new WebSocket(wsUrl);
let nextId = 0;
const pending = new Map();
let loadedResolve;
const loaded = new Promise((r) => (loadedResolve = r));

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  } else if (msg.method === "Page.loadEventFired") {
    loadedResolve();
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Page.navigate", { url: pathToFileURL(input).href });
await Promise.race([loaded, new Promise((r) => setTimeout(r, 20000))]);
await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => 1)", awaitPromise: true });
await new Promise((r) => setTimeout(r, 600));

const footer = `<div style="width:100%;text-align:center;font-size:8px;color:#8a978c;font-family:'Microsoft YaHei',sans-serif;">智养AI · 技术文档 — <span class="pageNumber"></span> / <span class="totalPages"></span></div>`;
const { data } = await send("Page.printToPDF", {
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: footer,
});
writeFileSync(output, Buffer.from(data, "base64"));
console.log("PDF written:", output);
ws.close();
chrome.kill();
process.exit(0);
