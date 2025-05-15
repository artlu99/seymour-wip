import { useMutation } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "../../../backend";
import type { FrameContext } from "../../../backend/lib/farcasterTypes";

export const api = hc<AppType>("/").api;

export const useFrameLoadQuery = (fid: number, context: FrameContext) => {
	return useMutation({
		mutationFn: async () => {
			const res = await api.context.$post({
				json: { fid, context },
			});
			return res.json();
		},
	});
};
