import { motion } from "framer-motion";
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
	zen?: boolean;
}
export const CastFooter = ({ cast, zen: zenProp }: CastFooterProps) => {
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

	const zen = zenProp ?? !showPfpAndDisplayName;
	const textColor = zen ? "text-base-content/30" : "text-base-content/50";
	const fmtCount = (n: number) => (n > 99 ? "99+" : n > 0 ? String(n) : "");

	const replyBtn = (
		<button
			type="button"
			aria-label="Reply to cast"
			className={
				zen
					? `font-mono text-xs ${textColor}`
					: `btn btn-sm btn-ghost text-sm ${textColor}`
			}
			onClick={() => openUrl(warpcastUrl(cast))}
		>
			{zen ? (
				<span aria-hidden="true">↩ {fmtCount(numReplies)}</span>
			) : (
				<i className="ri-chat-4-line">
					<span className="font-mono ml-1">{fmtCount(numReplies)}</span>
				</i>
			)}
		</button>
	);

	const recastBtn = (
		<button
			type="button"
			aria-label="Recast"
			className={
				zen
					? `font-mono text-xs ${textColor}`
					: `btn btn-sm btn-ghost text-sm ${textColor}`
			}
			onClick={() => openUrl(warpcastUrl(cast))}
		>
			{zen ? (
				<span aria-hidden="true">⇄ {fmtCount(numRecasts)}</span>
			) : (
				<i className="ri-loop-left-line">
					<span className="font-mono ml-1">{fmtCount(numRecasts)}</span>
				</i>
			)}
		</button>
	);

	const likeBtn = (
		<button
			type="button"
			aria-label={likeIndicator ? "Unlike" : "Like"}
			className={
				zen
					? `font-mono text-xs ${textColor}`
					: `btn btn-sm btn-ghost text-sm ${textColor}`
			}
			onClick={haveILikedFrfr ? handleUnlike : handleLike}
			disabled={isLiking}
		>
			{zen ? (
				<motion.span
					className={likeIndicator ? "text-error" : ""}
					animate={likeIndicator ? { scale: [1, 1.4, 1] } : { scale: 1 }}
					transition={{ type: "spring", stiffness: 400, damping: 12 }}
				>
					{likeIndicator ? "♥" : "♡"} {fmtCount(numLikes)}
				</motion.span>
			) : (
				<motion.i
					className={
						likeIndicator ? "ri-heart-fill text-error" : "ri-heart-line"
					}
					animate={likeIndicator ? { scale: [1, 1.4, 1] } : { scale: 1 }}
					transition={{ type: "spring", stiffness: 400, damping: 12 }}
				>
					<span className="font-mono ml-1">{fmtCount(numLikes)}</span>
				</motion.i>
			)}
		</button>
	);

	const shareBtn = (
		<button
			type="button"
			aria-label="Share cast"
			className={
				zen
					? `font-mono text-xs ${textColor}`
					: `btn btn-sm btn-ghost text-sm ${textColor}`
			}
			onClick={() => openUrl(warpcastUrl(cast))}
		>
			{zen ? (
				<span aria-hidden="true">↗</span>
			) : (
				<i className="ri-share-2-line" />
			)}
		</button>
	);

	return (
		<div className={zen ? "mt-1.5" : "card-footer bg-base-100 mt-1"}>
			<div className="flex justify-start gap-5 items-center">
				{replyBtn}
				{recastBtn}
				{likeBtn}
				{shareBtn}
			</div>
		</div>
	);
};
