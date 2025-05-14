import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

export const useZustand = create(
	persist(
		combine({ count: 0 }, (set) => ({
			increase: (by = 1) => set((state) => ({ count: state.count + by })),
			reset: () => set({ count: 0 }),
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
					2210, 814040, 475488, 9933, 646397, 527771, 4407, 256931, 15983,
					314353, 4895, 528707, 2210, 644823, 12048, 482183, 4163, 2802, 5694,
					2441, 8332, 509624, 397815, 510796, 10144, 440352, 14364, 194372,
					227242, 273442, 528, 628100, 279477, 269694, 265108, 526510, 834812,
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
