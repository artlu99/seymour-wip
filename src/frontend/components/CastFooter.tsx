import { useEffect, useState } from "preact/hooks";
import {
	useReactionsQuery,
	useRepliesQuery,
} from "../hooks/queries/useHubQuery";
import { useProfiles } from "../hooks/use-profiles";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { warpcastUrl } from "../lib/common";
import { likeCast } from "../lib/hubs";
import type { HydratedCast } from "../types";

interface CastFooterProps {
	cast: HydratedCast;
}
export const CastFooter = ({ cast }: CastFooterProps) => {
	const { openUrl } = useProfiles();
	const { showPfpAndDisplayName, signerFid, signerPrivateKey } =
		useLocalStorageZustand();
	const [optimisticLike, setOptimisticLike] = useState(0);
	const [isLiking, setIsLiking] = useState(false);

	const fidForLike = signerFid;
	const likesQuery = useReactionsQuery(cast.user.fid, cast.hash, "Like");
	const likes = likesQuery.data?.allReactionsData[cast.hash] ?? [];
	const haveILikedFrfr =
		signerPrivateKey && likes.length > 0
			? likes.includes(fidForLike ?? 0)
			: false;
	const optimisticCount =
		optimisticLike > 0 && !haveILikedFrfr
			? 1
			: optimisticLike < 0 && haveILikedFrfr
				? -1
				: 0;
	const numLikes = likes.length + optimisticCount;
	const likeIndicator =
		// has not unliked
		optimisticLike >= 0 &&
		// has liked
		(optimisticLike > 0 || haveILikedFrfr);

	// Reset optimistic state when server data updates or on error
	useEffect(() => {
		if (likesQuery.data || likesQuery.isError) {
			setOptimisticLike(0);
			setIsLiking(false);
		}
	}, [likesQuery.data, likesQuery.isError]);

	const handleLike = async () => {
		if (fidForLike && signerPrivateKey && !isLiking) {
			setIsLiking(true);
			setOptimisticLike(1);
			try {
				await likeCast(
					fidForLike,
					`0x${signerPrivateKey.replace("0x", "")}`,
					{
						fid: cast.user.fid,
						hash: cast.hash,
					},
					"Like",
				);
				void likesQuery.refetch();
			} catch (error) {
				console.error("Failed to like cast:", error);
				setOptimisticLike(0);
				setIsLiking(false);
			}
		} else {
			openUrl(warpcastUrl(cast));
		}
	};

	const handleUnlike = async () => {
		if (fidForLike && signerPrivateKey && !isLiking) {
			setIsLiking(true);
			setOptimisticLike(-1);
			try {
				await likeCast(
					fidForLike,
					`0x${signerPrivateKey.replace("0x", "")}`,
					{
						fid: cast.user.fid,
						hash: cast.hash,
					},
					"Unlike",
				);
				void likesQuery.refetch();
			} catch (error) {
				console.error("Failed to unlike cast:", error);
				setOptimisticLike(0);
				setIsLiking(false);
			}
		} else {
			openUrl(warpcastUrl(cast));
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
				<i className="ri-chat-4-line">
					<span className="font-mono ml-1">
						{numReplies > 99 ? "99+" : numReplies > 0 ? numReplies : ""}
					</span>
				</i>

				<button
					type="button"
					className={`btn btn-sm btn-ghost text-sm ${textColor}`}
					onClick={() => openUrl(warpcastUrl(cast))}
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
					onClick={haveILikedFrfr ? handleUnlike : handleLike}
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

				<button
					type="button"
					className={`btn btn-sm btn-ghost text-sm ${textColor}`}
					onClick={() => openUrl(warpcastUrl(cast))}
				>
					<i className="ri-share-2-line" />
				</button>
			</div>
		</div>
	);
};
