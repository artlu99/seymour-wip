// Sticker pack manifests → exact-URL index (the vibeshift draft spec's
// recognition scheme: never filename or hostname, never fetch feed images).
// Parsing is pure; the fetch/cache lives in useStickersQuery.

export interface Sticker {
	id: string;
	name: string;
	alt: string;
	url: string;
	mimeType?: string;
	width?: number;
	height?: number;
	sha256?: string;
	tags?: string[];
}

// The published packs Seymour knows. Both URLs per pack: the hosted API
// manifest and the static bundled one — the spec says match URLs from both
// when supporting both (today they agree; if they drift, first pack wins).
export const PACK_MANIFESTS = [
	"https://vibeshift.onchain.cooking/api/vibeshift/sticker-packs/network-code?revision=3",
	"https://vibeshift.onchain.cooking/miniapps/vibeshift/stickers/network-code/v3/pack.json",
];

// spec: at most 100 stickers per manifest, public HTTPS image URLs only
const MAX_STICKERS = 100;
const IMAGE_EXT = /\.(webp|png|gif)([?#]|$)/i;

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/** A manifest's stickers, or []: requires format "farcaster-sticker-pack"
 *  and version 1, drops stickers without a usable id+https image URL, keeps
 *  unique ids, and ignores every unknown field (rule, source, usage, …). */
export function parsePack(json: unknown): Sticker[] {
	if (!isRecord(json) || json.format !== "farcaster-sticker-pack" || json.version !== 1)
		return [];
	if (!Array.isArray(json.stickers)) return [];
	const out: Sticker[] = [];
	const seen = new Set<string>();
	for (const raw of json.stickers.slice(0, MAX_STICKERS)) {
		if (!isRecord(raw)) continue;
		const { id, name, alt, url } = raw;
		if (typeof id !== "string" || !id || seen.has(id)) continue;
		if (typeof url !== "string" || !url.startsWith("https://")) continue;
		// an image URL or nothing: the sticker doc's own limits say WebP/PNG/GIF
		if (!IMAGE_EXT.test(url) && !/imagedelivery\.net\//i.test(url)) continue;
		seen.add(id);
		out.push({
			id,
			name: typeof name === "string" ? name : id,
			alt: typeof alt === "string" ? alt : "",
			url,
			mimeType: typeof raw.mimeType === "string" ? raw.mimeType : undefined,
			width: typeof raw.width === "number" ? raw.width : undefined,
			height: typeof raw.height === "number" ? raw.height : undefined,
			sha256: typeof raw.sha256 === "string" ? raw.sha256 : undefined,
			tags: Array.isArray(raw.tags)
				? raw.tags.filter((t): t is string => typeof t === "string")
				: undefined,
		});
	}
	return out;
}

/** URL → sticker across manifests. Exact URLs only; a URL claimed by two
 *  packs keeps the first one parsed. */
export function stickerIndex(manifests: unknown[]): Map<string, Sticker> {
	const index = new Map<string, Sticker>();
	for (const pack of manifests)
		for (const sticker of parsePack(pack))
			if (!index.has(sticker.url)) index.set(sticker.url, sticker);
	return index;
}
