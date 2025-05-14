import { Link, useLocation } from "wouter";
import { ThemeSelectorToggle } from "./ThemeToggleButton";

export const Dock = () => {
	const [location] = useLocation();
	const isActive = (path: string) => location === path;

	return (
		<div className="dock dock-xl">
			<button type="button" className={isActive("/") ? "dock-active" : ""}>
				<Link to="/">
					<i class="ri-home-4-line text-xl" />
					<div className="dock-label">Home</div>
				</Link>
			</button>

			<button type="button" className={isActive("/feeds") ? "dock-active" : ""}>
				<Link to="/feeds">
					<i class="ri-inbox-line text-xl" />
					<div className="dock-label">Feeds</div>
				</Link>
			</button>

			<div>
				<ThemeSelectorToggle />
			</div>

			<button type="button">
				<i class="ri-settings-5-line text-xl" />
				<span className="dock-label">Settings</span>
			</button>
		</div>
	);
};
