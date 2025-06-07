import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

const MAX_FEED_LENGTH = 42;

export const useZustand = create(
	persist(
		combine(
			{
				wallet: null as `0x${string}` | null,
				isSettingsOpen: false,
				isRelative: true,
				hasFirstLoadCompleted: true,
				isRefreshing: false,
				isScrollingUp: true,
				lastScrollY: 0,
			},
			(set) => ({
				setWallet: (wallet: `0x${string}` | null) => set({ wallet }),
				setIsSettingsOpen: (isSettingsOpen: boolean) => set({ isSettingsOpen }),
				setIsRelative: (isRelative: boolean) => set({ isRelative }),
				setHasFirstLoadCompleted: (hasFirstLoadCompleted: boolean) =>
					set({ hasFirstLoadCompleted }),
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
				// 0xen cameron kenny keccers king accountless
				feedFids: [528, 617, 2210, 4407, 6596, 880] as number[],
				themeName: null as string | null,
				showCardView: false as boolean,
				showPfpAndDisplayName: true as boolean,
				showNavigationCaptions: true as boolean,
				showTipButtons: true as boolean,
				showPurpleCheck: true as boolean,
				signerFid: null as number | null,
				signerPrivateKey: null as string | null,
			},
			(set) => ({
				setThemeName: (themeName: string | null) => set({ themeName }),
				setFeedFids: (fids: number[]) =>
					set({ feedFids: (fids ?? []).slice(0, MAX_FEED_LENGTH) }),
				setShowCardView: (showCardView: boolean) => set({ showCardView }),
				setShowPfpAndDisplayName: (showPfpAndDisplayName: boolean) =>
					set({ showPfpAndDisplayName }),
				setShowNavigationCaptions: (showNavigationCaptions: boolean) =>
					set({ showNavigationCaptions }),
				setShowTipButtons: (showTipButtons: boolean) => set({ showTipButtons }),
				setShowPurpleCheck: (showPurpleCheck: boolean) =>
					set({ showPurpleCheck }),
				setSignerFid: (signerFid: number | null) => set({ signerFid }),
				setSignerPrivateKey: (signerPrivateKey: string | null) =>
					set({ signerPrivateKey }),
			}),
		),
		{
			name: "zustand-store",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
