import type { Message } from "@farcaster/core";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";

const client = fetcher({ base: "https://pop.farcaster.xyz:3381" });
const MAX_REACTIONS_PAGE_SIZE = 100;

// Only the like-list still lives on the hub (the heart's own
// haveILikedFrfr state — the public counts endpoint can't answer that).
// It arms only when a signer exists to like with, and refetches on
// like/unlike, so it never polls.
export const useReactionsQuery = (
	fid: number,
	castHash: string,
	reactionType: "Like" | "Recast" = "Like",
	opts: { enabled?: boolean } = {},
) => {
	return useQuery({
		queryKey: ["hub-reactions", fid, castHash, reactionType],
		queryFn: async () => {
			const res = await client.get<{ messages: Message[] }>(
				`/v1/reactionsByCast?${new URLSearchParams({
					target_fid: fid.toString(),
					target_hash: castHash,
					reaction_type: reactionType,
					page_size: MAX_REACTIONS_PAGE_SIZE.toString(),
				})}`,
			);

			return {
				allReactionsData: {
					[castHash]: res?.messages.map((m) => m.data?.fid ?? 0) ?? [],
				},
			};
		},
		enabled: opts.enabled ?? true,
	});
};
