import { Link, useRoute } from "wouter";
import { Logos } from "../components/Logos";
import SpringTransition from "../components/effects/SpringTransition";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useZustand } from "../hooks/use-zustand";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";

const Uses = () => {
	const [isMatch] = useRoute("/uses");
	const { count, increase, reset } = useZustand();
	const { openUrl } = useFrameSDK();

	const { name } = useThemes();

	return (
		<div className="min-h-screen w-full" data-theme={name}>
			<SpringTransition isActive={isMatch}>
				<article className="prose dark:prose-invert">
					<Logos />
					<FarcasterEmbed url="https://warpcast.com/pugson/0x4294c797" />
					<div className="p-4">
						✓ sharing state across routes
						<br />
						<div className="join">
							<button
								className="btn btn-primary btn-soft join-item"
								type="button"
								onClick={() => increase()}
								aria-label="increment"
							>
								<i className="ri-heart-add-line" />
								increment: {count}
							</button>
							<button
								className="btn btn-error btn-soft join-item"
								type="button"
								onClick={() => reset()}
								aria-label="reset"
							>
								reset
								<i className="ri-close-circle-line" />
							</button>
						</div>
					</div>
				</article>

				<footer className="p-4">
					<div className="flex ">
						<div className="flex-1">
							<Link href="/">
								<button className="btn btn-warning btn-soft" type="button">
									<i className="ri-arrow-left-long-line" />
									Back
								</button>
							</Link>
						</div>
						<div className="flex-1">
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => {
									openUrl("https://github.com/artlu99/spa-mini-app-starter");
								}}
							>
								FOSS MIT Licensed
								<i className="ri-github-line" />
							</button>
						</div>
					</div>
				</footer>

				<article className="prose dark:prose-invert">
					<div className=" font-bold italic">DX batteries included:</div>
					<div className="">TypeScript + Biome + TailwindCSS v4</div>
					<div className="">DaisyUI + Framer Motion + Remix Icon</div>
					<div className="">Wouter + Zustand + TanStack Query</div>
					<div className="">Zod + Hono Stack (end-to-end type safety)</div>
					<div className="">webhooks</div>
					<div className=" font-bold italic">External dependencies:</div>
				</article>
			</SpringTransition>
		</div>
	);
};

export default Uses;
