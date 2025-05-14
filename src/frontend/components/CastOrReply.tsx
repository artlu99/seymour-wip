import { useMemo, useState } from "preact/hooks";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import type { HydratedCast } from "../types";
import { ClickableDateSpan } from "./ClickableDateSpan";

interface CastOrReplyProps {
	cast: HydratedCast;
	showCardView: boolean;
}

const SimpleCastView = ({ cast }: { cast: HydratedCast }) => {
	return (
		<div>
			<div className="flex flex-row justify-between">
				<div className="flex flex-row items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
					<img
						src={cast.user.pfpUrl ?? undefined}
						className="w-5 h-5 rounded-full ring-1 ring-gray-200 hover:ring-gray-300 transition-all"
						alt={cast.user.displayName ?? undefined}
					/>
					<span className="font-medium">{cast.user.displayName}</span>
				</div>
				<ClickableDateSpan timestamp={cast.timestamp} />
			</div>
			<div>{cast.text}</div>
		</div>
	);
};

export const CastOrReply = ({ cast, showCardView }: CastOrReplyProps) => {
	const [displayCard, setDisplayCard] = useState(false);

	const isReply = !!cast.parentCastId;
	const usernameQuery = useUsernameQuery(
		isReply ? cast.parentCastId?.fid : undefined,
	);

	const content = useMemo(() => {
		if (isReply && usernameQuery.data) {
			return (
				<>
					<FarcasterEmbed
						username={usernameQuery.data}
						hash={cast.parentCastId.hash}
					/>
					<FarcasterEmbed
						username={cast.user.username ?? undefined}
						hash={cast.hash}
					/>
				</>
			);
		}
		return (
			<FarcasterEmbed
				username={cast.user.username ?? undefined}
				hash={cast.hash}
			/>
		);
	}, [
		isReply,
		usernameQuery.data,
		cast.parentCastId?.hash,
		cast.user.username,
		cast.hash,
	]);

	return showCardView || displayCard ? (
		<div className="card card-border bg-base-100 w-full ml-2 my-4 mx-auto">
			<div className="card-body text-left">{content}</div>
		</div>
	) : (
		<div className="card bg-base-100 w-full ml-2 my-4 mx-auto">
			<div className="card-body text-left">
				<SimpleCastView cast={cast} />
			</div>
		</div>
	);
};
