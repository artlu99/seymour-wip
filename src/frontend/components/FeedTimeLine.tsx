import type { HydratedCast } from "../types";
import { SimpleCastView } from "./SimpleCastView";
import SpringTransition from "./effects/SpringTransition";

export const FeedTimeLine = ({ casts }: { casts: HydratedCast[] }) => {
	return (
		<SpringTransition isActive={true}>
			<div className="text-left">
				{/*<!-- WindUI Component: Nested user feed --> */}
				<ul
					aria-label="Nested sm user feed"
					role="feed"
					className="relative flex flex-col pl-6 before:absolute before:top-0 before:left-6 before:h-full before:-translate-x-1/2 before:border before:border-dashed before:border-slate-200 after:absolute after:top-6 after:left-6 after:bottom-6 after:-translate-x-1/2 after:border after:border-slate-200 list-none"
				>
					{casts?.map((cast) => (
						<SimpleCastView key={cast.hash} cast={cast} />
					))}
				</ul>
			</div>
		</SpringTransition>
	);
};
