import { useState } from "preact/hooks";
import { useCastIdQuery } from "../hooks/queries/useShimQuery";
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
}

export const SimpleCastView = ({ cast }: SimpleCastViewProps) => {
	const [showCard, setShowCard] = useState(false);
	const { showCardView, showPfpAndDisplayName } = useLocalStorageZustand();
	const { viewProfile, openUrl } = useProfiles();

	const { data: parentCast } = useCastIdQuery(
		cast?.parentCastId?.fid,
		cast?.parentCastId?.hash,
	);

	const isReply = !!cast.parentCastId;
	const readyToRenderReply = isReply && !!parentCast;

	if (showCardView || showCard) {
		return <CastOrReply cast={cast} />;
	}

	return (
		<article className="relative py-3 text-base-content">
			{showPfpAndDisplayName ? (
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
			) : null}
			<div className="pl-12">
				<CastHeader cast={cast} />
				{readyToRenderReply && (
					<button
						type="button"
						aria-label="View parent cast"
						className="mt-1.5 w-full text-left border-l-2 border-base-content/15 rounded-r-lg bg-base-content/5 hover:bg-base-content/10 transition-colors px-2.5 py-1.5"
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
				<CastContent cast={cast} onShowCardClick={() => setShowCard(true)} />
				<CastFooter cast={cast} />
			</div>
		</article>
	);
};
