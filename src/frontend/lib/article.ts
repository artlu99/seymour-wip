// Farcaster Articles: FIP "Cast Format and Chained Casts". An article is a
// chain of casts by one author. Each says where it sits (`chain`: index from
// 0, the count, and the first cast's id) and that its text is article
// Markdown (`formatVersion` 1). The cast at index 0 holds the title on its
// first line, then an optional empty line and the opening; its one embed, if
// any, is the cover. Later casts hold whole blocks, then embeds. Clients that
// don't know articles see a thread.
//
// Reading rules ported from Quilcast (github.com/backmeupplz/quilcast,
// src/article.ts, MIT). Seymour doesn't publish articles, so the writer
// (splitArticle) isn't here.

import { safeUrl } from "./cast-text";
import type { HydratedCast } from "../types";

/** format_version 1: article Markdown. */
export const ARTICLE = 1;
/** A chain has at most 100 casts. */
export const MAX_PARTS = 100;
/** Farcaster timestamps count seconds from 2021-01-01. */
export const FARCASTER_EPOCH = 1609459200;
/** Public Hypersnap node Quilcast reads from. CORS is open. */
export const HYPERSNAP = "https://haatz.quilibrium.com";

export type CastId = { fid: number; hash: string };
export type Chain = { root?: CastId; index: number; count: number };
export type Embed = { url?: string; castId?: CastId };

/** A cast as an article reader needs it. `hash` is 40 lowercase hex digits
 *  without 0x. `at` is the Farcaster timestamp. */
export type Part = {
	fid: number;
	hash: string;
	at: number;
	text: string;
	mentions: number[];
	positions: number[];
	embeds: Embed[];
	format: number;
	chain?: Chain;
};

const uint = (v: unknown) => {
	const x = typeof v === "string" && /^\d{1,15}$/.test(v) ? Number(v) : v;
	return typeof x === "number" && Number.isSafeInteger(x) && x >= 0 ? x : undefined;
};

export const hash40 = (s: unknown) =>
	typeof s === "string" && /^(0x)?[0-9a-f]{40}$/i.test(s)
		? s.replace(/^0x/i, "").toLowerCase()
		: undefined;

const castId = (x: unknown): CastId | undefined => {
	if (!x || typeof x !== "object") return;
	const o = x as { fid?: unknown; hash?: unknown };
	const fid = uint(o.fid);
	const hash = hash40(o.hash);
	return fid && hash ? { fid, hash } : undefined;
};

/** The shim stores unix seconds. A value already in Farcaster seconds (the
 *  node's own) is left alone: unix time for this decade is past 1.5e9, and
 *  Farcaster seconds won't reach that until 2068. */
export const toFarcasterTime = (ts: number) =>
	ts > 1_500_000_000 ? ts - FARCASTER_EPOCH : ts;

/** `0x` + 40 hex digits, for shim URLs. */
export const hexHash = (h: string): `0x${string}` => {
	const x = h.replace(/^0x/i, "").toLowerCase();
	return `0x${x}`;
};

/** The FIP's chain rules: at most 100 casts, an index below 100 and below
 *  `count` when it's set, no root at index 0, and the author's own cast as
 *  root otherwise. A chain that breaks one is left out, so the cast reads as
 *  an ordinary one. */
export function chainOf(c: unknown, fid: number): Chain | undefined {
	if (!c || typeof c !== "object") return;
	const o = c as { index?: unknown; count?: unknown; root?: unknown };
	const index = o.index == null ? 0 : uint(o.index);
	const count = o.count == null ? 0 : uint(o.count);
	if (
		index === undefined ||
		count === undefined ||
		count > MAX_PARTS ||
		index >= MAX_PARTS ||
		(count > 0 && index >= count)
	)
		return;
	if (index === 0) return o.root ? undefined : { index, count };
	const root = castId(o.root);
	return root && root.fid === fid ? { root, index, count } : undefined;
}

const embedsOf = (raw: unknown): Embed[] =>
	(Array.isArray(raw) ? raw : []).flatMap((e): Embed[] => {
		if (!e || typeof e !== "object") return [];
		const o = e as { url?: unknown; castId?: unknown; cast_id?: unknown };
		if (typeof o.url === "string") return [{ url: o.url }];
		const id = castId(o.castId ?? o.cast_id);
		return id ? [{ castId: id }] : [];
	});

/** A Hypersnap /v1 message as a Part, or null when it isn't a cast. */
export function fromNode(m: unknown): Part | null {
	if (!m || typeof m !== "object") return null;
	const msg = m as { hash?: unknown; data?: { type?: unknown; fid?: unknown; timestamp?: unknown; castAddBody?: unknown } };
	const d = msg.data;
	const b = d?.castAddBody as
		| {
				text?: unknown;
				embeds?: unknown;
				mentions?: unknown;
				mentionsPositions?: unknown;
				formatVersion?: unknown;
				chain?: unknown;
		  }
		| undefined;
	if (d?.type !== "MESSAGE_TYPE_CAST_ADD" || !b || typeof b !== "object") return null;
	const fid = uint(d.fid);
	const hash = hash40(msg.hash);
	if (!fid || !hash) return null;
	const nums = (a: unknown) =>
		(Array.isArray(a) ? a.map(uint).filter((x): x is number => x !== undefined) : []);
	return {
		fid,
		hash,
		at: uint(d.timestamp) || 0,
		text: typeof b.text === "string" ? b.text : "",
		mentions: nums(b.mentions),
		positions: nums(b.mentionsPositions),
		embeds: embedsOf(b.embeds),
		format: uint(b.formatVersion) || 0,
		chain: chainOf(b.chain, fid),
	};
}

/** A shim cast as a Part. Invalid chains are dropped. */
export function partFromCast(cast: HydratedCast): Part | null {
	const hash = hash40(cast.hash);
	if (!cast.fid || !hash) return null;
	return {
		fid: cast.fid,
		hash,
		at: toFarcasterTime(cast.timestamp),
		text: cast.rawText ?? cast.text ?? "",
		mentions: cast.mentions ?? [],
		positions: cast.mentionsPositions ?? [],
		embeds: embedsOf(cast.embeds),
		format: cast.formatVersion ?? 0,
		chain: chainOf(cast.chain, cast.fid),
	};
}

/** The first cast of an article. */
export const isArticle = (p: Part | null | undefined): p is Part & { chain: Chain } =>
	!!p && p.format === ARTICLE && p.chain?.index === 0 && !p.chain.root;

/** A later cast of an article chain. */
export const isArticlePart = (p: Part | null | undefined): p is Part & { chain: Chain & { root: CastId } } =>
	!!p && p.format === ARTICLE && !!p.chain?.root;

export const articleKind = (cast: HydratedCast): "article" | "part" | null => {
	const p = partFromCast(cast);
	if (isArticle(p)) return "article";
	if (isArticlePart(p)) return "part";
	return null;
};

/** One row per article. Seymour's feed includes the reply casts that carry the
 *  rest of a chain, newest first, so the pieces arrive split up and often
 *  before the first cast. Show the article once, at the first piece, using
 *  the first cast when this page has it. Later pieces of a chain already
 *  shown are left out. */
export function visibleFeedCasts(casts: HydratedCast[]): HydratedCast[] {
	const byHash = new Map<string, HydratedCast>();
	for (const c of casts) {
		const h = hash40(c.hash);
		if (h) byHash.set(h, c);
	}
	const emitted = new Set<string>();
	const out: HydratedCast[] = [];
	for (const c of casts) {
		const kind = articleKind(c);
		if (kind === "article") {
			const h = hash40(c.hash);
			if (!h || emitted.has(h)) continue;
			emitted.add(h);
			out.push(c);
			continue;
		}
		if (kind === "part") {
			const rootHash = c.chain?.root ? hash40(c.chain.root.hash) : undefined;
			if (!rootHash || emitted.has(rootHash)) continue;
			emitted.add(rootHash);
			out.push(byHash.get(rootHash) ?? c);
			continue;
		}
		out.push(c);
	}
	return out;
}

/** The title (the first line of the first cast) and the opening (what follows
 *  its empty line). */
export function headOf(text: string) {
	const nl = text.indexOf("\n");
	return {
		title: (nl < 0 ? text : text.slice(0, nl)).trim(),
		opening: nl < 0 ? "" : text.slice(nl + 1).replace(/^\n/, ""),
	};
}

/** The cover: the first cast's one URL embed, when it's a public http(s) URL. */
export const coverOf = (embeds: Embed[] = []) =>
	embeds.length === 1 ? safeUrl(embeds[0].url) : null;

export type Segment = { text: string } | { embeds: Embed[] };

const LONE_LINK = /^https?:\/\/\S+$/;
const PLACE = /^\[\$(\d{1,2})\]$/;
const oddSlashes = (l: string) => (l.match(/\\+$/)?.[0].length || 0) % 2 === 1;

/** A part as its reader shows it: text in pieces, embeds where `[$N]` puts
 *  them and links alone on a line as link previews, then the rest of its
 *  embeds (less those in `skip`: the cover). Lines in code and LaTeX blocks,
 *  and lines a backslash carries on, stay text. */
export function segments(text: string, embeds: Embed[], skip: number[] = []): Segment[] {
	const out: Segment[] = [];
	const used = new Set(skip);
	let buf: string[] = [];
	const flush = () => {
		if (buf.length) out.push({ text: buf.join("\n") });
		buf = [];
	};
	const put = (e: Embed) => {
		flush();
		const last = out[out.length - 1];
		if (last && "embeds" in last) last.embeds.push(e);
		else out.push({ embeds: [e] });
	};
	let fence = "";
	let goesOn = false;
	for (const l of text ? text.split("\n") : []) {
		if (fence) {
			buf.push(l);
			if (l === fence) fence = "";
			continue;
		}
		const was = goesOn;
		goesOn = oddSlashes(l);
		const m = l.match(PLACE);
		if (!was && m && +m[1] >= 1 && +m[1] <= embeds.length && !used.has(+m[1] - 1)) {
			used.add(+m[1] - 1);
			put(embeds[+m[1] - 1]);
		} else if (!was && LONE_LINK.test(l) && safeUrl(l)) put({ url: l });
		else {
			if (!was) fence = l.match(/^(`{3,})[^`]*$/)?.[1] || (l === "$$" ? "$$" : "");
			buf.push(l);
		}
	}
	flush();
	embeds.forEach((e, i) => {
		if (!used.has(i)) put(e);
	});
	return out;
}

/** The opening as a card shows it: its text, less the lines that are embeds. */
export const cardOpening = (opening: string, embeds: Embed[] = []) =>
	segments(opening, embeds)
		.flatMap((s) => ("text" in s ? [s.text] : []))
		.join("\n");

const later = (a: Part, b: Part) => a.at > b.at || (a.at === b.at && a.hash > b.hash);

export type Article = { parts: (Part | undefined)[]; complete: boolean };

/** The FIP's reading rules over `casts`, the author's casts from the root's
 *  timestamp on: the root, then at each index the latest cast by the same
 *  author whose root it is and whose count is the root's. A missing index is
 *  undefined. `complete`: every index below the count has a cast (a count of
 *  0 is a chain still growing, complete as far as it goes). */
export function assemble(root: Part & { chain: Chain }, casts: Part[]): Article {
	const count = root.chain.count;
	const best = new Map<number, Part>();
	for (const c of casts) {
		const ch = c.chain;
		if (!ch?.root || c.fid !== root.fid || ch.root.fid !== root.fid || ch.root.hash !== root.hash || ch.count !== count)
			continue;
		if (count > 0 && ch.index >= count) continue;
		const was = best.get(ch.index);
		if (!was || later(c, was)) best.set(ch.index, c);
	}
	const n = count > 0 ? count : Math.max(0, ...best.keys()) + 1;
	const parts = [root, ...Array.from({ length: n - 1 }, (_, i) => best.get(i + 1))];
	return { parts, complete: parts.every(Boolean) };
}

type NodePage = { messages?: unknown[]; nextPageToken?: string };

/** The article that starts at `root`: the author's casts from the root's
 *  timestamp on, page by page, until the chain is complete. */
export async function loadArticle(
	root: Part & { chain: Chain },
	signal?: AbortSignal,
	pages = 5,
): Promise<Article> {
	const casts: Part[] = [];
	let token = "";
	for (let i = 0; i < pages; i++) {
		const path = `/v1/castsByFid?fid=${root.fid}&startTimestamp=${root.at}&pageSize=100${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`;
		const r = await fetch(HYPERSNAP + path, { signal });
		if (!r.ok) throw new Error(`Hypersnap HTTP ${r.status}`);
		const data = (await r.json()) as NodePage;
		for (const m of data.messages ?? []) {
			const p = fromNode(m);
			if (p) casts.push(p);
		}
		token = data.nextPageToken || "";
		if (!token || (root.chain.count > 0 && assemble(root, casts).complete)) break;
	}
	return assemble(root, casts);
}

// Protocol mentions are byte offsets into the text, with the name not in it.
// CastContent's placeholders (U+F0000 … U+F0001) ride through the article
// parser and render as MentionSpan. Inserted, not swapped for a byte: the
// node's text has no stand-in character there.
const PH_OPEN = "\u{F0000}";
const PH_CLOSE = "\u{F0001}";

export function insertMentions(
	text: string,
	mentions: number[],
	positions: number[],
): { text: string; refs: Map<string, number> } {
	const bytes = new TextEncoder().encode(text);
	const marks = positions
		.map((at, i) => ({ at, fid: mentions[i] }))
		.filter((m) => m.fid !== undefined && m.at <= bytes.length)
		.sort((a, b) => a.at - b.at);
	const refs = new Map<string, number>();
	if (!marks.length) return { text, refs };
	const dec = new TextDecoder();
	let out = "";
	let last = 0;
	let n = 0;
	for (const m of marks) {
		if (m.at < last) continue;
		out += dec.decode(bytes.slice(last, m.at));
		const ref = (n++).toString(36);
		refs.set(ref, m.fid);
		out += `${PH_OPEN}${ref}${PH_CLOSE}`;
		last = m.at;
	}
	out += dec.decode(bytes.slice(last));
	return { text: out, refs };
}

/** What to parse. Shim `text` already has @names in it (`rawText` null);
 *  protocol text gets its mentions put back as placeholders. */
export function displayOf(cast: HydratedCast): { text: string; refs: Map<string, number> } {
	if (cast.rawText != null) return insertMentions(cast.rawText, cast.mentions, cast.mentionsPositions);
	return { text: cast.text ?? "", refs: new Map() };
}

export function displayOfPart(p: Part): { text: string; refs: Map<string, number> } {
	return insertMentions(p.text, p.mentions, p.positions);
}
