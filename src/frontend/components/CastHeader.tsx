import { Link } from "wouter";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { ClickableDateSpan } from "./ClickableDateSpan";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

interface CastHeaderProps {
	cast: HydratedCast;
}

export const CastHeader = ({ cast }: CastHeaderProps) => {
	const { showPfpAndDisplayName, showPurpleCheck } = useLocalStorageZustand();

	const displayName =
		cast.user.displayName ?? cast.user.username ?? "display name";
	const handle = cast.user.username ?? cast.user.displayName ?? "fid";

	return (
		<h4 className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-6 min-w-0">
			{showPfpAndDisplayName && (
				<Link
					to={`/${cast.user.username}`}
					className="no-underline font-semibold text-base-content/90"
				>
					{displayName}
				</Link>
			)}
			{showPurpleCheck && (cast.user.proNft?.order ?? 0) > 0 && (
				<span
					role="img"
					aria-label="verified"
					className="text-secondary font-bold text-base"
				>
					✓
				</span>
			)}
			<span className="text-xs text-base-content/45 truncate">
				<Link
					to={`/${cast.user.username}`}
					className="no-underline hover:text-base-content/70"
				>
					@{handle}
				</Link>{" "}
				·{" "}
				<span className="whitespace-nowrap">
					<ClickableDateSpan timestamp={cast.timestamp} />
				</span>
			</span>
			{cast.channel && (
				<span className="badge badge-accent badge-soft badge-xs gap-1 max-w-36">
					<img
						src={cast.channel.imageUrl ?? fallbackPfp}
						alt={cast.channel.name ?? "channel name"}
						className="w-3 h-3 rounded-sm"
					/>
					<span className="truncate font-medium">{cast.channel.name}</span>
				</span>
			)}
			{cast.sentBy && (
				<span className="text-xs text-base-content/35">via {cast.sentBy}</span>
			)}
		</h4>
	);
};
