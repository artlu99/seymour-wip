import { useMemo } from "preact/hooks";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import type { HydratedCast } from "../types";

interface CastOrReplyProps {
	cast: HydratedCast;
}

export const CastOrReply = ({ cast }: CastOrReplyProps) => {
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
						options = {{silentError: true}}
					/>
					<FarcasterEmbed
						username={cast.user.username ?? undefined}
						hash={cast.hash}
						options = {{silentError: true}}
					/>
				</>
			);
		}
		return (
			<FarcasterEmbed
				username={cast.user.username ?? undefined}
				hash={cast.hash}
				options = {{silentError: true}}
			/>
		);
	}, [
		isReply,
		usernameQuery.data,
		cast.parentCastId?.hash,
		cast.user.username,
		cast.hash,
	]);

	return (
		<div className="card card-border bg-base-100 w-full ml-2 my-4 mx-auto">
			<div className="card-body text-left">{content}</div>
		</div>
	);
};
