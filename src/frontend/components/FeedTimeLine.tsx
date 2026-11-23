import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "preact/hooks";
import { navigate } from "wouter/use-browser-location";
import { useCastDeletes } from "../hooks/use-cast-deletes";
import { useSpamScores } from "../hooks/queries/useSpamQuery";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { visibleFeedCasts } from "../lib/article";
import type { HydratedCast } from "../types";
import { SimpleCastView } from "./SimpleCastView";

export const FeedTimeLine = ({ casts }: { casts: HydratedCast[] }) => {
	const { showPfpAndDisplayName, reverseSort } = useLocalStorageZustand();
	const zen = !showPfpAndDisplayName;
	// Reverse only the rendered rows, not the input: visibleFeedCasts assumes
	// newest-first arrival order to pick article-chain anchors.
	const visible = visibleFeedCasts(casts ?? []);
	const rows = reverseSort ? [...visible].reverse() : visible;
	const spam = useSpamScores(casts);

	const { hasSigner, canDeleteCast, deleteCasts, deletingCastHashes } =
		useCastDeletes();
	const [batchMode, setBatchMode] = useState(false);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [isSending, setIsSending] = useState(false);
	const [failedCount, setFailedCount] = useState(0);

	const exitBatch = () => {
		setBatchMode(false);
		setSelected(new Set());
		setFailedCount(0);
	};

	const toggleSelected = (hash: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(hash)) next.delete(hash);
			else next.add(hash);
			return next;
		});
	};

	const handleBatchDelete = async () => {
		if (selected.size === 0 || isSending) return;
		if (
			!window.confirm(
				`Delete ${selected.size} cast${selected.size === 1 ? "" : "s"}? This cannot be undone.`,
			)
		) {
			return;
		}
		setIsSending(true);
		setFailedCount(0);
		const results = await deleteCasts([...selected]);
		const failed = results.filter((r) => !r.ok);
		setIsSending(false);
		if (failed.length > 0) {
			// Keep the failed ones selected for a retry; report the damage.
			setSelected(new Set(failed.map((r) => r.hash)));
			setFailedCount(failed.length);
		} else {
			exitBatch();
		}
	};

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
					const clamped = Math.max(0, Math.min(next, Math.max(rows.length, 1) - 1));
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
	}, [rows.length, currentIdx]);

	return (
		<div className="text-left">
			{hasSigner && !batchMode && (
				<div className="flex justify-end mb-1">
					<button
						type="button"
						className="btn btn-ghost btn-xs text-base-content/40"
						onClick={() => setBatchMode(true)}
					>
						<i className="ri-delete-bin-line" />
						Select
					</button>
				</div>
			)}
			<ul
				aria-label="Feed"
				role="feed"
				className={`relative flex min-w-0 flex-col list-none ${
					zen
						? ""
						: "before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-base-content/10"
				}`}
			>
				{rows.map((cast, idx) => (
					<motion.li
						key={`cast-${cast.hash}`}
						ref={(el) => {
							itemRefs.current[idx] = el;
						}}
						aria-posinset={idx + 1}
						className={`relative min-w-0 max-w-full transition rounded-box ${
							idx === currentIdx ? "bg-base-content/5" : ""
						} ${
							deletingCastHashes.includes(cast.hash)
								? "opacity-40 grayscale pointer-events-none"
								: ""
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
						{batchMode && canDeleteCast(cast) && (
							<input
								type="checkbox"
								className="checkbox checkbox-sm checkbox-primary absolute top-3 right-3 z-10"
								aria-label="Select cast for deletion"
								checked={selected.has(cast.hash)}
								onChange={() => toggleSelected(cast.hash)}
							/>
						)}
						<SimpleCastView cast={cast} spam={spam.data} />
					</motion.li>
				))}
			</ul>
			{batchMode && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-box bg-base-200/95 backdrop-blur-md px-4 py-2 shadow-lg border border-base-content/10">
					{isSending ? (
						<>
							<span className="loading loading-spinner loading-sm" />
							<span className="text-sm">Deleting…</span>
						</>
					) : (
						<>
							{failedCount > 0 && (
								<span className="text-xs text-error">
									{failedCount} failed
								</span>
							)}
							<span className="font-mono text-sm">
								{selected.size} selected
							</span>
							<button
								type="button"
								className="btn btn-error btn-sm"
								disabled={selected.size === 0}
								onClick={handleBatchDelete}
							>
								Delete
							</button>
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								onClick={exitBatch}
							>
								Cancel
							</button>
						</>
					)}
				</div>
			)}
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
