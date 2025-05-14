import { cloudflare } from "@cloudflare/vite-plugin";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		preact({}),
		cloudflare(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			devOptions: { enabled: true },
			manifest: false,
		}),
	],
	ssr: {
		noExternal: ["@farcaster/frame-sdk"],
	},
});
