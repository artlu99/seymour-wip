import { useMemo } from "preact/hooks";
import { navigate } from "wouter/use-browser-location";
import { RefreshFeedStatus } from "../components/RefreshFeedStatus";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand, useZustand } from "../hooks/use-zustand";
import { individualFeeds, knownFeeds } from "../static";
import { pluralize } from "../utils";

const Feeds = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();
	const { setFids } = useLocalStorageZustand();
	const { setIsSettingsOpen } = useZustand();

	const primaryFeeds = useMemo(() => {
		const contextFidStr = contextFid?.toString() ?? "";
		return (
			(individualFeeds as Record<string, (typeof individualFeeds)["6546"]>)[
				contextFidStr
			] ?? []
		);
	}, [contextFid]);

	return (
		<div className="flex flex-col text-center pb-32" data-theme={name}>
			<article className="prose dark:prose-invert">
				<div className="flex justify-between items-center p-4">
					{contextFid ? (
						<div className="text-sm">
							GM,
							<button
								type="button"
								className="btn btn-link"
								onClick={() => viewProfile(contextFid)}
							>
								{contextName}
							</button>
						</div>
					) : null}
					<button
						type="button"
						className="btn btn-ghost btn-circle"
						onClick={() => setIsSettingsOpen(true)}
					>
						<i class="ri-settings-3-line text-xl" />
					</button>
				</div>

				<RefreshFeedStatus />

				<ul className="list bg-base-100 rounded-box">
					<li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
						Pick a Feed
					</li>

					{[...primaryFeeds, ...knownFeeds].map((feed, idx) => (
						<li className="list-row" key={`${feed.name}-${idx}`}>
							<div className="text-4xl font-thin opacity-30 tabular-nums">
								{(idx + 1).toString().padStart(2, "0")}
							</div>

							<span className="btn btn-square btn-ghost">
								<img
									className="size-10 rounded-box"
									src={feed.image}
									alt={feed.name}
								/>
							</span>

							<div className="list-col-grow text-left">
								<div className="uppercase">{feed.name}</div>
								<div className="text-xs font-semibold opacity-60">
									{feed.description}
								</div>
								<div className="text-xs italic text-info">
									{pluralize(feed.fids.length, "member")}
								</div>
							</div>

							<button
								type="button"
								className="btn btn-square btn-ghost"
								onClick={() => {
									setFids(feed.fids);
									// mutation.mutate({ fids: feed.fids });
									navigate("/");
								}}
							>
								<i class="ri-play-large-line text-2xl" />
							</button>
						</li>
					))}
				</ul>
			</article>
		</div>
	);
};

export default Feeds;
