import { navigate } from "wouter/use-browser-location";
import { RefreshFeedStatus } from "../components/RefreshFeedStatus";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useThemes } from "../hooks/use-themes";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { artluFollowersFromHubble } from "../static";
import { pluralize } from "../utils";

const knownFeeds = [
	{
		name: "Kenny",
		fids: [
			2210, 475488, 527771, 4407, 814040, 528, 273442, 9933, 15983, 199989,
			6546, 243139, 6945, 4513, 12048, 4163, 4895, 2802, 10144, 270504, 284324,
			9166, 10174, 192702, 276562, 2210, 2904, 440352, 14364, 5708, 227242,
			535389, 2441, 356241, 327165, 3, 644823,
		],
		description: "Kenny was right",
		image:
			"https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/e6f1d0c9-26ff-4701-4bc5-f748256ab900/rectcrop3",
	},
	{
		name: "Keccers",
		fids: [4407],
		description:
			"The Keccers are a group of people who are interested in the Keccer project.",
		image: "https://i.imgur.com/kynnpYw.jpg",
	},
	{
		name: "Artlu",
		fids: artluFollowersFromHubble.messages.map(
			(m) => m.data.linkBody.targetFid,
		),
		description: "most liked Fartcasters",
		image:
			"https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/52ee3c12-a238-406f-d008-798d1ad78900/original",
	},
	{
		name: "the homies",
		fids: [533, 617, 1355, 1356, 4163],
		description: "right more often than not",
		image:
			"https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/2e5e22a8-d9f6-45b8-3b28-caab1e513f00/original",
	},
	{
		name: "europoooors",
		fids: [233242, 8004, 5701, 5708, 11124, 13089],
		description: "funny frenchies, silly slovak, a brit und ze german",
		image: "https://i.imgur.com/NycQEZt.png",
	},
	{
		name: "web3 is jittery",
		fids: [880],
		description: "accountless",
		image:
			"https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/44e49270-1953-433a-b1e3-c13fe823f100/original",
	},
	{
		name: "🫵 🤣",
		fids: [6596],
		description: "This account has been banned",
		image:
			"https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/820a167b-b030-4505-37d7-bacdfe5db100/original",
	},
];
const Feeds = () => {
	const { contextName, contextFid, viewProfile } = useFrameSDK();
	const { name } = useThemes();
	const { setFids } = useLocalStorageZustand();

	return (
		<div className="flex flex-col text-center pb-32" data-theme={name}>
			<article className="prose dark:prose-invert">
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
					</div>
				) : null}

				<RefreshFeedStatus />

				<ul className="list bg-base-100 rounded-box">
					<li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
						Pick a Feed
					</li>

					{knownFeeds.map((feed, idx) => (
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
