import { useQuery } from "@tanstack/react-query";
import { PACK_MANIFESTS, stickerIndex } from "../../lib/stickers";
import type { Sticker } from "../../lib/stickers";

// The sticker index, fetched from the public CORS-open manifests and cached:
// TanStack keeps it in memory; localStorage warm-starts the first paint so a
// repeat visit never renders sticker-sized images before the index lands.
// The spec's "refresh periodically" is staleTime: an hour, refetch on remount
// past that. Failures are silent — stickers then just render as plain images.

const CACHE_KEY = "seymour-stickers-v1";
const MANIFEST_BYTES = 128 * 1024; // spec: 128 KiB per manifest
const FRESH_MS = 60 * 60 * 1000;

interface Cache {
	at: number;
	manifests: { url: string; json: unknown }[];
}

const loadCache = (): Cache | null => {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Cache;
		if (!Array.isArray(parsed.manifests) || typeof parsed.at !== "number") return null;
		return parsed;
	} catch {
		return null; // corrupted or unavailable: cold start
	}
};

const saveCache = (manifests: { url: string; json: unknown }[]) => {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), manifests }));
	} catch {
		// full or blocked storage: cache-less operation is fine
	}
};

// spec: 128 KiB manifests, no credentials on fetch
async function fetchManifest(url: string): Promise<unknown> {
	const res = await fetch(url, { credentials: "omit" });
	if (!res.ok) throw new Error(`sticker manifest ${res.status}`);
	const text = await res.text();
	if (text.length > MANIFEST_BYTES) throw new Error("sticker manifest too large");
	return JSON.parse(text);
}

export const useStickersQuery = () =>
	useQuery({
		queryKey: ["sticker-packs"],
		queryFn: async (): Promise<Map<string, Sticker>> => {
			const results = await Promise.allSettled(
				PACK_MANIFESTS.map(async (url) => ({ url, json: await fetchManifest(url) })),
			);
			const manifests = results
				.filter((r): r is PromiseFulfilledResult<{ url: string; json: unknown }> => r.status === "fulfilled")
				.map((r) => r.value);
			saveCache(manifests);
			return stickerIndex(manifests.map((m) => m.json));
		},
		initialData: () => {
			const cached = loadCache();
			return cached ? stickerIndex(cached.manifests.map((m) => m.json)) : undefined;
		},
		initialDataUpdatedAt: () => loadCache()?.at,
		staleTime: FRESH_MS,
		gcTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
		retry: false,
	});
