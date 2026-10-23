import { useMemo, useState } from "preact/hooks";
import {
	useRefreshFeed,
	useUsernameQuery,
} from "../hooks/queries/useShimQuery";
import { useProfiles } from "../hooks/use-profiles";
import { useLocalStorageZustand, useZustand } from "../hooks/use-zustand";

const NavBar = () => {
	const { viewProfile } = useProfiles();
	const { feedFids: fids } = useLocalStorageZustand();
	const { isRefreshing, isScrollingUp } = useZustand();

	const mutation = useRefreshFeed();
	const [newCasts, setNewCasts] = useState<number | null>(null);

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
		mutation.mutate(
			{ fids },
			{
				onSuccess: (data) => {
					setNewCasts(data.totalNewCasts);
					window.setTimeout(() => setNewCasts(null), 6000);
				},
			},
		);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div
			className="sticky top-0 z-50 navbar bg-base-100/85 backdrop-blur-md border-b border-base-content/10"
			style={{
				transform: isScrollingUp ? "translateY(0)" : "translateY(-100%)",
				transition: isScrollingUp ? "none" : "transform 300ms ease-out",
			}}
		>
			<div className="navbar-start">
				<div className="flex flex-col items-start gap-1 text-sm min-w-0">
					<span className="truncate">
						{preTagline}
						<button
							type="button"
							className="link no-underline font-medium"
							onClick={() => viewProfile(fids[0])}
						>
							@{username?.replace(".eth", "")}
						</button>
						<span className="text-base-content/50">{tagline}</span>
					</span>
					{newCasts !== null && (
						<span className="badge badge-primary badge-soft badge-sm">
							↑ {newCasts} new casts
						</span>
					)}
				</div>
			</div>

			<div className="navbar-end">
				<button
					type="button"
					className="btn btn-primary btn-sm"
					onClick={handleRefresh}
					disabled={isRefreshing}
				>
					{isRefreshing ? (
						<span className="loading loading-spinner loading-xs" />
					) : (
						<span aria-hidden="true">🪴</span>
					)}
					Feed me
				</button>
			</div>
		</div>
	);
};

export default NavBar;
