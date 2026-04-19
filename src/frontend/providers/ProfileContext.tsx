import { createContext } from "preact";
import type { ReactNode } from "preact/compat";
import { useCallback } from "preact/hooks";

export interface ProfileContextType {
	openUrl: (url: string) => void;
	viewProfile: (fid: number, username?: string) => void;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
	undefined,
);

export function ProfileProvider({ children }: { children: ReactNode }) {
	const openUrl = useCallback((url: string) => {
		window.open(url, "_blank");
	}, []);

	const viewProfile = useCallback((fid: number, username?: string) => {
		const profileUrl = username
			? `https://farcaster.xyz/${username}`
			: `https://explorer.neynar.com/search?q=${fid}`;

		window.open(profileUrl, "_blank");
	}, []);

	return (
		<ProfileContext.Provider
			value={{
				openUrl,
				viewProfile,
			}}
		>
			{children}
		</ProfileContext.Provider>
	);
}
