import { createContext } from "preact";
import type { ReactNode } from "preact/compat";
import { useCallback } from "preact/hooks";
import { useLocalStorageZustand } from "../hooks/use-zustand";

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
