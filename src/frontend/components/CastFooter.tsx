import { useEffect, useState } from "preact/hooks";
import {
	useReactionsQuery,
	useRepliesQuery,
} from "../hooks/queries/useHubQuery";
import { useHubQuery } from "../hooks/queries/useOpenQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { likeCast } from "../lib/hubs";
import type { HydratedCast } from "../types";
import { TipButton } from "./TipButton";

interface CastFooterProps {
	cast: HydratedCast;
}
export const CastFooter = ({ cast }: CastFooterProps) => {
	const { contextFid, openUrl, composeCast } = useFrameSDK();
	const { showPfpAndDisplayName, showTipButtons, signerPrivateKey } =
		useLocalStorageZustand();
	const [optimisticLike, setOptimisticLike] = useState(false);
	const [isLiking, setIsLiking] = useState(false);

	const hubQuery = useHubQuery(signerPrivateKey);
	const hub = hubQuery?.data;

	const warpcastUrl = `https://farcaster.xyz/${cast.user.username}/${cast.hash.slice(0, 10)}`;

	const likesQuery = useReactionsQuery(cast.user.fid, cast.hash, "Like");
	const likes = likesQuery.data?.allReactionsData[cast.hash] ?? [];
	const haveILikedFrfr =
		signerPrivateKey && hub && likes.length > 0
			? likes.includes(contextFid ?? 0)
			: false;
	const likeIndicator = optimisticLike || haveILikedFrfr;
	const optimisticCount = optimisticLike && !haveILikedFrfr ? 1 : 0;
	const numLikes = likes.length + optimisticCount;

	// Reset optimistic state when server data updates or on error
	useEffect(() => {
		if (likesQuery.data || likesQuery.isError) {
			setOptimisticLike(false);
			setIsLiking(false);
		}
	}, [likesQuery.data, likesQuery.isError]);

	const handleLike = async () => {
		if (contextFid && signerPrivateKey && hub && !isLiking) {
			setIsLiking(true);
			setOptimisticLike(true);
			try {
				await likeCast(
					contextFid,
					`0x${signerPrivateKey.replace("0x", "")}`,
					{
						fid: cast.user.fid,
						hash: cast.hash,
					},
					hub,
				);
				void likesQuery.refetch();
			} catch (error) {
				console.error("Failed to like cast:", error);
				setOptimisticLike(false);
				setIsLiking(false);
			}
		} else {
			openUrl(warpcastUrl);
		}
	};

	const recastsQuery = useReactionsQuery(cast.user.fid, cast.hash, "Recast");
	const recasts = recastsQuery.data?.allReactionsData[cast.hash] ?? [];
	const numRecasts = recasts.length;

	const repliesQuery = useRepliesQuery(cast.user.fid, cast.hash);
	const numReplies = repliesQuery.data ?? 0;

	const textColor = showPfpAndDisplayName
		? "text-base-content/50"
		: "text-base-content/30";

	return (
		<div className="card-footer bg-base-100 text-center mr-8">
			<div className="flex justify-between items-center">
				<button
					type="button"
					className={`btn btn-sm btn-ghost text-sm ${textColor}`}
					onClick={() => composeCast(cast.user.fid, cast.hash)}
				>
					<i className="ri-chat-4-line">
						<span className="font-mono ml-1">
							{numReplies > 99 ? "99+" : numReplies > 0 ? numReplies : ""}
						</span>
					</i>
				</button>
				<button
					type="button"
					className={`btn btn-sm btn-ghost text-sm ${textColor}`}
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
					className={`btn btn-sm btn-ghost text-sm ${textColor}`}
					onClick={handleLike}
					disabled={isLiking}
				>
					<i
						className={
							likeIndicator ? "ri-heart-fill text-red-500" : "ri-heart-line"
						}
					>
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
					className={`btn btn-sm btn-ghost text-sm ${textColor}`}
					onClick={() => openUrl(warpcastUrl)}
				>
					<i className="ri-share-2-line" />
				</button>
			</div>
		</div>
	);
};
