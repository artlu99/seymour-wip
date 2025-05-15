import { useState } from "preact/hooks";
import { useCastIdQuery } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { CastContent } from "./CastContent";
import { CastHeader } from "./CastHeader";
import { CastOrReply } from "./CastOrReply";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

interface SimpleCastViewProps {
	cast: HydratedCast;
}

export const SimpleCastView = ({ cast }: SimpleCastViewProps) => {
	const [showCard, setShowCard] = useState(false);
	const { showCardView } = useLocalStorageZustand();
	const { openUrl, viewProfile } = useFrameSDK();

	const { data: parentCast } = useCastIdQuery(
		cast?.parentCastId?.fid,
		cast?.parentCastId?.hash,
	);

	const firstCast = parentCast ?? cast;
	const isReply = !!cast.parentCastId;
	const verb = isReply ? "replied" : "wrote";

	const readyToRenderReply = isReply && !!parentCast;

	if (showCardView || showCard) {
		return <CastOrReply cast={cast} />;
	}

	const renderCast = (cast: HydratedCast, verb: string) => (
		<li className="relative pl-6">
			<article className="flex flex-col flex-1 gap-2 text-base-content">
				<span className="absolute z-10 inline-flex items-center justify-center w-6 h-6 text-base-content rounded-full -left-3 ring-2 ring-base-100">
					<img
						src={cast.user.pfpUrl ?? fallbackPfp}
						alt={cast.user.username ?? "user name"}
						title={
							cast.user.displayName ?? cast.user.username ?? "display name"
						}
						width="48"
						height="48"
						className="max-w-full rounded-full aspect-square"
						onClick={() => viewProfile(cast.user.fid)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								viewProfile(cast.user.fid);
							}
						}}
					/>
				</span>
				<CastHeader cast={cast} verb={verb} onProfileClick={viewProfile} />
				<CastContent
					cast={cast}
					onUrlClick={openUrl}
					onShowCardClick={() => setShowCard(true)}
				/>
			</article>
		</li>
	);

	return (
		<>
			{renderCast(firstCast, verb)}
			{readyToRenderReply && (
				<li className="relative pl-6">
					<ul className="relative flex flex-col gap-12 py-12 pl-6 before:absolute before:top-6 before:left-6 before:bottom-6 before:-translate-x-1/2 before:border before:border-dashed before:border-base-content/10 after:absolute after:top-12 after:left-6 after:bottom-12 after:-translate-x-1/2 after:border after:border-base-content/10 list-none">
						{renderCast(cast, "replied")}
					</ul>
				</li>
			)}
		</>
	);
};
