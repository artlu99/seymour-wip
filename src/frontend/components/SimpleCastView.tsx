import { useState } from "preact/hooks";
import { useCastIdQuery } from "../hooks/queries/useShimQuery";
import type { SpamScores } from "../hooks/queries/useSpamQuery";
import { useProfiles } from "../hooks/use-profiles";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { warpcastUrl } from "../lib/common";
import type { HydratedCast } from "../types";
import { CastContent } from "./CastContent";
import { CastFooter } from "./CastFooter";
import { CastHeader } from "./CastHeader";
import { CastOrReply } from "./CastOrReply";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

interface SimpleCastViewProps {
	cast: HydratedCast;
	spam?: SpamScores;
}

export const SimpleCastView = ({ cast, spam }: SimpleCastViewProps) => {
	const [showCard, setShowCard] = useState(false);
	const { showCardView, showPfpAndDisplayName } = useLocalStorageZustand();
	const { viewProfile, openUrl } = useProfiles();

	const { data: parentCast } = useCastIdQuery(
		cast?.parentCastId?.fid,
		cast?.parentCastId?.hash,
	);

	const zen = !showPfpAndDisplayName;
	const isReply = !!cast.parentCastId;
	const readyToRenderReply = isReply && !!parentCast;
	const hasEmbeds = cast.embeds.length > 0;

	// Card view swaps the whole row for the library's react-farcaster-embed
	// card — its native embed handling covers images, videos, link cards and
	// quoted casts, none of which Seymour re-implements.
	if (showCardView || showCard) {
		return <CastOrReply cast={cast} />;
	}

	return (
		<article
			className={`relative py-3 text-base-content ${
				zen ? "border-b border-base-content/10" : ""
			}`}
		>
			{!zen && (
				<img
					src={cast.user.pfpUrl ?? fallbackPfp}
					alt={cast.user.username ?? "user name"}
					title={cast.user.displayName ?? cast.user.username ?? "display name"}
					width="48"
					height="48"
					className="absolute left-0 top-3.5 w-8 h-8 rounded-full ring-2 ring-base-200 cursor-pointer"
					onClick={() => viewProfile(cast.user.fid)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							viewProfile(cast.user.fid);
						}
					}}
				/>
			)}
			<div className={zen ? "" : "pl-12"}>
				<CastHeader cast={cast} zen={zen} spam={spam} />
				{readyToRenderReply && (
					<button
						type="button"
						aria-label="View parent cast"
						className={`mt-1.5 w-full text-left border-l-2 border-base-content/15 rounded-r-lg bg-base-content/5 hover:bg-base-content/10 transition-colors px-2.5 py-1.5 ${
							zen ? "font-serif italic" : ""
						}`}
						onClick={() => openUrl(warpcastUrl(parentCast))}
					>
						<span className="block text-xs font-medium text-base-content/70">
							@{parentCast.user.username ?? parentCast.user.displayName}
						</span>
						<span className="block text-xs text-base-content/50 line-clamp-2">
							{parentCast.rawText}
						</span>
					</button>
				)}
				<CastContent cast={cast} zen={zen} />
				{hasEmbeds && (
					<button
						type="button"
						className="btn btn-xs btn-ghost text-base-content/50 border-base-content/15 mt-1.5"
						onClick={() => setShowCard(true)}
					>
						<i className="ri-attachment-line" />
						{cast.embeds.length} embed{cast.embeds.length > 1 ? "s" : ""} · show
						card
					</button>
				)}
				<CastFooter cast={cast} zen={zen} />
			</div>
		</article>
	);
};
