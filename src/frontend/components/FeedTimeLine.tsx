import type { HydratedCast } from "../types";
import { CastOrReply } from "./CastOrReply";

export const FeedTimeLine = (data: { casts: HydratedCast[] }) => {
	return (
		<div className="py-4">
			{data.casts.map((cast) => (
				<CastOrReply key={cast.hash} cast={cast} />
			))}
		</div>
	);
};
