import { FeedTimeLine } from "../components/FeedTimeLine";
import { RefreshFeedStatus } from "../components/RefreshFeedButton";
import { useKeccersFeed } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand } from "../hooks/use-zustand";

const Landing = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();
	const { fids } = useLocalStorageZustand();

	const keccersFeedQuery = useKeccersFeed(fids);

	return (
		<div className="flex flex-col text-center gap-4" data-theme={name}>
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

				<div className="p-4">
					{keccersFeedQuery.isRefetching ? (
						<span className="loading loading-spinner loading-lg" />
					) : null}
				</div>
				
				{keccersFeedQuery.isLoading ? (
					<div className="skeleton w-3/4 h-96 mx-auto" />
				) : keccersFeedQuery.data ? (
					<FeedTimeLine casts={keccersFeedQuery.data} />
				) : null}

				<div className="p-4">
					{keccersFeedQuery.isRefetching ? (
						<span className="loading loading-spinner loading-lg" />
					) : null}
				</div>
			</article>
		</div>
	);
};

export default Landing;
