import { useMemo } from "preact/hooks";
import {
	useRefreshFeed,
	useUsernameQuery,
} from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand, useZustand } from "../hooks/use-zustand";

const NavBar = () => {
	const { viewProfile } = useFrameSDK();
	const { feedFids: fids } = useLocalStorageZustand();
	const { isRefreshing, isScrollingUp } = useZustand();

	const mutation = useRefreshFeed();

	const usernameQuery = useUsernameQuery(fids[0]);

	const username = useMemo(() => usernameQuery.data, [usernameQuery.data]);
	const preTagline = useMemo(() => {
		if (fids.length === 1) {
			return "all ";
		}
		return "";
	}, [fids]);
	const tagline = useMemo(() => {
		if (fids.length === 1) {
			return ", all the time";
		}
		return ` + ${fids.length - 1} frens`;
	}, [fids]);

	const handleRefresh = () => {
		mutation.mutate({ fids });
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div
			className="sticky top-0 z-50 navbar bg-base-100 border-b border-base-200"
			style={{
				transform: isScrollingUp ? "translateY(0)" : "translateY(-100%)",
				transition: isScrollingUp ? "none" : "transform 300ms ease-out",
			}}
		>
			<div className="navbar-start">
				<div className="text-sm">
					{preTagline}
					<button
						type="button"
						className="link no-underline"
						onClick={() => viewProfile(fids[0])}
					>
						@{username?.replace(".eth", "")}
					</button>
					{tagline}
				</div>
			</div>

			<div className="navbar-end">
				<button
					type="button"
					className="btn btn-outline border-info/20 text-md"
					onClick={handleRefresh}
					disabled={isRefreshing}
				>
					{isRefreshing ? "Refreshing Feed..." : "Feed Me, Seymour 🪴"}
				</button>
			</div>
		</div>
	);
};

export default NavBar;
