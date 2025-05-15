import { useRefreshFeed } from "../hooks/queries/useShimQuery";

export const RefreshFeedStatus = () => {
	const mutation = useRefreshFeed();

	return (
		<div className="p-4 text-center">
			{mutation.isError && (
				<span className="text-error text-sm">Failed to refresh feed</span>
			)}

			{mutation.isSuccess && (
				<span className="text-success text-sm">
					Refreshed: {mutation.data.totalFids} fids,{" "}
					{mutation.data.totalNewCasts} new casts
				</span>
			)}
		</div>
	);
};
