import { Kysely } from "kysely";
import { NeonHTTPDialect } from "kysely-neon";
import type { FrameContext } from "./farcasterTypes";
import type { Database } from "./kysely";

export const db = (env: Env) =>
	new Kysely<Database>({
		/* 
    NeonHTTPDialect is an experimental neon function that allows making 
    stateless HTTPS requests, that should have lower latencies, but
    no session or transaction support. 
    
    To use a more stable, more fully-featured but slightly slower dialect,
    import and use NeonDialect instead of NeonHTTPDialect.
    N.B.: NeonDialect depends on websockets. Hence, it does not work exactly 
    the same way in local development as when deployed to Cloudflare.
    */
		dialect: new NeonHTTPDialect({
			connectionString: env.DATABASE_URL,
		}),
	});

export const insertFrameContext = async (
	env: Env,
	fid: number,
	frameContext: FrameContext,
) => {
	const dbClient = db(env);
	try {
		await dbClient
			.insertInto("frame_context")
			.values({ fid, frame_context: frameContext })
			.execute();
	} catch (error) {
		console.error("Database error in insertFrameContext:", error);
		throw new Error("Failed to insert frame context");
	}
};

export const listLastNFrameContextEvents = async (env: Env, n = 5) => {
	const dbClient = db(env);
	const events = await dbClient
		.selectFrom("frame_context")
		.selectAll()
		.orderBy("created_at", "desc")
		.limit(n)
		.execute();
	return events;
};
