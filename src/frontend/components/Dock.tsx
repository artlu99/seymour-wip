import { ThemeSelectorToggle } from "./ThemeToggleButton";

export const Dock = () => {
	return (
		<div className="dock dock-xl">
			<button type="button" className="dock-active">
				<i class="ri-home-4-line text-xl" />
				<span className="dock-label">Home</span>
			</button>

			<div>
				<i class="ri-inbox-line text-xl" />
				<span className="dock-label">Feeds</span>
			</div>

			<button type="button">
				<ThemeSelectorToggle />
				<span className="dock-label">Theme</span>
			</button>

			<button type="button">
				<i class="ri-settings-5-line text-xl" />
				<span className="dock-label">Settings</span>
			</button>
		</div>
	);
};
