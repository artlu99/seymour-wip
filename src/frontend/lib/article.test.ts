import { describe, expect, test } from "bun:test";
import {
	ARTICLE,
	articleKind,
	assemble,
	cardOpening,
	coverOf,
	displayOf,
	fromNode,
	headOf,
	hexHash,
	insertMentions,
	isArticle,
	partFromCast,
	segments,
	toFarcasterTime,
	visibleFeedCasts,
} from "./article";
import type { Part } from "./article";
import type { HydratedCast } from "../types";

const H = (b: string): `0x${string}` => `0x${b.repeat(20)}`;

const msg = (hash: string, body: object, fid = 1, timestamp = 185297847) => ({
	hash,
	data: {
		type: "MESSAGE_TYPE_CAST_ADD",
		fid,
		timestamp,
		castAddBody: {
			text: "",
			embeds: [],
			mentions: [],
			mentionsPositions: [],
			...body,
		},
	},
});

const user = {
	fid: 1,
	username: "a",
	displayName: "A",
	pfpUrl: null,
	bio: null,
	primaryAddress: null,
};

const cast = (over: Partial<HydratedCast> = {}): HydratedCast =>
	({
		fid: 1,
		hash: H("ab"),
		text: "Title\n\nHello",
		rawText: null,
		embeds: [],
		mentions: [],
		mentionsPositions: [],
		parentCastId: null,
		parentUrl: "",
		timestamp: 1794757047,
		user,
		...over,
	}) as HydratedCast;

describe("an article chain", () => {
	test("the shim's unix timestamp becomes the node's Farcaster one", () => {
		expect(toFarcasterTime(1794757047)).toBe(185297847);
		expect(toFarcasterTime(185297847)).toBe(185297847);
	});

	test("a /v1 cast reads with its format and chain, and a broken chain is left out", () => {
		const root = fromNode(
			msg(H("d5"), {
				text: "Title",
				embeds: [{ url: "https://cdn.example/cover" }],
				formatVersion: 1,
				chain: { index: 0, count: 2 },
			}),
		)!;
		expect(root.format).toBe(ARTICLE);
		expect(root.chain).toEqual({ index: 0, count: 2 });
		expect(root.hash).toBe("d5".repeat(20));
		expect(isArticle(root)).toBe(true);
		expect(
			fromNode(msg(H("02"), { formatVersion: 1, chain: { index: 2, count: 2 } }))!.chain,
		).toBeUndefined();
		expect(
			fromNode(
				msg(H("03"), {
					formatVersion: 1,
					chain: { index: 1, count: 2, root: { fid: 2, hash: H("d5") } },
				}),
			)!.chain,
		).toBeUndefined();
	});

	test("the shim cast is an article, a later part, or neither", () => {
		expect(
			articleKind(
				cast({
					formatVersion: 1,
					chain: { index: 0, count: 6 },
					embeds: [{ url: "https://cdn.artlu.xyz/2WkjbCV7atc" }],
				}),
			),
		).toBe("article");
		expect(
			articleKind(
				cast({
					formatVersion: 1,
					chain: { index: 1, count: 6, root: { fid: 1, hash: H("ab") } },
				}),
			),
		).toBe("part");
		expect(articleKind(cast({ text: "gm" }))).toBeNull();
		expect(partFromCast(cast({ formatVersion: 1, chain: { index: 0, count: 6 } }))!.at).toBe(
			185297847,
		);
	});

	test("the latest cast at each index wins, and gaps stay gaps", () => {
		const root = fromNode(msg(H("a0"), { text: "T", formatVersion: 1, chain: { index: 0, count: 3 } }))! as Part & {
			chain: { index: number; count: number };
		};
		const part = (hash: string, index: number, at: number) =>
			fromNode(
				msg(
					H(hash),
					{ text: hash, formatVersion: 1, chain: { root: { fid: 1, hash: H("a0") }, index, count: 3 } },
					1,
					at,
				),
			)!;
		const a = assemble(root, [part("b1", 1, 10), part("b2", 1, 12), part("c1", 2, 11), part("c2", 2, 11)]);
		expect(a.complete).toBe(true);
		expect(a.parts.map((p) => p!.hash.slice(0, 2))).toEqual(["a0", "b2", "c2"]);
		const gappy = assemble(root, [part("b1", 2, 10)]);
		expect(gappy.complete).toBe(false);
		expect(gappy.parts.map((p) => p?.hash.slice(0, 2))).toEqual(["a0", undefined, "b1"]);
	});
});

describe("what a reader is shown", () => {
	test("the first cast holds the title, the opening and the cover", () => {
		expect(headOf('When Blind Process Isn\'t Enough\n\n# 1. "you have one job!"\nHi')).toEqual({
			title: "When Blind Process Isn't Enough",
			opening: '# 1. "you have one job!"\nHi',
		});
		expect(coverOf([{ url: "https://cdn.artlu.xyz/2WkjbCV7atc" }])).toBe(
			"https://cdn.artlu.xyz/2WkjbCV7atc",
		);
		expect(coverOf([{ url: "javascript:alert(1)" }])).toBeNull();
		expect(coverOf([])).toBeNull();
		expect(coverOf([{ url: "https://a.example" }, { url: "https://b.example" }])).toBeNull();
	});

	test("[$N] and a link alone on a line become embeds; the cover can be skipped", () => {
		expect(segments("a\n[$1]\nhttps://example.com/x\nb", [{ url: "https://c.example/pic" }])).toEqual([
			{ text: "a" },
			// embeds with nothing between them share one run
			{ embeds: [{ url: "https://c.example/pic" }, { url: "https://example.com/x" }] },
			{ text: "b" },
		]);
		expect(segments("hello", [{ url: "https://cdn.example/cover" }], [0])).toEqual([{ text: "hello" }]);
		expect(segments("```\nhttps://example.com\n[$1]\n```\nsee", [{ url: "https://c.example/1" }])).toEqual([
			{ text: "```\nhttps://example.com\n[$1]\n```\nsee" },
			{ embeds: [{ url: "https://c.example/1" }] },
		]);
		expect(cardOpening("## Look\n[$1]\nwords", [{ url: "https://c.example/cover" }])).toBe("## Look\nwords");
	});

	test("mentions are inserted at the byte, and shim text that already names them is left alone", () => {
		const { text, refs } = insertMentions("hi  there", [42], [3]);
		expect(text).toBe("hi \u{F0000}0\u{F0001} there");
		expect(refs.get("0")).toBe(42);
		expect(
			displayOf(cast({ text: "@ann hi", rawText: null, mentions: [2], mentionsPositions: [0] })).text,
		).toBe("@ann hi");
	});

	test("a part hash is 0x-prefixed for the shim", () => {
		expect(hexHash("AB".repeat(20))).toBe(`0x${"ab".repeat(20)}`);
	});
});

describe("a profile feed that includes the chain's replies", () => {
	const piece = (hash: string, over: Partial<HydratedCast> = {}) =>
		({
			fid: 1,
			hash,
			text: "body",
			rawText: null,
			embeds: [],
			mentions: [],
			mentionsPositions: [],
			timestamp: 1,
			user,
			...over,
		}) as HydratedCast;
	const root = piece(H("aa"), {
		text: "Title\n\nOpening",
		formatVersion: 1,
		chain: { index: 0, count: 3 },
	});
	const part = (n: number, tag: string) =>
		piece(H(tag), {
			formatVersion: 1,
			chain: { index: n, count: 3, root: { fid: 1, hash: H("aa") } },
			parentCastId: { fid: 1, hash: H("aa") },
		});

	test("the pieces collapse to the first cast, shown where the chain first appears", () => {
		const other = piece(H("cc"), { text: "gm" });
		const rows = visibleFeedCasts([other, part(2, "b2"), part(1, "b1"), root]);
		expect(rows.map((r) => r.hash)).toEqual([other.hash, root.hash]);
		expect(displayOf(rows[1]).text).toBe("Title\n\nOpening");
	});

	test("a chain whose first cast is already first stays one row", () => {
		expect(visibleFeedCasts([root, part(1, "b1")]).map((r) => r.hash)).toEqual([root.hash]);
	});

	test("a later piece with no first cast on this page is kept once", () => {
		const rows = visibleFeedCasts([part(2, "b2"), part(1, "b1")]);
		expect(rows.map((r) => r.hash)).toEqual([part(2, "b2").hash]);
	});
});
