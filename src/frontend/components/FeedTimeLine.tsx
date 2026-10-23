import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "preact/hooks";
import { navigate } from "wouter/use-browser-location";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { SimpleCastView } from "./SimpleCastView";

export const FeedTimeLine = ({ casts }: { casts: HydratedCast[] }) => {
	const { showPfpAndDisplayName } = useLocalStorageZustand();
	const zen = !showPfpAndDisplayName;

	const [currentIdx, setCurrentIdx] = useState(0);
	const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				navigate("/~/feeds");
				return;
			}
			if (e.metaKey || e.ctrlKey || e.altKey) return;

			if (e.key === "j" || e.key === "k") {
				e.preventDefault();
				setCurrentIdx((idx) => {
					const next = e.key === "j" ? idx + 1 : idx - 1;
					const clamped = Math.max(0, Math.min(next, (casts?.length ?? 1) - 1));
					itemRefs.current[clamped]?.scrollIntoView({
						block: "center",
						behavior: "smooth",
					});
					return clamped;
				});
				return;
			}

			const actionTarget = (ariaLabel: string) => {
				const el = itemRefs.current[currentIdx]?.querySelector(
					`button[aria-label="${ariaLabel}"]`,
				);
				if (el instanceof HTMLElement) el.click();
			};

			if (e.key === "l") {
				actionTarget(
					itemRefs.current[currentIdx]?.querySelector(
						'button[aria-label="Unlike"]',
					)
						? "Unlike"
						: "Like",
				);
			} else if (e.key === "r") {
				actionTarget("Reply to cast");
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [casts?.length, currentIdx]);

	return (
		<div className="text-left">
			<ul
				aria-label="Feed"
				role="feed"
				className={`relative flex flex-col list-none ${
					zen
						? ""
						: "before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-base-content/10"
				}`}
			>
				{casts?.map((cast, idx) => (
					<motion.li
						key={`cast-${cast.hash}`}
						ref={(el) => {
							itemRefs.current[idx] = el;
						}}
						aria-posinset={idx + 1}
						className={`relative transition-colors rounded-box ${
							idx === currentIdx ? "bg-base-content/5" : ""
						}`}
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
			{zen && (
				<div className="mt-3 flex justify-center gap-3 font-mono text-[10px] text-base-content/35">
					<span>
						<kbd className="kbd kbd-xs">j</kbd>/
						<kbd className="kbd kbd-xs">k</kbd> move
					</span>
					<span>
						<kbd className="kbd kbd-xs">l</kbd> like
					</span>
					<span>
						<kbd className="kbd kbd-xs">r</kbd> reply
					</span>
					<span>
						<kbd className="kbd kbd-xs">⌘K</kbd> feeds
					</span>
				</div>
			)}
		</div>
	);
};
