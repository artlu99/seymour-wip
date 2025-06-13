import type { HydratedCast } from "../types";

export const warpcastUrl = (cast: HydratedCast) =>
	`https://recaster.org/cast/${cast.hash}`;
