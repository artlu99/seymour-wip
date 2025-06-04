import { type Context, sdk } from "@farcaster/frame-sdk";
import { createContext } from "preact";
import type { ReactNode } from "preact/compat";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useZustand } from "../hooks/use-zustand";

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
	viewCast: (hash: `0x${string}`) => void;
	viewProfile: (fid: number, username?: string) => void;
	ethProvider: typeof sdk.wallet.ethProvider;
	connectedWallet: () => Promise<`0x${string}` | null>;
	composeCast: (fid: number, hash: `0x${string}`, channelKey?: string) => void;
	selectionChanged: () => Promise<void>;
	impactOccurred: (
		impact: "light" | "medium" | "heavy" | "soft" | "rigid",
	) => Promise<void>;
}

export const FrameSDKContext = createContext<FrameSDKContextType | undefined>(
	undefined,
);

export function FrameSDKProvider({ children }: { children: ReactNode }) {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [context, setContext] = useState<Context.FrameContext>();

	const { hasFirstLoadCompleted } = useZustand();

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
	const capabilities = useMemo(async () => {
		return await sdk.getCapabilities();
	}, []);

	useEffect(() => {
		const load = async () => {
			setContext(await sdk.context);
			sdk.actions.ready({});
		};

		if (sdk && !isSDKLoaded && hasFirstLoadCompleted) {
			setIsSDKLoaded(true);
			load();
		}
	}, [isSDKLoaded, hasFirstLoadCompleted]);

	const openUrl = useCallback(
		(url: string) => {
			context ? sdk.actions.openUrl(url) : window.open(url, "_blank");
		},
		[context],
	);

	const viewCast = useCallback((hash: `0x${string}`) => {
		sdk.actions.viewCast({ hash });
	}, []);

	const viewProfile = useCallback(
		(fid: number, username?: string) => {
			const profileUrl = username
				? `https://farcaster.xyz/${username}`
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

	const composeCast = useCallback(
		async (fid: number, hash: `0x${string}`, channelKey?: string) => {
			if (!isWarpcast) {
				return openUrl(`https://farcaster.xyz/${fid}/${hash.slice(0, 10)}`);
			}
			await sdk.actions.composeCast({
				parent: { type: "cast", hash },
				channelKey,
			});
		},
		[isWarpcast, openUrl],
	);

	const selectionChanged = useCallback(async () => {
		const caps = await sdk.getCapabilities();
		if (caps.includes("haptics.selectionChanged")) {
			return await sdk.haptics.selectionChanged();
		}
	}, []);

	const impactOccurred = useCallback(
		async (impact: "light" | "medium" | "heavy" | "soft" | "rigid") => {
			const caps = await sdk.getCapabilities();
			if (caps.includes("haptics.impactOccurred")) {
				return await sdk.haptics.impactOccurred(impact);
			}
		},
		[],
	);

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
				viewCast,
				viewProfile,
				ethProvider: sdk.wallet.ethProvider,
				connectedWallet,
				composeCast,
				selectionChanged,
				impactOccurred,
			}}
		>
			{children}
		</FrameSDKContext.Provider>
	);
}
