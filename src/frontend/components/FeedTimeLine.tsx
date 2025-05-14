import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { CastOrReply } from "./CastOrReply";
import SpringTransition from "./effects/SpringTransition";

export const FeedTimeLine = ({ casts }: { casts: HydratedCast[] }) => {
	const { showCardView } = useLocalStorageZustand();

	return (
		<SpringTransition isActive={true}>
			{casts?.map((cast) => (
				<CastOrReply key={cast.hash} cast={cast} showCardView={showCardView} />
			))}
		</SpringTransition>
	);
};
