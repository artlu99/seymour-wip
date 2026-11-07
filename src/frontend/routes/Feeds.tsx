import { useMemo } from "preact/hooks";
import { navigate } from "wouter/use-browser-location";
import { RefreshFeedStatus } from "../components/RefreshFeedStatus";
import { useLocalStorageZustand, useZustand } from "../hooks/use-zustand";
import { individualFeeds, knownFeeds } from "../static";
import { pluralize } from "../utils";

const Feeds = () => {
	const { feedFids, setFeedFids: setFids } = useLocalStorageZustand();
	const { setIsSettingsOpen } = useZustand();

	const primaryFeeds = useMemo(() => {
		const contextFidStr = "";
		return (
			(
				individualFeeds as unknown as Record<
					string,
					(typeof individualFeeds)["6546"]
				>
			)[contextFidStr] ?? []
		);
	}, []);

	const isCurrent = (fids: number[]) =>
		fids.length === feedFids.length &&
		fids.every((fid) => feedFids.includes(fid));

	return (
		<div className="flex flex-col text-center pb-32">
			<article className="prose dark:prose-invert">
				<div className="flex justify-between items-center p-4">
					<h2 className="m-0 text-lg font-semibold">Pick a feed</h2>
					<button
						type="button"
						className="btn btn-ghost btn-circle"
						onClick={() => setIsSettingsOpen(true)}
					>
						<i class="ri-settings-3-line text-xl" />
					</button>
				</div>

				<RefreshFeedStatus />

				<div className="grid gap-3 px-4 sm:grid-cols-2">
					{[...primaryFeeds, ...knownFeeds].map((feed, idx) => {
						const current = isCurrent(feed.fids);
						return (
							<button
								type="button"
								key={`${feed.name}-${idx}`}
								onClick={() => {
									setFids(feed.fids);
									navigate("/");
								}}
								className={`card card-border bg-base-200 text-left items-start overflow-hidden hover:bg-base-300/60 transition-colors ${
									current ? "ring-1 ring-primary/50 border-primary/40" : ""
								}`}
							>
								<div className="relative h-24 w-full overflow-hidden">
									<img
										className="w-full h-full object-cover"
										src={feed.image}
										alt={feed.name}
									/>
									{current && (
										<span className="badge badge-primary badge-sm absolute top-2 right-2">
											▶ playing
										</span>
									)}
								</div>
								<div className="card-body p-4 gap-1.5">
									<div className="font-semibold">{feed.name}</div>
									<p className="text-xs text-base-content/60 line-clamp-2 m-0">
										{feed.description}
									</p>
									<span className="text-xs italic text-info">
										{pluralize(feed.fids.length, "member")}
									</span>
								</div>
							</button>
						);
					})}
				</div>
			</article>
		</div>
	);
};

export default Feeds;
