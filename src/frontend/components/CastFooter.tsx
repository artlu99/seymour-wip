import { motion } from "framer-motion";
import { useState } from "preact/hooks";
import { useCastCountsQuery } from "../hooks/queries/useCountsQuery";
import { useReactionsQuery } from "../hooks/queries/useHubQuery";
import { useInViewOnce } from "../hooks/use-in-view-once";
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
	const footerRef = useInViewOnce<HTMLDivElement>();

	const zen = zenProp ?? !showPfpAndDisplayName;

	// The hub like-list exists only for the heart's own state
	// (haveILikedFrfr), which only matters when there's a signer to like
	// with — counts themselves hydrate below from the public endpoint.
	const fidForLike = signerFid;
	const likesQuery = useReactionsQuery(cast.user.fid, cast.hash, "Like", {
		enabled: !!signerPrivateKey,
	});
	const likes = likesQuery.data?.allReactionsData[cast.hash] ?? [];
	const haveILikedFrfr =
		signerPrivateKey && likes.length > 0
			? likes.includes(fidForLike ?? 0)
			: false;

	// Like/recast/reply counts hydrate eventually from the public
	// farcaster.tv endpoint (the one react-farcaster-embed completes its
	// cards with): deduped per cast, fetched once this footer scrolls near
	// the viewport, and skipped entirely in Zen mode — Zen hides the
	// numbers, so nothing is fetched for them.
	const counts = useCastCountsQuery(
		cast.user.fid,
		cast.user.username,
		cast.hash,
		{ enabled: !zen && footerRef.inView },
	);

	const optimisticCount =
		optimisticLike > 0 && !haveILikedFrfr
			? 1
			: optimisticLike < 0 && haveILikedFrfr
				? -1
				: 0;
	const numLikes = (counts.data?.likes ?? 0) + optimisticCount;
	const likeIndicator =
		// has not unliked
		optimisticLike >= 0 &&
		// has liked
		(optimisticLike > 0 || haveILikedFrfr);

	// Optimistic state resets deterministically at the end of each action —
	// not via a data-identity effect, which never fires when a refetch
	// comes back deep-equal (read hub racing the write hub). The optimistic
	// delta is held until both refetches settle, so the number never dips
	// while the heart state (fast hub) and the count (slower indexer)
	// disagree mid-flight.
	const settleLike = async () => {
		await likesQuery.refetch();
		if (!zen) await counts.refetch();
		setOptimisticLike(0);
		setIsLiking(false);
	};

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
				await settleLike();
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
				await settleLike();
			} catch (error) {
				console.error("Failed to unlike cast:", error);
				setOptimisticLike(0);
				setIsLiking(false);
			}
		} else {
			openUrl(warpcastUrl(cast));
		}
	};

	const numRecasts = counts.data?.recasts ?? 0;
	const numReplies = counts.data?.replies ?? 0;
	// Zen mode is the minimalist read: glyphs only, no numbers at all.
	const fmtCount = (n: number) =>
		zen ? "" : n > 99 ? "99+" : n > 0 ? String(n) : "";
	const textColor = zen ? "text-base-content/30" : "text-base-content/50";

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
		<div
			ref={footerRef.ref}
			className={zen ? "mt-1.5" : "card-footer bg-base-100 mt-1"}
		>
			<div className="flex justify-start gap-5 items-center">
				{replyBtn}
				{recastBtn}
				{likeBtn}
				{shareBtn}
			</div>
		</div>
	);
};
