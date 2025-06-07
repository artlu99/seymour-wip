import type { Message } from "@farcaster/core";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";

const client = fetcher({ base: "https://pop.farcaster.xyz:3381" });
const MAX_REACTIONS_PAGE_SIZE = 100;

export const FARCASTER_EPOCH = 1609459200;

export const useReactionsQuery = (
	fid: number,
	castHash: string,
	reactionType: "Like" | "Recast" = "Like",
) => {
	return useQuery({
		queryKey: ["hub-reactions", fid, castHash, reactionType],
		queryFn: async () => {
			const allReactionsData: Record<string, number[]> = {};
			const lastReactedTimes: Record<string, number> = {};

			const res = await client.get<{ messages: Message[] }>(
				`/v1/reactionsByCast?${new URLSearchParams({
					target_fid: fid.toString(),
					target_hash: castHash,
					reaction_type: reactionType,
					page_size: MAX_REACTIONS_PAGE_SIZE.toString(),
				})}`,
			);

			allReactionsData[castHash] =
				res?.messages.map((m) => m.data?.fid ?? 0) || [];
			lastReactedTimes[castHash] =
				res?.messages.reduce((max, m) => {
					const timestamp = ((m.data?.timestamp ?? 0) + FARCASTER_EPOCH) * 1000;
					return Math.max(max, timestamp);
				}, 0) ?? 0;
			return { allReactionsData, lastReactedTimes };
		},
		refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
	});
};

export const useRepliesQuery = (fid: number, castHash: string) => {
	return useQuery({
		queryKey: ["hub-replies", fid, castHash],
		queryFn: async () => {
			const res = await client.get<{ messages: Message[] }>(
				`/v1/castsByParent?${new URLSearchParams({
					fid: fid.toString(),
					hash: castHash,
					page_size: MAX_REACTIONS_PAGE_SIZE.toString(),
				})}`,
			);

			return res?.messages.length ?? 0;
		},
		refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
	});
};
