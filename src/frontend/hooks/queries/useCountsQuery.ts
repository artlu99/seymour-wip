import { useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import { useResolvedHandle } from "./useShimQuery";

// Eventual hydration of like/recast/reply counts for Seymour's reader-row
// footers — the same public, CORS-open endpoint react-farcaster-embed uses
// to complete its cards, so both renderings of a cast agree on the numbers.
// TanStack dedupes per (fid, hash), the query only arms once the footer
// scrolls near the viewport, and it never arms in Zen mode, where counts
// stay hidden. Failures are silent: a vanished cast just leaves the
// numbers blank.
const castFetcher = fetcher({ base: "https://farcaster.tv" });

export interface CastCounts {
	likes: number;
	recasts: number;
	replies: number;
}

// Counts always resolve to something (v5 queryFn must never return
// undefined — that throws): zeroed counts render as blank via fmtCount.
const EMPTY: CastCounts = { likes: 0, recasts: 0, replies: 0 };

// The subset of the v2 conversation payload the embed library itself reads:
// reactions = likes; combinedRecastCount = recasts + quote casts.
type ConversationCast = {
	hash?: string;
	reactions?: { count?: number };
	combinedRecastCount?: number;
	recasts?: { count?: number };
	replies?: { count?: number };
};

// Same cast the library picks from the conversation payload (its findLast,
// spelled as a scan for the ES2020 lib target).
const pickCounts = (
	casts: ConversationCast[] | undefined,
	hash: string,
): CastCounts => {
	if (casts) {
		for (let i = casts.length - 1; i >= 0; i--) {
			const c = casts[i];
			if (c?.hash?.includes(hash)) {
				return {
					likes: c.reactions?.count ?? 0,
					// Truthy check mirrors the library (not ??), so footer and
					// card agree even on payloads where combinedRecastCount is 0.
					recasts: c.combinedRecastCount
						? c.combinedRecastCount
						: (c.recasts?.count ?? 0),
					replies: c.replies?.count ?? 0,
				};
			}
		}
	}
	return EMPTY;
};

export const useCastCountsQuery = (
	fid: number,
	username: string | null,
	hash: string,
	opts: { enabled?: boolean } = {},
) => {
	// The endpoint is keyed on username — resolve one from the shim if the
	// feed payload didn't carry one (shared with CastOrReply's cards). The
	// lookup itself is gated by the same enabled flag, so Zen and off-screen
	// rows never fire it either.
	const { handle } = useResolvedHandle(username, fid, opts);

	return useQuery({
		queryKey: ["cast-counts", fid, hash],
		queryFn: async (): Promise<CastCounts> => {
			if (!handle) return EMPTY;
			const res = await castFetcher.get<{
				result?: { casts?: ConversationCast[] };
			}>(`/${handle}/${hash}`);
			return pickCounts(res?.result?.casts, hash);
		},
		enabled: (opts.enabled ?? true) && !!handle,
		staleTime: 60 * 1000,
		refetchOnWindowFocus: false,
		// 404s (deleted casts) can never succeed; transient failures get a
		// second chance on the next interval tick or remount instead.
		retry: false,
		refetchInterval: 3 * 60 * 1000, // stay eventual, like the feed itself
	});
};
