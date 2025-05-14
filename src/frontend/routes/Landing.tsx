import { FeedTimeLine } from "../components/FeedTimeLine";
import { useKeccersFeed, useRefreshFeed } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";

const Landing = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();

	const keccersFeedQuery = useKeccersFeed();
	const mutation = useRefreshFeed();

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

				<div className="p-4">
					<div className="text-xl font-bold">Keccers Feed</div>
					all{" "}
					<button
						type="button"
						className="btn btn-link"
						onClick={() => viewProfile(4407)}
					>
						@keccers.eth
					</button>
					, all the time
				</div>

				<div className="p-4">
					<button
						type="button"
						onClick={() => mutation.mutate({ fids: [4407] })}
						disabled={mutation.isPending}
						className="btn btn-primary"
					>
						{mutation.isPending ? "Sending..." : "Refresh"}
					</button>
				</div>

				<div className="p-4">
					{mutation.isError ? "Error" : null}
					{mutation.isSuccess ? (
						<span className="text-success text-sm">
							Refreshed: {mutation.data.totalFids} fids,{" "}
							{mutation.data.totalCasts} casts
						</span>
					) : null}
				</div>
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
			</article>
		</div>
	);
};

export default Landing;
