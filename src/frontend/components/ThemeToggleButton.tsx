import { useThemes } from "../hooks/use-themes";

enum THEMES {
	SEYMOUR = "seymour",
	LIGHT = "light",
}

interface ThemeSelectorToggleProps {
	isScrollingUp: boolean;
}

export const ThemeSelectorToggle = ({
	isScrollingUp,
}: ThemeSelectorToggleProps) => {
	const { name, setTheme } = useThemes();

	const toggleTheme = () => {
		setTheme(name === THEMES.SEYMOUR ? THEMES.LIGHT : THEMES.SEYMOUR);
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
