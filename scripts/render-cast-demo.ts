// Renders before/after cast demos as HTML using the real cast-text parser,
// in Seymour's theme (index.css seymour palette). Run: bun scripts/render-cast-demo.ts
import { parseBlocks } from "../src/frontend/lib/cast-text";
import type { Block, InlinePiece } from "../src/frontend/lib/cast-text";

const esc = (s: string) =>
	s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const STICKER = "https://vibeshift.onchain.cooking/miniapps/vibeshift/stickers/network-code/v3";

// the cast @decent-artlu actually posted (0x4cc9e416…): markdown no composer parsed
const REAL_CAST =
	"§A2 violation in the wild. The full rule: https://farcaster.xyz/~/code\n\n![BOT BEHAVIOUR — §A2 Automated or templated posting](" +
	STICKER +
	"/bot-behaviour.webp)";

const STICKER_REPLY = `just checked the chart, we are so back 🚀🚀\n\n![PUMP SHILL — §A5](${STICKER}/pump-shill.webp)`;

const RICH =
	"**PSA:** the _Network Code_ now has ~~warning~~ *infraction* stickers. Read `the full rule` at [farcaster.xyz/~/code](https://farcaster.xyz/~/code)\n\n## The worst ones\n\n- **SCAM ALERT** — §201\n- BOT BEHAVIOUR — §A2\n  - the bot one, again\n\n> post responsibly\n\n```\nif (cast.likes_streak > 3) {\n  return '§A3';\n}\n```\n\n| violation | section |\n| --- | ---: |\n| pump shill | A5 |\n| spam farm | A3 |\n\n---\n\nsee @decent-artlu for the pack";

const piecesToHtml = (pieces: InlinePiece[]): string =>
	pieces
		.map((p) => {
			switch (p.kind) {
				case "text":
					return esc(p.text);
				case "url":
					return `<a class="lnk" href="${esc(p.href)}">${esc(p.label)}</a>`;
				case "handle":
					return `<a class="lnk" href="https://farcaster.xyz/${esc(p.name)}">@${esc(p.name)}</a>`;
				case "link":
					return `<a class="lnk" href="${esc(p.href)}">${piecesToHtml(p.children)}</a>`;
				case "image":
					return `<a class="imgwrap" href="${esc(p.src)}"><img class="md-img" src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy"></a>`;
				case "bold":
					return `<strong>${piecesToHtml(p.children)}</strong>`;
				case "em":
					return `<em>${piecesToHtml(p.children)}</em>`;
				case "strike":
					return `<s>${piecesToHtml(p.children)}</s>`;
				case "code":
					return `<code>${esc(p.text)}</code>`;
				case "mention-ref":
					return `<span class="lnk">@${esc(p.ref)}</span>`;
			}
		})
		.join("");

const blocksToHtml = (blocks: Block[]): string =>
	blocks
		.map((b) => {
			switch (b.kind) {
				case "p":
					return `<div class="p">${piecesToHtml(b.pieces)}</div>`;
				case "heading":
					return `<div class="h">${piecesToHtml(b.pieces)}</div>`;
				case "code-block":
					return `<pre class="pre"><code>${esc(b.text)}</code></pre>`;
				case "quote":
					return `<blockquote class="q">${blocksToHtml(b.blocks)}</blockquote>`;
				case "list":
					return b.ordered
						? `<ol class="lst dec">${b.items.map((i) => `<li>${blocksToHtml(i)}</li>`).join("")}</ol>`
						: `<ul class="lst dis">${b.items.map((i) => `<li>${blocksToHtml(i)}</li>`).join("")}</ul>`;
				case "rule":
					return `<hr class="hr">`;
				case "table":
					return `<table class="tbl"><thead><tr>${b.head
						.map(
							(c, k) =>
								`<th class="${b.align[k]}">${piecesToHtml(c)}</th>`,
						)
						.join("")}</tr></thead><tbody>${b.rows
						.map(
							(row) =>
								`<tr>${row
									.map(
										(c, k) =>
											`<td class="${b.align[k]}">${piecesToHtml(c)}</td>`,
									)
									.join("")}</tr>`,
						)
						.join("")}</tbody></table>`;
			}
		})
		.join("");

const row = (name: string, body: string) =>
	`<div class="demo"><div class="label">${name}</div><div class="cast">${body}</div></div>`;

const before = (text: string) => esc(text); // today's CastContent: raw text, pre-wrap
const after = (text: string) => blocksToHtml(parseBlocks(text));

const card = (user: string, handle: string, body: string) => `
  <div class="rowhead"><img class="pfp" src="https://i.pravatar.cc/48?img=12" alt="">${esc(user)} <span class="hdl">${esc(handle)}</span></div>
  ${body}
  <div class="foot">♡ 12 · ⟿ 3 · ↩ 2</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Seymour — degraded cast rendering</title><style>
  :root {
    --bg: oklch(25.33% 0.016 252.42);
    --bg2: oklch(23.26% 0.014 253.1);
    --ink: oklch(97.807% 0.029 256.847);
    --primary: oklch(80.5% 0.155 155.5);
    --line: rgb(250 250 251 / 0.15);
    --soft: rgb(250 250 251 / 0.05);
  }
  body { background: var(--bg); color: var(--ink); font: 14px/1.4 ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 28px; }
  h1 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
  .sub { color: rgb(250 250 251 / 0.5); font-size: 12px; margin-bottom: 24px; }
  .demo { margin-bottom: 30px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(250 250 251 / 0.45); margin-bottom: 8px; }
  .cast { background: var(--bg2); border-radius: 12px; padding: 14px 16px; white-space: pre-wrap; overflow-wrap: anywhere; }
  .pfp { width: 32px; height: 32px; border-radius: 9999px; vertical-align: middle; margin-right: 10px; }
  .rowhead { font-weight: 600; margin-bottom: 8px; }
  .hdl { font-weight: 400; color: rgb(250 250 251 / 0.5); font-size: 13px; }
  .foot { color: rgb(250 250 251 / 0.45); font-size: 12px; margin-top: 10px; }
  .lnk { color: var(--primary); text-decoration: none; }
  .md-img { display: block; max-width: 100%; max-height: 360px; min-width: 120px; min-height: 60px; object-fit: contain; border-radius: 12px; border: 1px solid var(--line); background: var(--soft); }
  .imgwrap { display: block; margin: 6px 0; cursor: zoom-in; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 0.88em; background: rgb(250 250 251 / 0.1); border-radius: 4px; padding: 1px 4px; }
  .pre { margin: 6px 0; padding: 8px 10px; background: var(--soft); border: 1px solid var(--line); border-radius: 8px; overflow-x: auto; white-space: pre; font-family: ui-monospace, Menlo, monospace; font-size: 0.88em; }
  .h { font-weight: 600; font-size: 1.15em; margin: 8px 0 2px; }
  .q { margin: 6px 0; padding-inline-start: 10px; border-inline-start: 3px solid var(--line); color: rgb(250 250 251 / 0.7); }
  .lst { margin: 6px 0; padding-inline-start: 1.4em; } .dec { list-style: decimal; } .dis { list-style: disc; }
  .hr { margin: 8px 0; border: 0; border-top: 1px solid var(--line); }
  .tbl { display: block; max-width: 100%; overflow-x: auto; margin: 6px 0; border-collapse: collapse; white-space: normal; }
  .tbl th, .tbl td { padding: 3px 8px; border: 1px solid var(--line); text-align: left; }
  .tbl th { font-weight: 600; } .tbl .right { text-align: right; } .tbl .center { text-align: center; }
  .zen { font-family: ui-serif, Georgia, serif; font-size: 15px; line-height: 1.625; }
</style></head><body>
<h1>Graceful rendering of degraded cast formatting</h1>
<div class="sub">left: Seymour today (raw text) · right: markdown recognition (ported from Quilcast) · zen serif below</div>

<div class="demo">
  <div class="label">1 · the real cast — @decent-artlu 0x4cc9e416, markdown nobody parsed</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
    ${row("today", card("artlu", "@decent-artlu", `<div class="cast">${before(REAL_CAST)}</div>`))}
    ${row("with cast-text", card("artlu", "@decent-artlu", after(REAL_CAST).replace('class="cast"', 'class="cast" style="white-space: normal"')))}
  </div>
</div>

<div class="demo">
  <div class="label">2 · a fully degraded long-form cast</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
    ${row("today", card("someone", "@elsewhere", `<div class="cast">${before(RICH)}</div>`))}
    ${row("with cast-text", card("someone", "@elsewhere", after(RICH).replace('class="cast"', 'class="cast" style="white-space: normal"')))}
  </div>
</div>

<div class="demo">
  <div class="label">3 · sticker reply, zen mode (serif)</div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
    ${row("today", card("reader", "@reader", `<div class="cast zen">${before(STICKER_REPLY)}</div>`))}
    ${row("with cast-text", card("reader", "@reader", after(STICKER_REPLY).replace('class="cast"', 'class="cast zen" style="white-space: normal"')))}
  </div>
</div>
</body></html>`;

await Bun.write("/tmp/cast-demo.html", html);
console.log("wrote /tmp/cast-demo.html");
