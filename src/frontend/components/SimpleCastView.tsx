import { useState } from "preact/hooks";
import { useCastQuery, useUsernameQuery } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import type { HydratedCast } from "../types";
import { CastOrReply } from "./CastOrReply";
import { ClickableDateSpan } from "./ClickableDateSpan";

const fallbackPfp = "https://i.pravatar.cc/48?img=1";

const injectMentions = (cast: HydratedCast) => {
	const rawText = cast.text;

	// inject mentions
	const textInBytes = new TextEncoder().encode(rawText ?? "");
	let processedBytes = textInBytes;

	// Process mentions in reverse order to maintain correct indices
	const mentionsPositions = cast.mentionsPositions;
	for (let i = mentionsPositions.length - 1; i >= 0; i -= 1) {
		const idx = mentionsPositions[i];
		const mention = cast.mentions[i];

		// Get the mention text and encode it
		const mentionText = `[@${mention}]`;
		const mentionBytes = new TextEncoder().encode(mentionText);

		// Replace the original text with the mention
		processedBytes = new Uint8Array([
			...Array.from(processedBytes.slice(0, idx)),
			...Array.from(mentionBytes),
			...Array.from(processedBytes.slice(idx)),
		]);
	}

	return new TextDecoder().decode(processedBytes);
};

interface SimpleCastViewProps {
	cast: HydratedCast;
}

export const SimpleCastView = ({ cast }: SimpleCastViewProps) => {
	const [showCard, setShowCard] = useState(false);

	const { showCardView } = useLocalStorageZustand();
	const { openUrl, viewProfile } = useFrameSDK();

	const { data: username } = useUsernameQuery(cast?.parentCastId?.fid);
	const { data: parentCast } = useCastQuery(cast?.parentCastId?.hash, username);

	const firstCast = parentCast ?? cast;

	const isReply = !!firstCast.parentCastId;
	const verb = isReply ? "replied" : "wrote";

	const castText = injectMentions(firstCast);
	const maybeReplyText = isReply ? injectMentions(cast) : null;

	return showCardView || showCard ? (
		<CastOrReply cast={cast} />
	) : (
		<>
			<li className="relative pl-6 ">
				<article className="flex flex-col flex-1 gap-2">
					<span className="absolute z-10 inline-flex items-center justify-center w-6 h-6 text-white rounded-full -left-3 ring-2 ring-white">
						<img
							src={firstCast.user.pfpUrl ?? fallbackPfp}
							alt={firstCast.user.username ?? "user name"}
							title={
								firstCast.user.displayName ??
								firstCast.user.username ??
								"display name"
							}
							width="48"
							height="48"
							className="max-w-full rounded-full aspect-square"
							onClick={() => viewProfile(firstCast.user.fid)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									viewProfile(firstCast.user.fid);
								}
							}}
						/>
					</span>
					<h4 className="flex flex-col items-start text-sm font-normal text-slate-500 md:flex-row lg:items-center">
						<span className="flex-1">
							<span
								className="text-base font-medium leading-6 text-slate-700"
								onClick={() => viewProfile(firstCast.user.fid)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										viewProfile(firstCast.user.fid);
									}
								}}
							>
								{firstCast.user.displayName ??
									firstCast.user.username ??
									"display name"}
							</span>{" "}
							{verb} {firstCast.channel ? ` in ${firstCast.channel.name}` : ""}
							{firstCast.channel ? (
								<img
									src={firstCast.channel?.imageUrl ?? fallbackPfp}
									alt={firstCast.channel?.name ?? "channel name"}
									className="w-4 h-4 rounded-sm inline align-text-bottom mx-1 translate-y-7 opacity-50"
								/>
							) : null}
						</span>
						<span className="text-xs font-normal text-slate-400">
							<ClickableDateSpan timestamp={firstCast.timestamp} />
						</span>
					</h4>
					<p
						className="text-sm text-slate-500 whitespace-pre-wrap"
						onClick={() =>
							openUrl(
								`https://warpcast.com/${firstCast.user.username}/${firstCast.hash.slice(0, 10)}`,
							)
						}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								openUrl(
									`https://warpcast.com/${firstCast.user.username}/${firstCast.hash.slice(0, 10)}`,
								);
							}
						}}
					>
						{castText?.length && castText.length > 320
							? `${castText?.slice(0, 320)}...`
							: castText}
					</p>
					{firstCast.embeds.length > 0 && (
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
			{maybeReplyText && (
				<li className="relative pl-6 ">
					<ul className="relative flex flex-col gap-12 py-12 pl-6 before:absolute before:top-6 before:left-6 before:bottom-6 before:-translate-x-1/2 before:border before:border-dashed before:border-slate-200 after:absolute after:top-12 after:left-6 after:bottom-12 after:-translate-x-1/2 after:border after:border-slate-200 list-none">
						<li className="relative pl-6 ">
							<article className="flex flex-col flex-1 gap-2">
								<span className="absolute z-10 inline-flex items-center justify-center w-6 h-6 text-white rounded-full -left-3 ring-2 ring-white">
									<img
										src={cast.user.pfpUrl ?? fallbackPfp}
										alt={cast.user.username ?? "user name"}
										title={
											cast.user.displayName ??
											cast.user.username ??
											"display name"
										}
										width="48"
										height="48"
										className="max-w-full rounded-full aspect-square"
										onClick={() => viewProfile(cast.user.fid)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												viewProfile(cast.user.fid);
											}
										}}
									/>
								</span>
								<h4 className="flex flex-col items-start text-sm font-normal text-slate-500 md:flex-row lg:items-center">
									<span className="flex-1">
										<span
											className="text-base font-medium leading-6 text-slate-700"
											onClick={() => viewProfile(cast.user.fid)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													viewProfile(cast.user.fid);
												}
											}}
										>
											{cast.user.displayName ??
												cast.user.username ??
												"display name"}
										</span>{" "}
										replied {cast.channel ? ` in ${cast.channel.name}` : ""}
										{cast.channel ? (
											<img
												src={cast.channel?.imageUrl ?? fallbackPfp}
												alt={cast.channel?.name ?? "channel name"}
												className="w-4 h-4 rounded-sm inline align-text-bottom mx-1 translate-y-7 opacity-50"
											/>
										) : null}
									</span>
									<span className="text-xs font-normal text-slate-400">
										<ClickableDateSpan timestamp={cast.timestamp} />
									</span>
								</h4>
								<p
									className="text-sm text-slate-500 whitespace-pre-wrap"
									onClick={() =>
										openUrl(
											`https://warpcast.com/${cast.user.username}/${cast.hash.slice(0, 10)}`,
										)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											openUrl(
												`https://warpcast.com/${cast.user.username}/${cast.hash.slice(0, 10)}`,
											);
										}
									}}
								>
									{maybeReplyText?.length && maybeReplyText.length > 320
										? `${maybeReplyText?.slice(0, 320)}...`
										: maybeReplyText}
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
					</ul>
				</li>
			)}
		</>
	);
};
