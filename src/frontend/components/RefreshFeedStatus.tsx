import { useRefreshFeed } from "../hooks/queries/useShimQuery";

export const RefreshFeedStatus = () => {
	const mutation = useRefreshFeed();

	return (
		<div className="p-4">
			{mutation.isError ? "Error" : null}
			{mutation.isSuccess ? (
				<span className="text-success text-sm">
					Refreshed: {mutation.data.totalFids} fids,{" "}
					{mutation.data.totalNewCasts} new casts
				</span>
			) : null}
		</div>
	);
};
