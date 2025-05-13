import { Link } from "wouter";
import { useNameQuery, useTimeQuery } from "../hooks/queries/useOpenQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useZustand } from "../hooks/use-zustand";

const Landing = () => {
	const { count, increase } = useZustand();
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();

	const nameQuery = useNameQuery();
	const timeQuery = useTimeQuery();

	return (
		<div className="flex flex-col text-center gap-4" data-theme={name}>
			<article className="prose dark:prose-invert">
				<div className="p-4">
					<Link href="/uses">
						<div className="text-2xl font-bold">SPA Mini App Starter</div>
					</Link>
					this Mini App belongs to{" "}
					<button
						type="button"
						className="btn btn-link"
						onClick={() => viewProfile(6546)}
					>
						@artlu (FID: 6546)
					</button>
				</div>

				{contextFid ? (
					<div className="p-4 text-sm">
						GM,
						<button
							type="button"
							className="btn btn-link"
							onClick={() => viewProfile(contextFid)}
						>
							{contextName}
						</button>
						<br />
						with seamless signin
					</div>
				) : null}

				<div className="p-4">
					✓ share state across routes
					<br /> don't persist or reveal to server
					<br />
					<button
						className="btn btn-primary btn-soft"
						type="button"
						onClick={() => increase()}
						aria-label="increment"
					>
						<i className="ri-heart-add-line" />
						increment: {count}
					</button>
					<p className="text-sm italic">
						Edit <code>src/frontend/App.tsx</code> to see HMR ⚡️
					</p>
				</div>

				<div className="p-4">
					✓ expose backend information
					<br />
					<button
						className="btn btn-info btn-soft btn-wide"
						type="button"
						onClick={() => nameQuery.refetch()}
						aria-label="get name"
					>
						<span className={nameQuery.isLoading ? "animate-spin" : ""}>
							<i className="ri-refresh-line" />
						</span>
						{nameQuery.data?.name || "Loading..."}
					</button>
					<p className="text-sm italic">
						Edit <code>wrangler.jsonc</code> to change the deployed value
					</p>
				</div>

				<div className="p-4">
					✓ delightful data fetching by TanStack Query
					<br />
					<div className="btn btn-outline btn-wide">
						{timeQuery.data?.time || "Loading..."}
					</div>
					<p className="text-sm italic">
						polls the server every <code>5 seconds</code>.
					</p>
				</div>
			</article>
		</div>
	);
};

export default Landing;
