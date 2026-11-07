import { useThemes } from "../hooks/use-themes";
import { effectiveTheme, THEMES } from "../providers/ThemesProvider";

interface ThemeSelectorToggleProps {
	isScrollingUp: boolean;
}

export const ThemeSelectorToggle = ({
	isScrollingUp,
}: ThemeSelectorToggleProps) => {
	const { name, setTheme } = useThemes();

	const toggleTheme = () => {
		// A null themeName IS Seymour (the default) — without the effective-
		// theme read, a fresh install would need two taps to reach light
		// (null → seymour → light).
		setTheme(
			effectiveTheme(name) === THEMES.SEYMOUR ? THEMES.LIGHT : THEMES.SEYMOUR,
		);
	};

	return (
		<button
			type="button"
			className="btn btn-square btn-ghost m-1 transition-all duration-300"
			onClick={() => toggleTheme()}
			style={{ opacity: isScrollingUp ? 1 : 0.15 }}
		>
			<img src="/colorful_palette.svg" alt="palette" />
		</button>
	);
};
