// Cast text → structured pieces: graceful rendering of degraded formatting.
//
// Ported from Quilcast's markdown renderer (github.com/backmeupplz/quilcast,
// src/shared.ts, MIT) — the same recognition, but instead of emitting HTML
// strings this returns typed pieces that CastContent renders as Preact nodes
// (so escaping stays Preact's job and nothing innerHTML-shaped exists).
//
// What gets recognized, leftmost match wins:
//   `code`            ![alt](src) images    [label](href) links
//   bare URLs         @handles              **bold** __bold__
//   *em* _em_         ~~strike~~            ``` fenced code blocks
//   # headings        > quotes              - / 1. lists
//   --- rules         | tables |
//
// @handles in text stay unresolvable here (Seymour's real mentions arrive as
// byte positions — CastContent encodes those as U+F0000..U+F0001-wrapped refs
// before parsing and swaps them back at render time), so a parsed "@name"
// links straight to farcaster.xyz.

// links as people write them: with a scheme, or a bare domain on a common TLD.
// The homograph guards are Quilcast's: a bare domain glued to a letter, mark
// or digit of another script (Cyrillic аpple.com) is not a link, and neither
// are invisible characters inside one. Written without the i flag (with u,
// [a-z] would miss ſ and the Kelvin sign), so letters are spelled both ways.
const TLDS =
	"com|org|net|xyz|io|app|dev|ai|co|me|gg|so|sh|fm|tv|art|fun|lol|wtf|info|page|site|tech|link|to|us|uk|de|fr|eu|ca|ly|cc|club|blog|news|social|world|live|studio|games|finance|money|cash|network|systems|build|tools";
const SPACELESS =
	"\\p{scx=Han}\\p{scx=Hiragana}\\p{scx=Katakana}\\p{scx=Bopomofo}\\p{scx=Hangul}\\p{scx=Thai}\\p{scx=Lao}\\p{scx=Khmer}\\p{scx=Myanmar}";
const INVISIBLE = "\\p{Default_Ignorable_Code_Point}*";
const GLUED = `\\w|[^\\P{N}\\p{scx=Common}${SPACELESS}]|[^\\P{L}${SPACELESS}]`;
const MARK = "[^\\P{M}\\p{Me}\\p{Default_Ignorable_Code_Point}]";
const ON_GLUED = `(?<=(?:${GLUED})[\\p{M}\\p{Default_Ignorable_Code_Point}]*)`;
const ON_LETTER = `(?<=\\p{L}${INVISIBLE})`;
const WORDY_START = `${GLUED}|[^\\P{M}\\p{Me}\\p{Default_Ignorable_Code_Point}${SPACELESS}]`;
const WORDY = `${WORDY_START}|${MARK}${ON_GLUED}|\\p{Me}(?<=\\p{L}${INVISIBLE}\\p{Me})`;
const WORDY_BEHIND = `${WORDY_START}|${ON_GLUED}${MARK}|${ON_LETTER}\\p{Me}`;
const anyCase = (s: string) => s.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`);
const BARE = `(?=[a-zA-Z0-9-])(?<!(?:[@.\\/\\-]|${WORDY_BEHIND})${INVISIBLE})(?![\\p{Default_Ignorable_Code_Point}a-zA-Z0-9.-]*(?![\\x00-\\x7f])(?:${WORDY}))(?:[a-zA-Z0-9-]+\\.)+(?:${anyCase(TLDS)})(?!${INVISIBLE}(?:${WORDY}))`;
export const LINK_RE = new RegExp(
	`${anyCase("http")}[sS]?:\\/\\/[^\\s<>"]+[^\\s<>".,;:!?)\\]'"]|${BARE}(?:\\/[^\\s<>"]*[^\\s<>".,;:!?)\\]'"])?`,
	"gu",
);
const toUrl = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);

// a link's label as people read it: no scheme, no www, at most 40 characters.
export const shortUrl = (s: string) => {
	const t = s.replace(/^https?:\/\/(www\.)?/, "");
	return t.length > 40 ? t.slice(0, 40) + "…" : t;
};

// localhost and private-range hosts never link or load: they would let a cast
// reach things at the reader's machine (Quilcast's LOCAL).
const LOCAL =
	/^(localhost|.*\.localhost|.*\.local|0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|\[)/i;
const stripInvisible = (s: string) => s.replace(/⁠/g, "");

/** An http(s) URL without credentials or a private/loopback host, normalized,
 *  else nothing. Everything clickable or loadable goes through this. */
export function safeUrl(u?: string | null): string | null {
	if (typeof u !== "string") return null;
	try {
		const x = new URL(u);
		if (/^https?:$/.test(x.protocol) && !x.username && !x.password && !LOCAL.test(x.hostname))
			return x.href;
	} catch {
		// not a URL at all
	}
	return null;
}

// a handle after "@": a letter or digit, then letters, digits, "." and "-" —
// fnames (adam-), ENS names (bob.eth). The trailing (?<!\.) walks the greedy
// run back off a sentence's dot, so "@alice." is alice and "@adam-." is adam-.
const MENTION_NAME = "[a-zA-Z0-9][a-zA-Z0-9.-]*";
const TOKEN_RE = new RegExp(`(${LINK_RE.source}|(?<![\\w/])@${MENTION_NAME}(?<!\\.))`, "gu");

// Seymour's mention placeholders (see CastContent): U+F0000 + base-36 + U+F0001.
// The name is the ref alone; wrapping the whole placeholder would keep the sentinels in it.
const PH_RE = "\\u{F0000}(?<ph>[0-9a-z]+)\\u{F0001}";

// the leftmost of these wins; at one spot, the earlier one. Code, pictures and
// links come before tokens so a URL inside them stays inside, and before
// emphasis so an underscore in one stays in it; _ never emphasizes inside a
// word (snake_case), and ** walks back off a third asterisk.
const INLINE = new RegExp(
	[
		PH_RE,
		/(?<tick>`+)(?<code>[^`]|[^`][\s\S]*?[^`])\k<tick>(?!`)/.source,
		/!\[(?<alt>[^\]\n]*)\]\((?<src>[^\s()]+)\)/.source,
		/\[(?<label>[^\]\n]+)\]\((?<href>[^\s()]+)\)/.source,
		`(?<token>${TOKEN_RE.source})`,
		/\*\*(?=\S)(?<bold>[\s\S]*?\S)\*\*(?!\*)/.source,
		/(?<!\w)__(?=\S)(?<bold2>[\s\S]*?\S)__(?!\w)/.source,
		/~~(?=\S)(?<strike>[\s\S]*?\S)~~/.source,
		/\*(?=[^\s*])(?<em>[\s\S]*?[^\s*])\*/.source,
		/(?<!\w)_(?=[^\s_])(?<em2>[\s\S]*?[^\s_])_(?!\w)/.source,
	].join("|"),
	"gu",
);

export type InlinePiece =
	| { kind: "text"; text: string }
	| { kind: "url"; href: string; label: string }
	| { kind: "image"; src: string; alt: string }
	| { kind: "link"; href: string; children: InlinePiece[] }
	| { kind: "bold" | "em" | "strike"; children: InlinePiece[] }
	| { kind: "code"; text: string }
	// a plain @handle from degraded text (no fid behind it)
	| { kind: "handle"; name: string }
	// CastContent's byte-position mention, passed through as its placeholder ref
	| { kind: "mention-ref"; ref: string };

/** Inline Markdown and tokens as pieces. `live` false is for link labels,
 *  which hold no links of their own: their tokens stay text (Quilcast passes
 *  tags=null there; nested <a> would be invalid anyway). */
export function parseInline(s: string, live = true): InlinePiece[] {
	const out: InlinePiece[] = [];
	let at = 0;
	const text = (t: string) => {
		if (t) out.push({ kind: "text", text: t });
	};
	for (const m of s.matchAll(INLINE)) {
		const g = m.groups as Record<string, string | undefined>;
		text(s.slice(at, m.index));
		at = m.index + m[0].length;
		if (g.ph !== undefined) {
			out.push({ kind: "mention-ref", ref: g.ph });
		} else if (g.code !== undefined) {
			// ` code ` keeps its inner padding only when there is some beyond it
			out.push({ kind: "code", text: g.code.replace(/^ (.*[^ ].*) $/s, "$1") });
		} else if (g.src !== undefined) {
			const alt = g.alt ?? "";
			const u = safeUrl(stripInvisible(g.src));
			out.push(u ? { kind: "image", src: u, alt } : { kind: "text", text: alt });
		} else if (g.label !== undefined) {
			const u = safeUrl(stripInvisible(g.href ?? ""));
			// its label can say anything, so it renders recursively — but with no
			// live tokens of its own when the link is real (a link can't hold one)
			if (u) out.push({ kind: "link", href: u, children: parseInline(g.label, false) });
			else out.push(...parseInline(g.label, live));
		} else if (g.token !== undefined) {
			const t = g.token;
			if (t[0] === "@") out.push(live ? { kind: "handle", name: t.slice(1) } : { kind: "text", text: t });
			else {
				const href = safeUrl(toUrl(stripInvisible(t)));
				out.push(href ? { kind: "url", href, label: shortUrl(t) } : { kind: "text", text: t });
			}
		} else if (g.bold !== undefined) out.push({ kind: "bold", children: parseInline(g.bold, live) });
		else if (g.bold2 !== undefined) out.push({ kind: "bold", children: parseInline(g.bold2, live) });
		else if (g.strike !== undefined) out.push({ kind: "strike", children: parseInline(g.strike, live) });
		else if (g.em !== undefined) out.push({ kind: "em", children: parseInline(g.em, live) });
		else out.push({ kind: "em", children: parseInline(g.em2 ?? "", live) });
	}
	text(s.slice(at));
	return out;
}

// a picture is block-shaped once rendered: the line break on each side of it
// would draw an empty line under pre-wrap, so one goes (Quilcast's
// \n?(<img>)\n? over the paragraph's HTML).
const stripAroundImages = (pieces: InlinePiece[]): InlinePiece[] => {
	const out = pieces.slice();
	for (let i = 0; i < out.length; i++) {
		if (out[i].kind !== "image") continue;
		const prev = out[i - 1];
		if (prev?.kind === "text" && prev.text.endsWith("\n")) {
			prev.text = prev.text.slice(0, -1);
			if (!prev.text) {
				out.splice(i - 1, 1);
				i--;
			}
		}
		const next = out[i + 1];
		if (next?.kind === "text" && next.text.startsWith("\n")) {
			next.text = next.text.slice(1);
			if (!next.text) out.splice(i + 1, 1);
		}
	}
	return out;
};

export type Block =
	| { kind: "p"; pieces: InlinePiece[] }
	| { kind: "heading"; level: number; pieces: InlinePiece[] }
	| { kind: "code-block"; text: string }
	| { kind: "quote"; blocks: Block[] }
	| { kind: "list"; ordered: boolean; start?: number; items: Block[][] }
	| { kind: "rule" }
	| { kind: "table"; align: ("" | "center" | "right")[]; head: InlinePiece[][]; rows: InlinePiece[][][] };

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const ITEM = /^( {0,3})([-*+]|(\d{1,9})[.)])[ \t]+/;
const ROW = /^\s*\|?(.*?)\|?\s*$/;
const DIVIDER = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const cells = (line: string) =>
	line.replace(ROW, "$1").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
const isTable = (l: string, next = "") =>
	l.includes("|") && next.includes("|") && DIVIDER.test(next) && cells(l).length === cells(next).length;
const starts = (l: string, next?: string) =>
	FENCE.test(l) || HEADING.test(l) || RULE.test(l) || QUOTE.test(l) || ITEM.test(l) || isTable(l, next);

/** Cast text as blocks. As in CommonMark, only a list from 1 breaks into a
 *  paragraph ("born in\n1990. Then…" stays text); a fence with no closer
 *  takes the rest of its text; a quote's and a list item's insides recurse. */
export function parseBlocks(text: string, live = true): Block[] {
	const lines = text.split("\n");
	const out: Block[] = [];
	let para: string[] = [];
	const flush = () => {
		const p = para.join("\n").replace(/^\n+|\n+$/g, "");
		para = [];
		const pieces = stripAroundImages(parseInline(p, live));
		if (pieces.length) out.push({ kind: "p", pieces });
	};
	for (let i = 0; i < lines.length; i++) {
		const l = lines[i];
		const num = l.match(ITEM)?.[3];
		if (!starts(l, lines[i + 1]) || (num !== undefined && +num !== 1 && para.length && para[para.length - 1].trim())) {
			para.push(l);
			continue;
		}
		flush();
		const fence = l.match(FENCE);
		const heading = l.match(HEADING);
		const item = l.match(ITEM);
		if (fence) {
			const end = lines.findIndex(
				(x, j) => j > i && x.trim().startsWith(fence[1]) && !x.trim().slice(fence[1].length).trim(),
			);
			const stop = end < 0 ? lines.length : end;
			out.push({ kind: "code-block", text: lines.slice(i + 1, stop).join("\n") });
			i = stop;
		} else if (heading) {
			out.push({ kind: "heading", level: heading[1].length, pieces: parseInline(heading[2], live) });
		} else if (RULE.test(l)) {
			out.push({ kind: "rule" });
		} else if (QUOTE.test(l)) {
			const q: string[] = [];
			while (i < lines.length && QUOTE.test(lines[i])) q.push(lines[i++].replace(QUOTE, ""));
			i--;
			out.push({ kind: "quote", blocks: parseBlocks(q.join("\n"), live) });
		} else if (item) {
			const ordered = item[3] !== undefined;
			const items: string[][] = [];
			// an item runs on over the indented lines under it; an unindented one ends the list
			const under = new RegExp(`^ {0,${item[0].length}}`);
			for (; i < lines.length; i++) {
				const x = lines[i];
				const it = x.match(ITEM);
				if (it && it[1].length <= item[1].length && (it[3] !== undefined) === ordered)
					items.push([x.slice(it[0].length)]);
				else if (/^\s{2,}\S/.test(x)) items[items.length - 1].push(x.replace(under, ""));
				else break;
			}
			i--;
			out.push({
				kind: "list",
				ordered,
				start: ordered && +item[3] !== 1 ? +item[3] : undefined,
				items: items.map((it) => parseBlocks(it.join("\n"), live)),
			});
		} else {
			const head = cells(l);
			const align = cells(lines[i + 1]).map((c): "" | "center" | "right" =>
				c.endsWith(":") ? (c.startsWith(":") ? "center" : "right") : "",
			);
			const rows: InlinePiece[][][] = [];
			let j = i + 2;
			for (; j < lines.length && lines[j].includes("|") && lines[j].trim(); j++)
				rows.push(cells(lines[j]).map((c) => parseInline(c, live)));
			i = j - 1;
			out.push({ kind: "table", align, head: head.map((c) => parseInline(c, live)), rows });
		}
	}
	flush();
	return out;
}
