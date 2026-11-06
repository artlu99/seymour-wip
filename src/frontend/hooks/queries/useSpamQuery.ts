import { useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import type { HydratedCast } from "../../types";

// Quilcast Spam — free, public, CORS-open API scoring Farcaster casts
// and accounts for spam probability. https://spam.quilcast.com
const spamApi = fetcher({ base: "https://spam.quilcast.com" });

export interface SpamScores {
	/** lowercase cast hash -> spam probability 0..1, or null while unscored */
	byHash: Record<string, number | null>;
	/** fid (as string) -> spam probability 0..1, or null while unscored */
	byFid: Record<string, number | null>;
}

const MAX_PER_CALL = 100; // API accepts up to 100 hashes/fids per call
const POLL_PENDING_MS = 15_000; // unscored casts land "a few seconds" later
const SCORED_TTL_MS = 60_000; // fully-scored answers are cached for 60s

const chunk = (items: string[]): string[][] => {
	const chunks: string[][] = [];
	for (let i = 0; i < items.length; i += MAX_PER_CALL) {
		chunks.push(items.slice(i, i + MAX_PER_CALL));
	}
	return chunks;
};

const hasText = (cast: HydratedCast) =>
	(cast.rawText ?? cast.text ?? "").trim().length > 0;

export const useSpamScores = (casts: HydratedCast[] | undefined) => {
	// Textless casts never get a score, so they are left out entirely.
	const hashes = [
		...new Set((casts ?? []).filter(hasText).map((c) => c.hash.toLowerCase())),
	].sort();
	const fids = [...new Set((casts ?? []).map((c) => c.user.fid))]
		.sort((a, b) => a - b)
		.map(String);

	return useQuery({
		queryKey: ["spam-scores", hashes.join(","), fids.join(",")],
		queryFn: async (): Promise<SpamScores> => {
			const [hashChunks, fidChunks] = await Promise.all([
				Promise.all(
					chunk(hashes).map((h) =>
						spamApi.get<Record<string, number | null>>("/scores", {
							query: { h: h.join(",") },
						}),
					),
				),
				Promise.all(
					chunk(fids).map((f) =>
						spamApi.get<Record<string, number | null>>("/users", {
							query: { fid: f.join(",") },
						}),
					),
				),
			]);
			return {
				byHash: Object.assign({}, ...hashChunks),
				byFid: Object.assign({}, ...fidChunks),
			};
		},
		staleTime: SCORED_TTL_MS,
		// A null means "not scored yet"; ask again a few seconds later.
		refetchInterval: (query) => {
			const { byHash, byFid } = query.state.data ?? {};
			if (!byHash || !byFid) return POLL_PENDING_MS;
			const pending =
				hashes.some((h) => byHash[h] == null) ||
				fids.some((f) => byFid[f] == null);
			return pending ? POLL_PENDING_MS : false;
		},
	});
};
