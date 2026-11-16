import { describe, expect, test } from "bun:test";
import { parsePack, stickerIndex } from "./stickers";

const pack = {
	format: "farcaster-sticker-pack",
	version: 1,
	id: "vibeshift-network-code",
	name: "Network Code Infractions",
	stickers: [
		{
			id: "pump-shill",
			name: "PUMP SHILL",
			alt: "Network Code sticker: PUMP SHILL (§A5)",
			url: "https://vibeshift.onchain.cooking/miniapps/vibeshift/stickers/network-code/v3/pump-shill.webp",
			mimeType: "image/webp",
			width: 512,
			height: 512,
			sha256: "a1dd7d5d0d14f4af1165df588df89843547b55976b691017c8e5b347b70c4961",
			tags: ["pump", "shill"],
			rule: { code: "A5", title: "Pump shilling pattern" }, // unknown field, ignored
		},
		{
			id: "bot-behaviour",
			name: "BOT BEHAVIOUR",
			alt: "Network Code sticker: BOT BEHAVIOUR (§A2)",
			url: "https://vibeshift.onchain.cooking/miniapps/vibeshift/stickers/network-code/v3/bot-behaviour.webp",
		},
	],
};

describe("parsePack", () => {
	test("the real pack parses, unknown fields ignored", () => {
		const stickers = parsePack(pack);
		expect(stickers).toHaveLength(2);
		expect(stickers[0].name).toBe("PUMP SHILL");
		expect((stickers[0] as { rule?: unknown }).rule).toBeUndefined();
	});

	test("wrong format or version parses to nothing", () => {
		expect(parsePack({ ...pack, format: "other" })).toEqual([]);
		expect(parsePack({ ...pack, version: 2 })).toEqual([]);
		expect(parsePack(null)).toEqual([]);
		expect(parsePack("json")).toEqual([]);
	});

	test("caps at 100 stickers (spec limit)", () => {
		const many = {
			...pack,
			stickers: Array.from({ length: 150 }, (_, i) => ({
				id: `s${i}`,
				url: `https://x.com/s${i}.webp`,
			})),
		};
		expect(parsePack(many)).toHaveLength(100);
	});

	test("drops non-https URLs and duplicate ids", () => {
		const dirty = {
			...pack,
			stickers: [
				{ id: "a", url: "http://x.com/a.webp" },
				{ id: "b", url: "javascript:alert(1)" },
				{ id: "c", url: "https://x.com/c.webp" },
				{ id: "c", url: "https://x.com/c2.webp" },
				{ id: "", url: "https://x.com/d.webp" },
				{ id: "e" },
			],
		};
		const stickers = parsePack(dirty);
		expect(stickers.map((s) => s.id)).toEqual(["c"]);
	});
});

describe("stickerIndex", () => {
	test("exact URLs only, first pack wins a disputed URL", () => {
		const second = {
			...pack,
			id: "other",
			stickers: [
				{ id: "pump-shill", name: "IMPOSTER", url: pack.stickers[0].url },
				{
					id: "fresh",
					name: "FRESH",
					url: "https://example.com/fresh.webp",
				},
			],
		};
		const index = stickerIndex([pack, second]);
		expect(index.size).toBe(3);
		expect(index.get(pack.stickers[0].url)?.name).toBe("PUMP SHILL");
		expect(index.get("https://example.com/fresh.webp")?.name).toBe("FRESH");
		// matching is by exact URL: no query string, no case games
		expect(
			index.has(
				pack.stickers[0].url.replace(".webp", ".webp?x=1"),
			),
		).toBe(false);
	});

	test("empty and broken manifests index to an empty map", () => {
		expect(stickerIndex([null, {}, { format: "x" }]).size).toBe(0);
	});
});
