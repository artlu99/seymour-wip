import { useMemo } from "preact/hooks";
import { Link, useLocation } from "wouter";
import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { ThemeSelectorDropdown } from "./ThemeSelectorDropdown";

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
				<Link href="/">
					<div className="btn btn-block btn-ghost text-md">
						🪴 Feed Me, Seymour
					</div>
				</Link>
			</div>
			<div className="navbar-center">
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
				<ThemeSelectorDropdown />

				{isActive("/uses") ? (
					<Link href="/">
						<div className="btn btn-square btn-ghost text-md w-16">home</div>
					</Link>
				) : (
					<Link href="/uses">
						<div className="btn btn-square btn-ghost text-md w-16">/uses</div>
					</Link>
				)}
			</div>
		</div>
	);
};

export default NavBar;
