import type { Generated, Json } from "kysely";
import type { FrameContext } from "./farcasterTypes";

export interface Database {
	about: {
		version: string;
	};
	frame_context: {
		id: Generated<number>;
		fid: number;
		frame_context: Json<FrameContext>;
		created_at: Generated<string>;
	};
}
