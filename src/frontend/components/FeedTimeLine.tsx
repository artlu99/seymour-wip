import type { HydratedCast } from "../types";
import { CastOrReply } from "./CastOrReply";
import SpringTransition from "./effects/SpringTransition";

export const FeedTimeLine = (data: { casts: HydratedCast[] }) => {
	return (
		<SpringTransition isActive={true}>
			{data.casts.map((cast) => (
				<CastOrReply key={cast.hash} cast={cast} />
			))}
		</SpringTransition>
	);
};
