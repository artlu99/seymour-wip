import { type Context, sdk } from "@farcaster/frame-sdk";
import { createContext } from "preact";
import type { ReactNode } from "preact/compat";
import { useCallback, useEffect, useState } from "preact/hooks";

const LOCAL_DEBUGGING = import.meta.env.DEV;

export interface FrameSDKContextType {
	isSDKLoaded: boolean;
	sdk: typeof sdk;
	context: Context.FrameContext | undefined;
	contextName: string;
	contextFid: number | null;
	clientName: string;
	isWarpcast: boolean;
	isInstalled: boolean;
	openUrl: (url: string) => void;
	viewProfile: (fid: number, username?: string) => void;
	ethProvider: typeof sdk.wallet.ethProvider;
	connectedWallet: () => Promise<`0x${string}`>;
}

export const FrameSDKContext = createContext<FrameSDKContextType | undefined>(
	undefined,
);

export function FrameSDKProvider({ children }: { children: ReactNode }) {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [context, setContext] = useState<Context.FrameContext>();

	const contextName =
		context?.user?.displayName ?? context?.user?.username ?? "Fartcaster";
	const contextFid = context?.user?.fid ?? (LOCAL_DEBUGGING ? 6546 : null);

	const clientName = context
		? context.client?.clientFid === 9152
			? "Warpcast"
			: (context.client?.clientFid.toString() ?? "alt client")
		: "browser";

	const isWarpcast = context?.client?.clientFid === 9152;
	const isInstalled = context?.client?.added ?? false;

	useEffect(() => {
		const load = async () => {
			setContext(await sdk.context);
			sdk.actions.ready({});
		};

		if (sdk && !isSDKLoaded) {
			setIsSDKLoaded(true);
			load();
		}
	}, [isSDKLoaded]);

	const openUrl = useCallback(
		(url: string) => {
			context ? sdk.actions.openUrl(url) : window.open(url, "_blank");
		},
		[context],
	);

	const viewProfile = useCallback(
		(fid: number, username?: string) => {
			const profileUrl = username
				? `https://warpcast.com/${username}`
				: `https://vasco.wtf/fid/${fid}`;

			isWarpcast
				? sdk.actions.viewProfile({ fid })
				: context
					? sdk.actions.openUrl(profileUrl)
					: window.open(profileUrl, "_blank");
		},
		[context, isWarpcast],
	);

	const connectedWallet = useCallback(async () => {
		if (!isWarpcast) {
			return null;
		}
		const accounts = await sdk.wallet.ethProvider.request({
			method: "eth_requestAccounts",
		});
		return accounts?.[0];
	}, [isWarpcast]);

	return (
		<FrameSDKContext.Provider
			value={{
				isSDKLoaded,
				sdk,
				context,
				contextName,
				contextFid,
				clientName,
				isWarpcast,
				isInstalled,
				openUrl,
				viewProfile,
				ethProvider: sdk.wallet.ethProvider,
				connectedWallet,
			}}
		>
			{children}
		</FrameSDKContext.Provider>
	);
}
