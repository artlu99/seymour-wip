import { motion } from "framer-motion";
import type { HydratedCast } from "../types";
import { SimpleCastView } from "./SimpleCastView";

export const FeedTimeLine = ({ casts }: { casts: HydratedCast[] }) => {
	return (
		<div className="text-left">
			<ul
				aria-label="Feed"
				role="feed"
				className="relative flex flex-col list-none before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-base-content/10"
			>
				{casts?.map((cast, idx) => (
					<motion.li
						key={`cast-${cast.hash}`}
						className="relative"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							type: "spring",
							stiffness: 260,
							damping: 26,
							delay: Math.min(idx * 0.04, 0.4),
						}}
					>
						<SimpleCastView cast={cast} />
					</motion.li>
				))}
			</ul>
		</div>
	);
};
