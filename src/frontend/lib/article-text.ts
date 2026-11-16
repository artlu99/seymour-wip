// Article Markdown (format_version 1) as blocks. Quilcast's articleHtml
// (src/shared.ts): a block per line, not the cast CommonMark parser.
//
//   # / ## headings (drawn under the article title, so h2 and h3)
//   > quotes          - / 1. lists, two spaces of indent a level
//   ---               ``` code          $$ LaTeX, as its source
//   | tables |        **bold** _em_ ~~strike~~ ++underline++
//   [label](href)     bare URLs         @handles
//
// A line ending in an odd number of backslashes continues, and a backslash
// escapes \ * _ ~ + [ ]. A backslash first on a line cancels the block
// syntax. An empty line is an empty paragraph. [$N] lines and links alone
// on a line are split off before this (article.ts segments).

import { LINK_RE, safeUrl, shortUrl } from "./cast-text";

const ESCAPED = "\\*_~+[]";
const MENTION_NAME = "[a-zA-Z0-9][a-zA-Z0-9.-]*";
const PH = "\\u{F0000}(?<ph>[0-9a-z]+)\\u{F0001}";

const ARTICLE_INLINE = new RegExp(
	[
		PH,
		/\$\$(?<math>[^\n]+?)\$\$/.source,
		/(?<tick>`+)(?<code>[^`]|[^`][\s\S]*?[^`])\k<tick>(?!`)/.source,
		/!\[(?<alt>[^\]\n]*)\]\((?<src>[^\s()]+)\)/.source,
		/\[(?<label>[^\]\n]+)\]\((?<href>[^\s()]+)\)/.source,
		`(?<token>${LINK_RE.source}|(?<![\\w/])@${MENTION_NAME}(?<!\\.))`,
		/\*\*(?=\S)(?<bold>[\s\S]*?\S)\*\*(?!\*)/.source,
		/(?<!\w)__(?=\S)(?<bold2>[\s\S]*?\S)__(?!\w)/.source,
		/~~(?=\S)(?<strike>[\s\S]*?\S)~~/.source,
		/\*(?=[^\s*])(?<em>[\s\S]*?[^\s*])\*/.source,
		/(?<!\w)_(?=[^\s_])(?<em2>[\s\S]*?[^\s_])_(?!\w)/.source,
		/\+\+(?=\S)(?<under>[\s\S]*?\S)\+\+(?!\+)/.source,
	].join("|"),
	"gu",
);

const TOKEN_ONLY = new RegExp(
	`(\\u{F0000}(?<cellph>[0-9a-z]+)\\u{F0001}|${LINK_RE.source}|(?<![\\w/])@${MENTION_NAME}(?<!\\.))`,
	"gu",
);

const hideEscapes = (s: string) =>
	s.replace(/\\([\\*_~+[\]\\])/g, (_, c: string) => String.fromCharCode(0xe000 + ESCAPED.indexOf(c)));
const showChar = (s: string) =>
	s.replace(/[\ue000-\ue006]/g, (c) => ESCAPED[c.charCodeAt(0) - 0xe000]);
const unhide = (s: string) =>
	s.replace(/[\ue000-\ue006]/g, (c) => "\\" + ESCAPED[c.charCodeAt(0) - 0xe000]);
const stripOwn = (s: string) => s.replace(/[\ue000-\ue006]/g, "\uFFFD");

// Farcaster's editor can leave a space inside a closing ** ("**Embedded casts **").
const tidy = (s: string) => s.replace(/\*\*(?=\S)([^*\n]*?\S)([ \t]+)\*\*(?!\*)/g, "**$1**$2");

export type ArticlePiece =
	| { kind: "text"; text: string }
	| { kind: "br" }
	| { kind: "url"; href: string; label: string }
	| { kind: "image"; src: string; alt: string }
	| { kind: "link"; href: string; children: ArticlePiece[] }
	| { kind: "bold" | "em" | "strike" | "under"; children: ArticlePiece[] }
	| { kind: "code"; text: string }
	| { kind: "math"; text: string }
	| { kind: "handle"; name: string }
	| { kind: "mention-ref"; ref: string };

const pushText = (out: ArticlePiece[], t: string) => {
	const bits = t.split("\n");
	for (let i = 0; i < bits.length; i++) {
		if (i) out.push({ kind: "br" });
		if (bits[i]) out.push({ kind: "text", text: bits[i] });
	}
};

function parseHidden(s: string, live: boolean): ArticlePiece[] {
	const out: ArticlePiece[] = [];
	let at = 0;
	for (const m of s.matchAll(ARTICLE_INLINE)) {
		const g = m.groups as Record<string, string | undefined>;
		pushText(out, showChar(s.slice(at, m.index)));
		at = m.index + m[0].length;
		if (g.ph !== undefined) out.push({ kind: "mention-ref", ref: g.ph });
		else if (g.math !== undefined) out.push({ kind: "math", text: unhide(g.math) });
		else if (g.code !== undefined)
			out.push({ kind: "code", text: unhide(g.code.replace(/^ (.*[^ ].*) $/s, "$1")) });
		else if (g.src !== undefined) {
			const alt = showChar(g.alt ?? "");
			const u = safeUrl(showChar(g.src));
			out.push(u ? { kind: "image", src: u, alt } : { kind: "text", text: alt });
		} else if (g.label !== undefined) {
			const u = safeUrl(showChar(g.href ?? ""));
			if (u) out.push({ kind: "link", href: u, children: parseHidden(g.label, false) });
			else out.push(...parseHidden(g.label, live));
		} else if (g.token !== undefined) {
			const t = showChar(g.token);
			if (!live) pushText(out, t);
			else if (t[0] === "@") out.push({ kind: "handle", name: t.slice(1) });
			else {
				const href = safeUrl(/^https?:\/\//i.test(t) ? t : `https://${t}`);
				out.push(href ? { kind: "url", href, label: shortUrl(t) } : { kind: "text", text: t });
			}
		} else if (g.bold !== undefined) out.push({ kind: "bold", children: parseHidden(g.bold, live) });
		else if (g.bold2 !== undefined) out.push({ kind: "bold", children: parseHidden(g.bold2, live) });
		else if (g.strike !== undefined) out.push({ kind: "strike", children: parseHidden(g.strike, live) });
		else if (g.em !== undefined) out.push({ kind: "em", children: parseHidden(g.em, live) });
		else if (g.em2 !== undefined) out.push({ kind: "em", children: parseHidden(g.em2, live) });
		else out.push({ kind: "under", children: parseHidden(g.under ?? "", live) });
	}
	pushText(out, showChar(s.slice(at)));
	return out;
}

/** Inline article Markdown. `live` false keeps URLs and @handles as text,
 *  for a link label (a link can't hold one). */
export function parseArticleInline(s: string, live = true): ArticlePiece[] {
	return parseHidden(tidy(hideEscapes(stripOwn(s))), live);
}

/** Table cells and nothing else: links and @handles, no emphasis. The cell
 *  text already had \| \\ \- read as themselves (articleCells). */
export function parseArticleLinks(s: string): ArticlePiece[] {
	const out: ArticlePiece[] = [];
	let at = 0;
	for (const m of s.matchAll(TOKEN_ONLY)) {
		pushText(out, s.slice(at, m.index));
		at = m.index + m[0].length;
		const t = m[1];
		const ph = /^\u{F0000}([0-9a-z]+)\u{F0001}$/u.exec(t);
		if (ph) out.push({ kind: "mention-ref", ref: ph[1] });
		else if (t[0] === "@") out.push({ kind: "handle", name: t.slice(1) });
		else {
			const href = safeUrl(/^https?:\/\//i.test(t) ? t : `https://${t}`);
			out.push(href ? { kind: "url", href, label: shortUrl(t) } : { kind: "text", text: t });
		}
	}
	pushText(out, s.slice(at));
	return out;
}

export type ArticleList = {
	ordered: boolean;
	items: { pieces: ArticlePiece[]; kids: ArticleList[] }[];
};

export type ArticleBlock =
	| { kind: "p"; pieces: ArticlePiece[] }
	| { kind: "gap" }
	| { kind: "heading"; level: 2 | 3; pieces: ArticlePiece[] }
	| { kind: "quote"; paras: ArticlePiece[][] }
	| { kind: "list"; list: ArticleList }
	| { kind: "code"; text: string }
	| { kind: "math"; text: string }
	| { kind: "rule" }
	| { kind: "table"; head: ArticlePiece[][]; rows: ArticlePiece[][][] };

const ITEM = /^((?: {2})*)(?:(-)|\d{1,9}\.) /;
const DIVIDER = /^\|(?:\s*:?-+:?\s*\|)+\s*$/;
const oddSlashes = (l: string) => (l.match(/\\+$/)?.[0].length || 0) % 2 === 1;

/** A table row's cells, where \| \\ and \- are escapes. */
export function articleCells(l: string): string[] {
	const out: string[] = [];
	let cur = "";
	const s = l.trim().replace(/^\|/, "");
	for (let i = 0; i < s.length; i++) {
		if (s[i] === "\\" && "|\\-".includes(s[i + 1] ?? "x")) cur += s[++i];
		else if (s[i] === "|") {
			out.push(cur.trim());
			cur = "";
		} else cur += s[i];
	}
	if (cur.trim()) out.push(cur.trim());
	return out;
}

/** Article Markdown as blocks. */
export function parseArticle(text: string): ArticleBlock[] {
	const lines = stripOwn(text).split("\n");
	const out: ArticleBlock[] = [];
	const stack: ArticleList[] = [];
	let quote: ArticlePiece[][] | null = null;

	const popList = () => {
		const list = stack.pop();
		if (!list) return;
		const parent = stack[stack.length - 1];
		if (!parent) out.push({ kind: "list", list });
		else parent.items[parent.items.length - 1].kids.push(list);
	};
	const closeLists = (depth = 0) => {
		while (stack.length > depth) popList();
	};
	const endQuote = () => {
		if (quote) out.push({ kind: "quote", paras: quote });
		quote = null;
	};

	for (let i = 0; i < lines.length; i++) {
		let l = lines[i];
		const fence = l.match(/^(`{3,})[^`]*$/)?.[1] || (l === "$$" ? "$$" : "");
		if (fence) {
			closeLists();
			endQuote();
			const end = lines.findIndex((x, j) => j > i && x === fence);
			const stop = end < 0 ? lines.length : end;
			const body = lines.slice(i + 1, stop).join("\n");
			out.push(fence === "$$" ? { kind: "math", text: body } : { kind: "code", text: body });
			i = stop;
			continue;
		}
		if (l.startsWith("|") && DIVIDER.test(lines[i + 1] || "")) {
			closeLists();
			endQuote();
			const head = articleCells(l);
			const rows: ArticlePiece[][][] = [];
			let j = i + 2;
			for (; j < lines.length && lines[j].startsWith("|"); j++)
				rows.push(articleCells(lines[j]).map((c) => parseArticleLinks(c)));
			i = j - 1;
			const width = head.length;
			const fit = (cells: ArticlePiece[][]) =>
				Array.from({ length: width }, (_, k) => cells[k] ?? []);
			out.push({
				kind: "table",
				head: head.map((c) => parseArticleLinks(c)),
				rows: rows.map(fit),
			});
			continue;
		}
		while (oddSlashes(l)) {
			l = l.slice(0, -1);
			if (i + 1 >= lines.length) break;
			l += "\n" + lines[++i];
		}
		if (l[0] === "\\") {
			closeLists();
			endQuote();
			const body = ESCAPED.includes(l[1] ?? "x") ? l : l.slice(1);
			out.push({ kind: "p", pieces: parseArticleInline(body) });
			continue;
		}
		const item = l.match(ITEM);
		if (item) {
			endQuote();
			const ordered = !item[2];
			const depth = Math.min(item[1].length / 2, stack.length);
			closeLists(depth + 1);
			if (stack.length === depth + 1 && stack[depth].ordered !== ordered) closeLists(depth);
			const pieces = parseArticleInline(l.slice(item[0].length));
			if (stack.length === depth + 1) stack[depth].items.push({ pieces, kids: [] });
			else stack.push({ ordered, items: [{ pieces, kids: [] }] });
			continue;
		}
		closeLists();
		const q = l.match(/^>(?: |$)/);
		if (q) {
			if (!quote) quote = [];
			quote.push(parseArticleInline(l.slice(q[0].length)));
			continue;
		}
		endQuote();
		const h = l.match(/^(#{1,2}) (.*)$/s);
		if (h) {
			const level = (h[1].length + 1) as 2 | 3;
			out.push({ kind: "heading", level, pieces: parseArticleInline(h[2]) });
		} else if (l.trim() === "---") out.push({ kind: "rule" });
		else if (/^\$\$.+\$\$$/.test(l)) out.push({ kind: "math", text: l.slice(2, -2) });
		else if (l) out.push({ kind: "p", pieces: parseArticleInline(l) });
		else out.push({ kind: "gap" });
	}
	closeLists();
	endQuote();
	return out;
}
