import { describe, expect, test } from "bun:test";
import { parseBlocks, parseInline, safeUrl, shortUrl } from "./cast-text";
import type { Block, InlinePiece } from "./cast-text";

// piece helpers — the tests read like the renderer that consumes them
const kinds = (pieces: InlinePiece[]) => pieces.map((p) => p.kind);
const one = <T extends InlinePiece>(pieces: InlinePiece[]): T => {
	expect(pieces).toHaveLength(1);
	return pieces[0] as T;
};
const first = (blocks: Block[]): InlinePiece[] =>
	(blocks[0] as { pieces: InlinePiece[] }).pieces;

describe("the degraded sticker cast, as really posted", () => {
	// @decent-artlu/0x4cc9e416 — markdown a composer never parsed, embeds empty
	const cast =
		"§A2 violation in the wild. The full rule: https://farcaster.xyz/~/code\n\n![BOT BEHAVIOUR — §A2 Automated or templated posting](https://vibeshift.onchain.cooking/miniapps/vibeshift/stickers/network-code/v3/bot-behaviour.webp)";

	test("the inline URL links, its label scheme-stripped", () => {
		const pieces = first(parseBlocks(cast));
		expect(kinds(pieces)).toEqual(["text", "url", "text", "image"]);
		const url = pieces[1] as { kind: "url"; href: string; label: string };
		expect(url.href).toBe("https://farcaster.xyz/~/code");
		expect(url.label).toBe("farcaster.xyz/~/code");
	});

	test("the markdown image becomes one picture, one stray line break kept", () => {
		const pieces = first(parseBlocks(cast));
		const img = pieces[3] as { kind: "image"; src: string; alt: string };
		expect(img.src).toBe(
			"https://vibeshift.onchain.cooking/miniapps/vibeshift/stickers/network-code/v3/bot-behaviour.webp",
		);
		expect(img.alt).toBe("BOT BEHAVIOUR — §A2 Automated or templated posting");
		expect((pieces[2] as { text: string }).text).toBe("\n");
	});
});

describe("inline recognition", () => {
	test("scheme-less domains on common TLDs link", () => {
		const u = parseInline("see seymour.artlu.xyz/casts now").find((p) => p.kind === "url") as {
			href: string;
		};
		expect(u.href).toBe("https://seymour.artlu.xyz/casts");
	});

	test("trailing punctuation stays out of a link", () => {
		const urls = parseInline("x.com, y.io; (z.dev)").filter((p) => p.kind === "url");
		expect(urls.map((p) => (p as { label: string }).label)).toEqual(["x.com", "y.io", "z.dev"]);
	});

	test("bold, italic, strike, and their plain-text neighbors stay put", () => {
		expect(kinds(parseInline("**bold** and *em* and _em_ and ~~gone~~ stay"))).toEqual([
			"bold", "text", "em", "text", "em", "text", "strike", "text",
		]);
	});

	test("snake_case and 5 * 3 do not emphasize", () => {
		expect(parseInline("5 * 3 = 15, snake_case_name")).toEqual([
			{ kind: "text", text: "5 * 3 = 15, snake_case_name" },
		]);
	});

	test("inline code keeps text dead inside, and sheds one padding space pair", () => {
		const c = parseInline("run `npm install *-glob` now").find((p) => p.kind === "code") as {
			text: string;
		};
		expect(c.text).toBe("npm install *-glob");
	});

	test("[labels](href) link, and an unusable href leaves its label to parse on", () => {
		const good = one(parseInline("[the code](https://github.com/x)")) as unknown as {
			children: InlinePiece[];
		};
		expect(good.children).toEqual([{ kind: "text", text: "the code" }]);
		const bad = one(parseInline("[joke://not-a-url label](joke://x)"));
		expect(bad.kind).toBe("text");
	});

	test("@handles come out whole; a sentence's dot and '_' walk off", () => {
		const names = (s: string) =>
			parseInline(s)
				.filter((p) => p.kind === "handle")
				.map((p) => (p as { name: string }).name);
		expect(names("hi @adam- and @bob.eth... and @alice.")).toEqual(["adam-", "bob.eth", "alice"]);
		expect(names("@x_y")).toEqual(["x"]);
	});

	test("an email stays dead text: @ glues the domain shut", () => {
		expect(parseInline("mail@adam.com stays mail")).toEqual([
			{ kind: "text", text: "mail@adam.com stays mail" },
		]);
	});

	test("a Cyrillic-lookalike domain glued to а links nothing", () => {
		expect(parseInline("аpple.com and pаypal.com")).toEqual([
			{ kind: "text", text: "аpple.com and pаypal.com" },
		]);
	});

	test("script-written-without-spaces neighbors still link", () => {
		const u = parseInline("访问quilcast.com看看").find((p) => p.kind === "url") as { href: string };
		expect(u.href).toBe("https://quilcast.com/");
	});

	test("long invisible runs stay linear (Quilcast's quadratic guard)", () => {
		const t0 = performance.now();
		for (const ch of ["​", "⁠"]) {
			const pieces = parseInline(ch.repeat(20000) + " quilcast.com");
			expect(pieces[pieces.length - 1].kind).toBe("url");
		}
		// long label runs before a glued letter, which the match backs off one at a time
		for (const s of ["com.".repeat(20000) + "рф", "x." + "a.".repeat(20000) + "м"])
			expect(parseInline(s)).toEqual([{ kind: "text", text: s }]);
		expect(performance.now() - t0).toBeLessThan(2000);
	});
});

describe("safeUrl", () => {
	test("http(s) only, no credentials, no private or loopback hosts", () => {
		expect(safeUrl("https://vibeshift.onchain.cooking/x.webp")).toBe(
			"https://vibeshift.onchain.cooking/x.webp",
		);
		expect(safeUrl("javascript:alert(1)")).toBeNull();
		expect(safeUrl("http://user:pass@x.com/")).toBeNull();
		expect(safeUrl("http://localhost/x")).toBeNull();
		expect(safeUrl("http://127.0.0.1/x")).toBeNull();
		expect(safeUrl("http://192.168.1.4/x")).toBeNull();
		expect(safeUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
		expect(safeUrl("not a url")).toBeNull();
	});
});

describe("shortUrl", () => {
	test("strips scheme and www, caps at 40", () => {
		expect(shortUrl("https://www.x.com/a")).toBe("x.com/a");
		expect(shortUrl("https://x.com/" + "a".repeat(50))).toBe("x.com/" + "a".repeat(34) + "…");
	});
});

describe("blocks", () => {
	test("a fenced code block takes the rest, closer or not (its info string dropped, as in Quilcast)", () => {
		const withEnd = parseBlocks("look:\n```js\nconst x = 1\n```\nafter");
		expect(withEnd.map((b) => b.kind)).toEqual(["p", "code-block", "p"]);
		expect((withEnd[1] as { text: string }).text).toBe("const x = 1");
		const noEnd = parseBlocks("```\njust code\nmore code");
		expect(noEnd.map((b) => b.kind)).toEqual(["code-block"]);
	});

	test("headings, rules and quotes parse", () => {
		const blocks = parseBlocks("## Heading\n\ntext\n\n---\n\n> quoted **loud**");
		expect(blocks.map((b) => b.kind)).toEqual(["heading", "p", "rule", "quote"]);
		expect((blocks[0] as { level: number }).level).toBe(2);
		const q = blocks[3] as { blocks: { pieces: InlinePiece[] }[] };
		expect(kinds(q.blocks[0].pieces)).toEqual(["text", "bold"]);
	});

	test("lists keep their order and their indented continuation line", () => {
		const blocks = parseBlocks("- one\n- two\n  continued\n\n3. three");
		expect(blocks.map((b) => b.kind)).toEqual(["list", "list"]);
		const bullets = blocks[0] as { ordered: boolean; items: unknown[][] };
		expect(bullets.ordered).toBe(false);
		expect(bullets.items).toHaveLength(2);
		const numbered = blocks[1] as { ordered: boolean; start?: number };
		expect(numbered.ordered).toBe(true);
		expect(numbered.start).toBe(3);
	});

	test("only a list from 1 breaks a paragraph (born in 1990. stays text)", () => {
		expect(parseBlocks("born in\n1990. Then more").map((b) => b.kind)).toEqual(["p"]);
	});

	test("pipe tables with alignment parse", () => {
		const blocks = parseBlocks("| a | b |\n| --- | ---: |\n| 1 | 2 |");
		expect(blocks).toHaveLength(1);
		const t = blocks[0] as unknown as {
			align: string[];
			head: unknown[];
			rows: unknown[][][];
		};
		expect(t.align).toEqual(["", "right"]);
		expect(t.head).toHaveLength(2);
		expect(t.rows).toHaveLength(1);
	});

	test("mention placeholders pass through untouched", () => {
		const pieces = first(parseBlocks("hi \u{F0000}0a\u{F0001} there"));
		expect(kinds(pieces)).toEqual(["text", "mention-ref", "text"]);
		expect((pieces[1] as { ref: string }).ref).toBe("0a");
	});
});
