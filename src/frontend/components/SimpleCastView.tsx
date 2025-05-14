import { useState } from "preact/hooks";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { CastOrReply } from "./CastOrReply";
import { ClickableDateSpan } from "./ClickableDateSpan";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

const replyWrapper = (cast: HydratedCast) => (
	<li className="relative pl-6 ">
		<ul className="relative flex flex-col gap-12 py-12 pl-6 before:absolute before:top-6 before:left-6 before:bottom-6 before:-translate-x-1/2 before:border before:border-dashed before:border-slate-200 after:absolute after:top-12 after:left-6 after:bottom-12 after:-translate-x-1/2 after:border after:border-slate-200 list-none">
			<SimpleCastView cast={cast} />
		</ul>
	</li>
);

interface SimpleCastViewProps {
	cast: HydratedCast;
}

export const SimpleCastView = ({ cast }: SimpleCastViewProps) => {
	const [showCard, setShowCard] = useState(false);

	const { showCardView } = useLocalStorageZustand();

	const isReply = !!cast.parentCastId;
	const verb = isReply ? "replied" : "casted";

	return showCardView || showCard ? (
		<CastOrReply cast={cast} />
	) : (
		<li className="relative pl-6 ">
			<article className="flex flex-col flex-1 gap-2">
				<span className="absolute z-10 inline-flex items-center justify-center w-6 h-6 text-white rounded-full -left-3 ring-2 ring-white">
					<img
						src={cast.user.pfpUrl ?? fallbackPfp}
						alt={cast.user.username ?? "user name"}
						title={cast.user.displayName ?? "display name"}
						width="48"
						height="48"
						className="max-w-full rounded-full"
					/>
				</span>
				<h4 className="flex flex-col items-start text-base font-medium leading-6 text-slate-700 md:flex-row lg:items-center">
					<span className="flex-1">
						{cast.user.displayName ?? "display name"}
						<span className="text-sm font-normal text-slate-500">
							{" "}
							{verb} {cast.channel ? ` in ${cast.channel.name}` : ""}
							{cast.channel ? (
								<img
									src={cast.channel.imageUrl ?? fallbackPfp}
									alt={cast.channel.name ?? "channel name"}
									className="w-4 h-4 rounded-sm inline align-text-bottom mx-1 translate-y-7 opacity-50"
								/>
							) : null}
						</span>
					</span>
					<span className="text-xs font-normal text-slate-400">
						<ClickableDateSpan timestamp={cast.timestamp} />
					</span>
				</h4>
				<p className="text-sm text-slate-500 whitespace-pre-wrap">
					{cast.text?.length && cast.text.length > 320
						? `${cast.text?.slice(0, 320)}...`
						: cast.text}
				</p>
				{cast.embeds.length > 0 && (
					<button
						type="button"
						className="btn btn-sm btn-outline text-content-primary"
						onClick={() => setShowCard(true)}
					>
						+ show
					</button>
				)}
			</article>
		</li>
	);
};
