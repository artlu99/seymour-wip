import { useMemo } from "preact/hooks";
import { FeedTimeLine } from "../components/FeedTimeLine";
import {
	useKeccersFeed,
	useRefreshFeed,
	useUsernameQuery,
} from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand } from "../hooks/use-zustand";

const Landing = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();
	const { fids } = useLocalStorageZustand();

	const usernameQuery = useUsernameQuery(fids[0]);
	const keccersFeedQuery = useKeccersFeed(fids);
	const mutation = useRefreshFeed();

	const username = useMemo(() => usernameQuery.data, [usernameQuery.data]);
	const preTagline = useMemo(() => {
		if (fids.length === 1) {
			return "all ";
		}
		return "the ";
	}, [fids]);
	const tagline = useMemo(() => {
		if (fids.length === 1) {
			return ", all the time";
		}
		return ` and ${fids.length - 1} frens feed`;
	}, [fids]);

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
					<div className="text-xl font-bold">
						The {username?.replace(".eth", "")} Feed
					</div>
					{preTagline}
					<button
						type="button"
						className="btn btn-link"
						onClick={() => viewProfile(fids[0])}
					>
						@{username}
					</button>
					{tagline}
				</div>

				<div className="p-4">
					<button
						type="button"
						onClick={() => mutation.mutate({ fids })}
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
