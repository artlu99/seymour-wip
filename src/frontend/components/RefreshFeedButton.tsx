import { useRefreshFeed } from "../hooks/queries/useShimQuery";
import { useLocalStorageZustand } from "../hooks/use-zustand";

export const RefreshFeedButton = () => {
	const { fids } = useLocalStorageZustand();

	const mutation = useRefreshFeed();

	return (
		<>
			<div className="p-4">
				<button
					type="button"
					onClick={() => mutation.mutate({ fids })}
					disabled={mutation.isPending}
					className="btn btn-primary btn-sm"
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
		</>
	);
};
