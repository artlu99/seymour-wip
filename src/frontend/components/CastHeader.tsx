import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { ClickableDateSpan } from "./ClickableDateSpan";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

interface CastHeaderProps {
	cast: HydratedCast;
	verb: string;
	onProfileClick: (fid: number) => void;
}

export const CastHeader = ({ cast, verb, onProfileClick }: CastHeaderProps) => {
	const { showPfpAndDisplayName, showPurpleCheck } = useLocalStorageZustand();
	const displayName =
		cast.user.displayName ?? cast.user.username ?? "display name";

	return (
		<h4 className="flex flex-col items-start text-sm font-normal text-base-content/80 md:flex-row lg:items-center">
			<span
				className={`flex-1 ${showPfpAndDisplayName ? "" : "text-base-content/50"}`}
			>
				<span
					className={`leading-6 ${showPfpAndDisplayName ? "font-medium text-base-content/90" : "text-base-content/50"}`}
					onClick={() => onProfileClick(cast.user.fid)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onProfileClick(cast.user.fid);
						}
					}}
				>
					{showPfpAndDisplayName ? displayName : cast.user.username}
				</span>{" "}
				{showPurpleCheck && (cast.user.proNft?.order ?? 0) > 0 ? (
					<span className="font-bold text-lg text-purple-700 dark:text-purple-500">
						✓{" "}
					</span>
				) : null}
				{verb} {cast.channel ? ` in ${cast.channel.name}` : ""}
				{showPfpAndDisplayName && cast.channel && (
					<div className="inline-flex items-center h-4 mx-1">
						<img
							src={cast.channel?.imageUrl ?? fallbackPfp}
							alt={cast.channel?.name ?? "channel name"}
							className="w-4 h-4 rounded-sm opacity-50"
						/>
					</div>
				)}
				{cast.sentBy && ` (via ${cast.sentBy}) `} :
				<span className="mx-2 text-xs font-normal text-base-content/50">
					<ClickableDateSpan timestamp={cast.timestamp} />
				</span>
			</span>
		</h4>
	);
};
