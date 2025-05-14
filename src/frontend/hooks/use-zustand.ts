import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

export const useZustand = create(
	persist(
		combine({ count: 0, isSettingsOpen: false, isRelative: true }, (set) => ({
			increase: (by = 1) => set((state) => ({ count: state.count + by })),
			reset: () => set({ count: 0 }),
			setIsSettingsOpen: (isSettingsOpen: boolean) => set({ isSettingsOpen }),
			setIsRelative: (isRelative: boolean) => set({ isRelative }),
		})),
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
				showCardView: true as boolean,
			},
			(set) => ({
				setThemeName: (themeName: string | null) => set({ themeName }),
				setFids: (fids: number[]) => set({ fids }),
				setShowCardView: (showCardView: boolean) => set({ showCardView }),
			}),
		),
		{
			name: "zustand-store",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
