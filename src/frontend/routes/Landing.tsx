import { useCallback, useRef } from "react";
import { FeedTimeLine } from "../components/FeedTimeLine";
import { RefreshFeedStatus } from "../components/RefreshFeedStatus";
import { useKeccersFeed } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand } from "../hooks/use-zustand";

const Landing = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();
	const { fids } = useLocalStorageZustand();
	const keccersFeedQuery = useKeccersFeed(fids);
	const observerRef = useRef<IntersectionObserver | null>(null);

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

	const allCasts =
		keccersFeedQuery.data?.pages.flatMap((page) => page.casts) ?? [];

	return (
		<div className="flex flex-col text-center gap-4 pb-128" data-theme={name}>
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

				<RefreshFeedStatus />

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
