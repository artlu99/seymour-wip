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

	return (
		<div className="card-footer bg-base-100 text-center mr-8">
			<div className="flex justify-between items-center">
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => composeCast(cast.user.fid, cast.hash)}
				>
					<i className="ri-chat-4-line" />
				</button>
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => openUrl(warpcastUrl)}
				>
					<i className="ri-loop-left-line" />
				</button>
				<button
					type="button"
					className="btn btn-sm btn-ghost text-sm text-base-content/50"
					onClick={() => openUrl(warpcastUrl)}
				>
					<i className="ri-heart-line" />
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
