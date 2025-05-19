import type { HydratedCast } from "../types";
import { ClickableDateSpan } from "./ClickableDateSpan";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

interface CastHeaderProps {
	cast: HydratedCast;
	verb: string;
	onProfileClick: (fid: number) => void;
}

export const CastHeader = ({ cast, verb, onProfileClick }: CastHeaderProps) => (
	<h4 className="flex flex-col items-start text-sm font-normal text-base-content/80 md:flex-row lg:items-center">
		<span className="flex-1">
			<span
				className="text-base font-medium leading-6 text-base-content/90"
				onClick={() => onProfileClick(cast.user.fid)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						onProfileClick(cast.user.fid);
					}
				}}
			>
				{cast.user.displayName ?? cast.user.username ?? "display name"}
			</span>{" "}
			{verb} {cast.channel ? ` in ${cast.channel.name}` : ""}
			{cast.channel && (
				<img
					src={cast.channel?.imageUrl ?? fallbackPfp}
					alt={cast.channel?.name ?? "channel name"}
					className="w-4 h-4 rounded-sm inline align-text-bottom mx-1 translate-y-7 opacity-50"
				/>
			)}{" "}{cast.sentBy && `(via ${cast.sentBy})`}
		</span>
		<span className="text-xs font-normal text-base-content/50">
			<ClickableDateSpan timestamp={cast.timestamp} />
		</span>
	</h4>
);
