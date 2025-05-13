import { useThemes } from "../hooks/use-themes";
import { Link, useLocation } from "wouter";
import { ThemeSelectorDropdown } from "./ThemeSelectorDropdown";
const NavBar = () => {
	const [location] = useLocation();
	const isActive = (path: string) => location === path;
	const { name } = useThemes();
	return (
		<div className="navbar bg-base-100" data-theme={name}>
			<div className="navbar-start">
				<Link href="/">
					<div className="btn btn-block btn-ghost text-md">
						SPA Mini App Starter
					</div>
				</Link>
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
