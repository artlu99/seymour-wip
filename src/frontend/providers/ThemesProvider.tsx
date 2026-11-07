import { createContext } from "preact";
import type { ReactNode } from "preact/compat";
import { useCallback, useEffect } from "preact/hooks";
import { useLocalStorageZustand } from "../hooks/use-zustand";

export const THEMES = {
	SEYMOUR: "seymour",
	LIGHT: "light",
} as const;

/**
 * The theme a stored name resolves to. `null` (never picked a theme yet)
 * reads as Seymour — the daisyUI default theme. Anything else unexpected
 * falls back to Seymour too, so a stale/corrupt localStorage value can
 * never half-apply a theme daisyUI doesn't ship.
 */
export const effectiveTheme = (name: string | null | undefined): string =>
	name === THEMES.LIGHT ? THEMES.LIGHT : THEMES.SEYMOUR;

export interface ThemesContextType {
	name: string | null;
	setTheme: (name: string | null) => void;
}

export const ThemesContext = createContext<ThemesContextType>({
	name: null,
	setTheme: () => {},
});

export function ThemesProvider({ children }: { children: ReactNode }) {
	const { themeName, setThemeName } = useLocalStorageZustand();

	// Seymour is the app-wide theme: it lives on <html>, not on a page
	// wrapper, so daisyUI's :root background/base-content, native form
	// controls, scrollbars, portals and the cards' currentColor treatment
	// all follow one scope. (index.html carries an inline pre-paint script
	// that sets the same attribute from localStorage — this effect keeps it
	// in sync after that without repainting on toggle.)
	useEffect(() => {
		document.documentElement.dataset.theme = effectiveTheme(themeName);
	}, [themeName]);

	const setTheme = useCallback(
		(name: string | null) => {
			setThemeName(name);
		},
		[setThemeName],
	);

	return (
		<ThemesContext.Provider value={{ name: themeName, setTheme }}>
			{children}
		</ThemesContext.Provider>
	);
}
