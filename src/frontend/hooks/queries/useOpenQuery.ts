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
