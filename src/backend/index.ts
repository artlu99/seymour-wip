import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getBlocks, getStarterPackMembers } from "./lib/warpcast";

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
	.get("/hub", (c) => {
		invariant(c.env.NEYNAR_API_KEY, "NEYNAR_API_KEY is not set");
		const ret: { url: string; k: string } = {
			url: "hub-api.neynar.com",
			k: c.env.NEYNAR_API_KEY,
		};
		return c.json(ret);
	})
	.get(
		"/blocks/:fid",
		zValidator(
			"param",
			z.object({
				fid: z.string().transform((s) => Number(s)),
			}),
		),
		async (c) => {
			const { fid } = c.req.valid("param");
			const response = await getBlocks(fid);
			return c.json(response);
		},
	)
	.get("/starter-pack/:id", async (c) => {
		const id = c.req.param("id");
		const members = await getStarterPackMembers(id);
		return c.json(members);
	});

export type AppType = typeof routes;

export default app;
