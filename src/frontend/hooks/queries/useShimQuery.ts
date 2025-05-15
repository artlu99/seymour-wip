import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import type { HydratedCast } from "../../types";
import { useLocalStorageZustand } from "../use-zustand";

export const api = fetcher({ base: "https://shim.artlu.workers.dev" });

export const useKeccersFeed = (fids: number[]) => {
	return useQuery({
		queryKey: ["keccers-feed", fids],
		queryFn: async () => {
			const res = await api.post<{
				success: boolean;
				feed: HydratedCast[];
			}>("/reverse-chron", { fids });
			return res.feed;
		},
		refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
		placeholderData: keepPreviousData,
	});
};

export const useUsernameQuery = (fid: number | undefined) => {
	return useQuery({
		queryKey: ["username", fid],
		queryFn: async () => {
			if (!fid) {
				return null;
			}
			const res = await api.get<{
				success: boolean;
				username: string;
			}>(`/u/${fid}`);
			return res.username ?? null;
		},
		enabled: !!fid,
	});
};

export const useCastQuery = (hash: `0x${string}`, username?: string | null) => {
	return useQuery({
		queryKey: ["cast", username, hash],
		queryFn: async () => {
			const res = await api.get<{ success: boolean; cast: HydratedCast }>(
				`/${username}/${hash.slice(0, 10)}`,
			);
			return res.cast ?? null;
		},
		enabled: !!username && !!hash,
	});
};

export const useRefreshFeed = () => {
	const queryClient = useQueryClient();
	const { fids } = useLocalStorageZustand();

	return useMutation({
		mutationFn: async (body: {
			username?: string;
			fids: number[];
		}) => {
			const response = await api.post<{
				success: boolean;
				message: string;
				stats: {
					totalFids: number;
					totalNewCasts: number;
					totalCasts: number;
				};
			}>("/refresh", body);

			if (!response.success) {
				throw new Error(response.message);
			}

			return response.stats;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["keccers-feed", fids],
			});
		},
	});
};
