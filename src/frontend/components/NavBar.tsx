import { useMemo } from "preact/hooks";
import { useLocation } from "wouter";
import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand } from "../hooks/use-zustand";

const NavBar = () => {
	const [location] = useLocation();
	const isActive = (path: string) => location === path;
	const { name } = useThemes();

	const { viewProfile } = useFrameSDK();
	const { fids } = useLocalStorageZustand();

	const usernameQuery = useUsernameQuery(fids[0]);

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
		<div className="navbar bg-base-100" data-theme={name}>
			<div className="navbar-start">
				<div className="text-sm">
					{preTagline}
					<button
						type="button"
						className="link no-underline"
						onClick={() => viewProfile(fids[0])}
					>
						@{username}
					</button>
					{tagline}
				</div>
			</div>
			<div className="navbar-end">
				<button
					type="button"
					className="btn btn-block btn-ghost text-md"
					disabled={false}
				>
					🪴 Feed Me, Seymour
				</button>
			</div>
		</div>
	);
};

export default NavBar;
