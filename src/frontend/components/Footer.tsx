import { useMemo } from "preact/hooks";
import {
	useRefreshFeed,
	useUsernameQuery,
} from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand } from "../hooks/use-zustand";

export const Footer = () => {
	const { viewProfile } = useFrameSDK();
	const { fids } = useLocalStorageZustand();

	const usernameQuery = useUsernameQuery(fids[0]);
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
		<footer className="footer footer-center p-4 bg-base-100 text-base-content fixed bottom-0 w-full">
			<div className="flex items-center gap-2">
				<div className="p-4">
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
			</div>
		</footer>
	);
};
