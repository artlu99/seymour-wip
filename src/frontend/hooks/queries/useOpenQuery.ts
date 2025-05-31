import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "../../../backend";

export const api = hc<AppType>("/").api;

export const useNameQuery = () => {
	return useQuery({
		queryKey: ["name"],
		queryFn: async () => {
			const res = await api.name.$get();
			return res.json();
		},
	});
};

export const useTimeQuery = () => {
	return useQuery({
		queryKey: ["time"],
		queryFn: async () => {
			const res = await api.time.$get();
			return res.json();
		},
		refetchInterval: 5000, // Auto-refresh every 5 seconds
	});
};

export const useHubQuery = (pk: string | null) => {
	if (!pk) {
		return null;
	}
	return useQuery({
		queryKey: ["hub"],
		queryFn: async () => {
			const res = await api.hub.$get();
			return res.json();
		},
		enabled: !!pk,
	});
};

export const useBlocksQuery = (fid: number | null) => {
	return useQuery({
		queryKey: ["blocks", fid],
		queryFn: async () => {
			const res = await api.blocks[":fid"].$get({
				param: { fid: String(fid) },
			});
			return res.json();
		},
		enabled: !!fid,
	});
};
