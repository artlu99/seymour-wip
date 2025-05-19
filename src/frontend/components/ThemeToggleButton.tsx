import { useThemes } from "../hooks/use-themes";

enum THEMES {
	DARK = "dark",
	LIGHT = "corporate",
}

interface ThemeSelectorToggleProps {
	isScrollingUp: boolean;
}

export const ThemeSelectorToggle = ({
	isScrollingUp,
}: ThemeSelectorToggleProps) => {
	const { name, setTheme } = useThemes();

	const toggleTheme = () => {
		setTheme(name === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
	};

	return (
		<button
			type="button"
			className="btn btn-square btn-ghost m-1 transition-all duration-300"
			onClick={() => toggleTheme()}
			style={{
				opacity: isScrollingUp ? 1 : 0.15,
				filter: isScrollingUp ? "blur(0.5px)" : "none",
			}}
		>
			<img src="/colorful_palette.svg" alt="palette" />
		</button>
	);
};
