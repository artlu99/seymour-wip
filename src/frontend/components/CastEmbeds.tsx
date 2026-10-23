import { useCastIdQuery } from "../hooks/queries/useShimQuery";
import { useProfiles } from "../hooks/use-profiles";
import { warpcastUrl } from "../lib/common";
import type { HydratedCast } from "../types";

const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i;
const isImage = (url: string) =>
	IMAGE_RE.test(url) || url.includes("imagedelivery.net");

const QuotedCast = ({ fid, hash }: { fid: number; hash: `0x${string}` }) => {
	const { openUrl } = useProfiles();
	const { data: quoted } = useCastIdQuery(fid, hash);

	if (!quoted) {
		return (
			<div className="border-l-2 border-base-content/15 rounded-r-lg bg-base-content/5 px-2.5 py-1.5 text-xs text-base-content/40">
				quoted cast
			</div>
		);
	}

	return (
		<button
			type="button"
			aria-label="View quoted cast"
			className="w-full text-left border-l-2 border-base-content/15 rounded-r-lg bg-base-content/5 hover:bg-base-content/10 transition-colors px-2.5 py-1.5"
			onClick={() => openUrl(warpcastUrl(quoted))}
		>
			<span className="block text-xs font-medium text-base-content/70">
				@{quoted.user.username ?? quoted.user.displayName}
			</span>
			<span className="block text-xs text-base-content/50 line-clamp-2">
				{quoted.rawText}
			</span>
		</button>
	);
};

interface CastEmbedsProps {
	cast: HydratedCast;
}

export const CastEmbeds = ({ cast }: CastEmbedsProps) => {
	const { openUrl } = useProfiles();

	return (
		<div
			className="mt-1.5 grid gap-1.5"
			style={{
				contentVisibility: "auto",
				containIntrinsicSize: "320px",
			}}
		>
			{cast.embeds.map((embed, i) => {
				if (embed.castId) {
					return (
						<QuotedCast
							key={`q-${i}`}
							fid={embed.castId.fid}
							hash={embed.castId.hash}
						/>
					);
				}
				if (!embed.url) return null;

				if (isImage(embed.url)) {
					return (
						<button
							type="button"
							key={`e-${i}`}
							aria-label="Open image"
							className="block cursor-zoom-in"
							onClick={() => openUrl(embed.url as string)}
						>
							<img
								src={embed.url}
								alt="cast embed"
								loading="lazy"
								className="w-full max-h-80 object-cover rounded-xl border border-base-content/10"
							/>
						</button>
					);
				}

				let host = embed.url;
				try {
					const parsed = new URL(embed.url);
					host = `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "");
				} catch {
					// keep raw url as label
				}
				return (
					<button
						type="button"
						key={`e-${i}`}
						className="flex items-center gap-2 w-full border border-base-content/10 rounded-xl bg-base-content/5 hover:bg-base-content/10 transition-colors px-3 py-2 text-left"
						onClick={() => openUrl(embed.url as string)}
					>
						<i className="ri-links-line text-base-content/50" />
						<span className="truncate min-w-0 text-xs text-base-content/60">
							{host}
						</span>
					</button>
				);
			})}
		</div>
	);
};
