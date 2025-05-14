import { useThemes } from "../hooks/use-themes";

enum THEMES {
	DARK = "dark",
	LIGHT = "corporate",
}

export const ThemeSelectorToggle = () => {
	const { name, setTheme } = useThemes();

	const toggleTheme = () => {
		setTheme(name === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
	};

	return (
		<button
			type="button"
			className="btn btn-square btn-ghost m-1"
			onClick={() => toggleTheme()}
		>
			<img src="/colorful_palette.svg" alt="palette" />
		</button>
	);
};
