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

export const useKeccersFeed = (fids: number[]) => {
	return useInfiniteQuery({
		queryKey: ["keccers-feed", fids],
		queryFn: async ({ pageParam = "" }) => {
			const res = await api.post<
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
				limit: 25,
				cursor: pageParam,
			});
			return {
				casts: res.casts ?? [],
				nextCursor: res.cursor,
			};
		},
		initialPageParam: "",
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
		refetchInterval: 3 * 60 * 1000, // Auto-refresh every 3 minutes
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

export const useCastIdQuery = (fid: number, hash: `0x${string}`) => {
	return useQuery({
		queryKey: ["cast-id", fid, hash],
		queryFn: async () => {
			const res = await api.get<{ success: boolean; cast: HydratedCast }>(
				`/i/${fid}/${hash}`,
			);
			return res.cast ?? null;
		},
		enabled: !!fid && !!hash,
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
