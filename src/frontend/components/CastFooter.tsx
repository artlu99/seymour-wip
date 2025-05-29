import {
	useReactionsQuery,
	useRepliesQuery,
} from "../hooks/queries/useHubQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { TipButton } from "./TipButton";

interface CastFooterProps {
	cast: HydratedCast;
}
export const CastFooter = ({ cast }: CastFooterProps) => {
	const { contextFid, openUrl, composeCast } = useFrameSDK();
	const { showTipButtons } = useLocalStorageZustand();

	const warpcastUrl = `https://farcaster.xyz/${cast.user.username}/${cast.hash.slice(0, 10)}`;

	const likesQuery = useReactionsQuery(cast.user.fid, cast.hash, "Like");
	const likes = likesQuery.data?.allReactionsData[cast.hash] ?? [];
	const numLikes = likes.length;

	const recastsQuery = useReactionsQuery(cast.user.fid, cast.hash, "Recast");
	const recasts = recastsQuery.data?.allReactionsData[cast.hash] ?? [];
	const numRecasts = recasts.length;

	const repliesQuery = useRepliesQuery(cast.user.fid, cast.hash);
	const numReplies = repliesQuery.data ?? 0;

	return (
		<div className="card-footer bg-base-100 text-center mr-8">
			<div className="flex justify-between items-center">
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => composeCast(cast.user.fid, cast.hash)}
				>
					<i className="ri-chat-4-line">
						<span className="font-mono  ml-1">
							{numReplies > 99 ? "99+" : numReplies > 0 ? numReplies : ""}
						</span>
					</i>
				</button>
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => openUrl(warpcastUrl)}
				>
					<i className="ri-loop-left-line">
						<span className="font-mono ml-1">
							{numRecasts > 99 ? "99+" : numRecasts > 0 ? numRecasts : ""}
						</span>
					</i>
				</button>
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => openUrl(warpcastUrl)}
				>
					<i className="ri-heart-line">
						<span className="font-mono ml-1">
							{numLikes > 99 ? "99+" : numLikes > 0 ? numLikes : ""}
						</span>
					</i>
				</button>
				{contextFid &&
				showTipButtons &&
				cast.user.username &&
				cast.user.primaryAddress ? (
					<TipButton
						key={`tip-button-${cast.user.fid}-${cast.hash}`}
						username={cast.user.username}
						fid={cast.user.fid}
						recipient={cast.user.primaryAddress}
						tokenSymbol={"USDC"}
						amount={1.0}
						castHash={cast.hash}
					/>
				) : null}
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => openUrl(warpcastUrl)}
				>
					<i className="ri-share-2-line" />
				</button>
			</div>
		</div>
	);
};
