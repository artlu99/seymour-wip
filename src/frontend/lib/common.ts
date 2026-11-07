import type { HydratedCast } from "../types";

export const warpcastUrl = (cast: HydratedCast) =>
	`https://warpcats.com/~/conversations/${cast.hash}`;
