import { Link, useLocation } from "wouter";
import { useZustand } from "../hooks/use-zustand";
import { SettingsModal } from "./SettingsModal";
import { ThemeSelectorToggle } from "./ThemeToggleButton";

export const Dock = () => {
	const [location] = useLocation();
	const isActive = (path: string) => location === path;

	const { isSettingsOpen, setIsSettingsOpen } = useZustand();

	return (
		<>
			<div className="dock dock-xl">
				<button type="button" className={isActive("/") ? "dock-active" : ""}>
					<Link to="/">
						<i class="ri-home-4-line text-xl" />
						<div className="dock-label">Home</div>
					</Link>
				</button>

				<button
					type="button"
					className={isActive("/feeds") ? "dock-active" : ""}
				>
					<Link to="/feeds">
						<i class="ri-inbox-line text-xl" />
						<div className="dock-label">Feeds</div>
					</Link>
				</button>

				<div>
					<ThemeSelectorToggle />
				</div>

				<button
					type="button"
					className={isSettingsOpen ? "dock-active" : ""}
					onClick={() => setIsSettingsOpen(!isSettingsOpen)}
				>
					<i class="ri-settings-5-line text-xl" />
					<span className="dock-label">Settings</span>
				</button>
			</div>
			<SettingsModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
		</>
	);
};
