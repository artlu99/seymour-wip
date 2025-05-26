import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "preact/hooks";
import { FeedTimeLine } from "../components/FeedTimeLine";
import { RefreshFeedStatus } from "../components/RefreshFeedStatus";
import { useBlocksQuery } from "../hooks/queries/useOpenQuery";
import { useKeccersFeed, useRefreshFeed } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand, useZustand } from "../hooks/use-zustand";

const TOUCH_PULL_THRESHOLD = 60; // Standard pull-to-refresh threshold for touch
const MOUSE_PULL_THRESHOLD = 10; // Lower threshold for mouse interactions

const Landing = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();
	const { feedFids: fids } = useLocalStorageZustand();

	const keccersFeedQuery = useKeccersFeed(fids);
	const { data: blocks } = useBlocksQuery(contextFid);
	const refreshMutation = useRefreshFeed();

	const observerRef = useRef<IntersectionObserver | null>(null);
	const [pullDistance, setPullDistance] = useState(0);
	const [isPulling, setIsPulling] = useState(false);
	const [isMouseInteraction, setIsMouseInteraction] = useState(false);
	const startYRef = useRef<number | null>(null);

	const { setHasFirstLoadCompleted } = useZustand();

	useEffect(() => {
		if (keccersFeedQuery.isFetchedAfterMount) {
			setHasFirstLoadCompleted(true);
		}
	}, [keccersFeedQuery.isFetchedAfterMount, setHasFirstLoadCompleted]);

	const loadMoreRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (observerRef.current) observerRef.current.disconnect();
			observerRef.current = new IntersectionObserver((entries) => {
				if (
					entries[0].isIntersecting &&
					keccersFeedQuery.hasNextPage &&
					!keccersFeedQuery.isFetchingNextPage
				) {
					keccersFeedQuery.fetchNextPage();
				}
			});
			if (node) observerRef.current.observe(node);
		},
		[keccersFeedQuery],
	);

	const handleStart = useCallback((clientY: number, isMouse: boolean) => {
		if (window.scrollY === 0) {
			startYRef.current = clientY;
			setIsPulling(true);
			setIsMouseInteraction(isMouse);
		}
	}, []);

	const handleMove = useCallback(
		(clientY: number) => {
			if (!startYRef.current || !isPulling) return;

			const pullDistance = Math.max(0, clientY - startYRef.current);
			setPullDistance(pullDistance);
		},
		[isPulling],
	);

	const handleEnd = useCallback(() => {
		if (!startYRef.current || !isPulling) return;

		const threshold = isMouseInteraction
			? MOUSE_PULL_THRESHOLD
			: TOUCH_PULL_THRESHOLD;
		if (pullDistance > threshold) {
			refreshMutation.mutate({ fids });
			window.scrollTo({ top: 0, behavior: "smooth" });
		}

		setPullDistance(0);
		setIsPulling(false);
		setIsMouseInteraction(false);
		startYRef.current = null;
	}, [isPulling, pullDistance, refreshMutation, fids, isMouseInteraction]);

	// Touch event handlers
	const handleTouchStart = useCallback(
		(e: TouchEvent) => {
			handleStart(e.touches[0].clientY, false);
		},
		[handleStart],
	);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			handleMove(e.touches[0].clientY);
		},
		[handleMove],
	);

	// Mouse event handlers
	const handleMouseDown = useCallback(
		(e: MouseEvent) => {
			handleStart(e.clientY, true);
		},
		[handleStart],
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			handleMove(e.clientY);
		},
		[handleMove],
	);

	useEffect(() => {
		// Touch events
		document.addEventListener("touchstart", handleTouchStart);
		document.addEventListener("touchmove", handleTouchMove);
		document.addEventListener("touchend", handleEnd);
		document.addEventListener("touchcancel", handleEnd);

		// Mouse events
		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleEnd);
		document.addEventListener("mouseleave", handleEnd);

		return () => {
			// Clean up touch events
			document.removeEventListener("touchstart", handleTouchStart);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleEnd);
			document.removeEventListener("touchcancel", handleEnd);

			// Clean up mouse events
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleEnd);
			document.removeEventListener("mouseleave", handleEnd);
		};
	}, [
		handleTouchStart,
		handleTouchMove,
		handleMouseDown,
		handleMouseMove,
		handleEnd,
	]);

	const rawCasts =
		keccersFeedQuery.data?.pages.flatMap((page) => page.casts) ?? [];

	const allCasts = useMemo(() => {
		return rawCasts.filter((c) => {
			const isBlocked = (blocks?.blockedFids ?? []).includes(c.user.fid);
			const repliesToBlockedUser =
				c.parentCastId?.fid && blocks?.blockedFids.includes(c.parentCastId.fid);
			const quotesBlockedUser =
				c.embeds.filter(
					(e) => e.castId?.fid && blocks?.blockedFids.includes(e.castId.fid),
				).length > 0;
			const mentionsBlockedUser =
				c.mentions.filter((m) => blocks?.blockedFids.includes(m)).length > 0;
			return (
				!isBlocked &&
				!repliesToBlockedUser &&
				!quotesBlockedUser &&
				!mentionsBlockedUser
			);
		});
	}, [rawCasts, blocks]);

	const threshold = isMouseInteraction
		? MOUSE_PULL_THRESHOLD
		: TOUCH_PULL_THRESHOLD;
	const pullProgress = Math.min(pullDistance / threshold, 1);

	return (
		<div className="flex flex-col text-center gap-4 pb-128" data-theme={name}>
			<article className="prose dark:prose-invert">
				It appears you are not
				<br /> a paid subscriber.
				<br />
				<br />
				The mini app is free to the public
				<br />
				for a limited time.
			</article>

			<article className="prose dark:prose-invert">
				{contextFid ? (
					<div className="p-4 text-sm">
						GM,
						<button
							type="button"
							className="btn btn-link"
							onClick={() => viewProfile(contextFid)}
						>
							{contextName}
						</button>
					</div>
				) : null}

				<div
					className="relative"
					style={{
						transform: `translateY(${pullDistance}px)`,
						transition: isPulling ? "none" : "transform 0.3s ease-out",
					}}
				>
					<RefreshFeedStatus />
					{(isPulling || refreshMutation.isPending) && (
						<div className="absolute top-0 left-0 right-0 flex justify-center items-center h-16">
							<div
								className="loading loading-spinner loading-md"
								style={{
									opacity: isPulling ? pullProgress : 1,
									transform: isPulling
										? `rotate(${pullProgress * 360}deg)`
										: undefined,
									transition: "transform 0.1s linear",
								}}
							/>
						</div>
					)}
				</div>

				{keccersFeedQuery.isLoading ? (
					<div className="skeleton w-3/4 h-96 mx-auto" />
				) : allCasts.length > 0 ? (
					<>
						<FeedTimeLine casts={allCasts} />
						<div
							ref={loadMoreRef}
							className="h-10 flex items-center justify-center"
						>
							{keccersFeedQuery.isFetchingNextPage && (
								<span className="loading loading-spinner loading-md" />
							)}
						</div>
					</>
				) : null}
			</article>
		</div>
	);
};

export default Landing;
