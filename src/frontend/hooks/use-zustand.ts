import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

export const useZustand = create(
	persist(
		combine(
			{
				wallet: null as `0x${string}` | null,
				isSettingsOpen: false,
				isRelative: true,
				isRefreshing: false,
				isScrollingUp: true,
				lastScrollY: 0,
			},
			(set) => ({
				setWallet: (wallet: `0x${string}` | null) => set({ wallet }),
				setIsSettingsOpen: (isSettingsOpen: boolean) => set({ isSettingsOpen }),
				setIsRelative: (isRelative: boolean) => set({ isRelative }),
				setIsRefreshing: (isRefreshing: boolean) => set({ isRefreshing }),
				setScrollState: (isScrollingUp: boolean, lastScrollY: number) =>
					set({ isScrollingUp, lastScrollY }),
			}),
		),
		{
			name: "zustand-store",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export const useLocalStorageZustand = create(
	persist(
		combine(
			{
				fids: [
					2210, 475488, 527771, 4407, 814040, 528, 273442, 9933, 15983, 199989,
					6546, 243139, 6945, 4513, 12048, 4163, 4895, 2802, 10144, 270504,
					284324, 9166, 10174, 192702, 276562, 2210, 2904, 440352, 14364, 5708,
					227242, 535389, 2441, 356241, 327165, 3, 644823,
				] as number[],
				themeName: null as string | null,
				showCardView: false as boolean,
				showNavigationCaptions: false as boolean,
				showTipButtons: false as boolean,
			},
			(set) => ({
				setThemeName: (themeName: string | null) => set({ themeName }),
				setFids: (fids: number[]) => set({ fids }),
				setShowCardView: (showCardView: boolean) => set({ showCardView }),
				setShowNavigationCaptions: (showNavigationCaptions: boolean) =>
					set({ showNavigationCaptions }),
				setShowTipButtons: (showTipButtons: boolean) => set({ showTipButtons }),
			}),
		),
		{
			name: "zustand-store",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
