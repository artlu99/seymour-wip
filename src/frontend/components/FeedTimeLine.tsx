import type { HydratedCast } from "../types";
import { CastOrReply } from "./CastOrReply";
import SpringTransition from "./effects/SpringTransition";
import { useLocalStorageZustand } from "../hooks/use-zustand";

export const FeedTimeLine = (data: { casts: HydratedCast[] }) => {
	const { showCardView } = useLocalStorageZustand();

	return (
		<SpringTransition isActive={true}>
			{data.casts.map((cast) => (
				<CastOrReply key={cast.hash} cast={cast} showCardView={showCardView} />
			))}
		</SpringTransition>
	);
};
