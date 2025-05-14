import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import type { HydratedCast } from "../../types";

export const api = fetcher({ base: "https://shim.artlu.workers.dev" });

export const useKeccersFeed = (fids: number[]) => {
	return useQuery({
		queryKey: ["keccers-feed", fids],
		queryFn: async () => {
			const fidsString = fids.join(",");
			const res = await api.get<{
				success: boolean;
				feed: HydratedCast[];
			}>(`/reverse-chron?fids=${fidsString}`);
			return res.feed;
		},
		refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
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
			return res.username;
		},
		enabled: !!fid,
	});
};

export const useRefreshFeed = () => {
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
					totalCasts: number;
				};
			}>("/refresh", body);

			if (!response.success) {
				throw new Error(response.message);
			}

			return response.stats;
		},
	});
};
