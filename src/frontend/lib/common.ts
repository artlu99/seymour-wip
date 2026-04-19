import type { HydratedCast } from "../types";

export const warpcastUrl = (cast: HydratedCast) =>
	`https://firefly.social/post/farcaster/${cast.hash}`;
