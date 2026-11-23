import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import type { HydratedCast } from "../../types";
import { useLocalStorageZustand, useZustand } from "../use-zustand";

const LOCAL_DEBUGGING = import.meta.env.DEV;

export const api = fetcher({
	base: LOCAL_DEBUGGING ? "http://localhost:3000" : "https://shim.artlu.xyz",
});

// Oldest-first mode drains the whole history in one go, so page size leans on
// what the shim accepts (limit 500 is a 422; 100 is warm-cache fast) and the
// cap mirrors the shim's own 10000-cast full-sync ceiling.
const DRAIN_PAGE_SIZE = 100;
const DRAIN_MAX_PAGES = 100;

export const useKeccersFeed = (
	fids: number[],
	opts: { drain?: boolean } = {},
) => {
	const { drain = false } = opts;
	return useInfiniteQuery({
		queryKey: [
			"keccers-feed",
			fids,
			drain ? "oldest-first" : "newest-first",
		],
		queryFn: async ({ pageParam = "" }) => {
			const fetchPage = (cursor: string) =>
				api.post<
					{
						fids: number[];
						limit: number;
						cursor: string;
					},
					{
						success: boolean;
						casts: HydratedCast[];
						cursor: string;
					}
				>("/reverse-chron", {
					fids,
					limit: drain ? DRAIN_PAGE_SIZE : 25,
					cursor,
				});

			if (!drain) {
				const res = await fetchPage(pageParam);
				return {
					casts: res.casts ?? [],
					nextCursor: res.cursor,
				};
			}

			// The shim only paginates newest-first (cursor walks backward and
			// exhausts at the account's beginning), so "actually pull
			// oldest-first" means walking all the way back and handing the
			// timeline one complete page. Data stays newest-first here on
			// purpose: visibleFeedCasts assumes arrival order for anchors, and
			// FeedTimeLine does the reversing for display.
			let cursor: string | null = pageParam;
			const seen = new Set<string>();
			const all: HydratedCast[] = [];
			for (let i = 0; cursor !== null && i < DRAIN_MAX_PAGES; i++) {
				const res = await fetchPage(cursor);
				for (const cast of res.casts ?? []) {
					if (!seen.has(cast.hash)) {
						seen.add(cast.hash);
						all.push(cast);
					}
				}
				cursor = res.cursor || null;
			}
			return {
				casts: all,
				nextCursor: null,
			};
		},
		initialPageParam: "",
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
		// A drained feed already holds everything; a 3-minute interval would
		// re-walk the whole history. Pull-to-refresh still invalidates it.
		refetchInterval: drain ? false : 3 * 60 * 1000, // Auto-refresh every 3 minutes
		staleTime: drain ? 10 * 60 * 1000 : 0,
		placeholderData: (previousData) => previousData,
	});
};

export const useUsernameQuery = (
	fid: number | undefined,
	opts: { enabled?: boolean } = {},
) => {
	return useQuery({
		queryKey: ["username", fid],
		queryFn: async () => {
			if (!fid) {
				return null;
			}
			const res = await api.get<{ success: boolean; username: string }>(
				`/u/${fid}`,
			);
			return res?.success ? res.username : null;
		},
		enabled: (opts.enabled ?? true) && !!fid,
	});
};

// The shared username dance: prefer the payload's username, fall back to the
// shim's /u/{fid}. `unresolvable` is true once the lookup finished empty —
// EmbedCard then degrades to pre-mapped castData, footer counts stay blank.
export const useResolvedHandle = (
	username: string | null | undefined,
	fid: number | undefined,
	opts: { enabled?: boolean } = {},
) => {
	const resolved = useUsernameQuery(username ? undefined : fid, opts);
	const handle = username || resolved.data || undefined;
	return {
		handle,
		unresolvable: !username && resolved.isSuccess && !resolved.data,
	};
};

export const useFidQuery = (username: string | undefined) => {
	return useQuery({
		queryKey: ["fid", username],
		queryFn: async () => {
			if (!username) {
				return null;
			}
			const res = await api.get<{ success: boolean; fid: number }>(
				`/f/${username}`,
			);
			return res?.success ? res.fid : null;
		},
		enabled: !!username,
	});
};

export const useCastIdQuery = (
	fid: number | undefined,
	hash: `0x${string}` | undefined,
	opts: { enabled?: boolean } = {},
) => {
	return useQuery({
		queryKey: ["cast-id", fid, hash],
		queryFn: async () => {
			const res = await api.get<{ success: boolean; cast: HydratedCast }>(
				`/i/${fid}/${hash}`,
			);
			return res.cast ?? null;
		},
		enabled: (opts.enabled ?? true) && !!fid && !!hash,
	});
};

export const useRefreshFeed = () => {
	const queryClient = useQueryClient();
	const { feedFids: fids } = useLocalStorageZustand();
	const { setIsRefreshing } = useZustand();

	return useMutation({
		mutationKey: ["refresh-feed"],
		mutationFn: async (body: { username?: string; fids: number[] }) => {
			setIsRefreshing(true);
			try {
				// single-account feeds only: nudge the shim into a full sync of
				// this fid's whole history (its casts-and-replies upserts what it
				// fetches). Fire-and-forget — the button answers with the
				// incremental refresh; the healed history lands in the feed when
				// the sync finishes. Multi-fid feeds skip this: N full syncs
				// would hang the press, and the watermark is the right steady
				// state there.
				if (body.fids.length === 1) {
					const fid = body.fids[0];
					void (async () => {
						const u = await api
							.get<{ success: boolean; username: string }>(`/u/${fid}`)
							.catch(() => null);
						if (!u?.success) return;
						await api
							.get(`/${u.username}/casts-and-replies?limit=10000`)
							.catch(() => {});
						queryClient.invalidateQueries({
							queryKey: ["keccers-feed", body.fids],
						});
					})().catch(() => {});
				}

				const response = await api.post<
					{
						username?: string;
						fids: number[];
					},
					{
						success: boolean;
						message: string;
						stats: {
							totalFids: number;
							totalNewCasts: number;
							totalCasts: number;
						};
					}
				>("/refresh", body);

				if (!response.success) {
					throw new Error(response.message);
				}

				return response.stats;
			} finally {
				setIsRefreshing(false);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["keccers-feed", fids],
			});
		},
	});
};
