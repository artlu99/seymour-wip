import { useThemes } from "../hooks/use-themes";

const DARK_THEMES = ["abyss", "dim", "forest", "midnight","night"];
const LIGHT_THEMES = ["acid", "corporate", "emerald", "pastel", "winter"];

export const ThemeSelectorDropdown = () => {
	const { name, setTheme } = useThemes();

	return (
		<details className="dropdown">
			<summary className="btn btn-square btn-ghost m-1">
				<img
					src="/colorful_palette.svg"
					alt="palette"
				/>
			</summary>
			<ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
				{DARK_THEMES.map((theme) => (
					<li key={theme}>
						<input
							type="radio"
							name="theme-dropdown"
							className={`theme-controller btn btn-ghost btn-sm btn-block justify-start ${
								name === theme ? "border-primary" : ""
							}`}
							aria-label={theme}
							value={theme}
							checked={name === theme}
							onChange={() => setTheme(theme)}
						/>
					</li>
				))}
				<li className="divider my-0.5 h-0.5 base-content-500" />
				{LIGHT_THEMES.map((theme) => (
					<li key={theme}>
						<input
							type="radio"
							name="theme-dropdown"
							className={`theme-controller btn btn-ghost btn-sm btn-block justify-start ${
								name === theme ? "border-b-2 border-primary" : ""
							}`}
							aria-label={theme}
							value={theme}
							checked={name === theme}
							onChange={() => setTheme(theme)}
						/>
					</li>
				))}
			</ul>
		</details>
	);
};
