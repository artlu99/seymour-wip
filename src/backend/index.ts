import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";
import { FrameContextSchema } from "./lib/farcasterTypes";
import {
	insertFrameContext,
	listLastNFrameContextEvents,
} from "./lib/postgres";
import { getStarterPackMembers } from "./lib/warpcast";

const app = new Hono<{ Bindings: Cloudflare.Env }>().basePath("/api");

const routes = app
	.post("/webhook", async (c) => {
		const body = await c.req.json();
		console.log(body);
		return c.json({ success: true });
	})

	.use(cors())
	.use(csrf())
	.use(secureHeaders())
	.get("/name", (c) => c.json({ name: c.env.NAME }))
	.get("/time", (c) => c.json({ time: new Date().toISOString() }))
	.get("/starter-pack/:id", async (c) => {
		const id = c.req.param("id");
		const members = await getStarterPackMembers(id);
		return c.json(members);
	})
	.get("/frame-events", async (c) => {
		const events = await listLastNFrameContextEvents(c.env);
		return c.json(events);
	})
	.post(
		"/context",
		zValidator(
			"json",
			z.object({
				fid: z.string().transform((val) => Number(val)),
				context: FrameContextSchema,
			}),
		),
		async (c) => {
			const { fid, context } = c.req.valid("json");
			await insertFrameContext(c.env, fid, context);
			return c.json({ ok: true });
		},
	);

export type AppType = typeof routes;

export default app;
