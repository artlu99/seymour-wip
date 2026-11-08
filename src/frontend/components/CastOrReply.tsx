import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import {
	useResolvedHandle,
	useUsernameQuery,
} from "../hooks/queries/useShimQuery";
import { toCastData } from "../lib/cast-data";
import type { HydratedCast } from "../types";

// The library's own endpoint answers with Access-Control-Allow-Origin: *,
// but a vanished cast must degrade to an empty slot, never an unhandled
// rejection — so errors stay silent (same option Seymour shipped in phase 3).
const EMBED_OPTIONS = { silentError: true } as const;

// The card's link-out waypoint label. forkcaster relabels the icon to its
// own domain ("Open on forkcaster"); Seymour's outbound waypoint for every
// cast tap is the warpcats conversation, so the label names that.
const ICON_TITLE = "Open on warpcats";

const conversationWaypoint = (hash: `0x${string}`) =>
	`https://warpcats.com/~/conversations/${hash}`;

// --- icon link-out rewrite (lifted from ../forkcaster) ----------------------
//
// forkcaster applies this to the SSR'd card HTML string (worker/cast-page.tsx):
//   hardenBlankTargets   — the library emits every card anchor as a bare
//                          target="_blank" (url cards, images, body links, the
//                          Show-on-Farcaster icon) with no rel. Browsers imply
//                          noopener there today, but spell it out.
//   relinkFarcasterAnchor— retarget the Show-on-Farcaster icon anchor
//                          (.farcaster-embed-farcaster-link) to the local
//                          waypoint and relabel its title, so the card's
//                          link-out matches the service's own. Class-scoped
//                          on purpose: avatar/profile anchors stay, and
//                          author-typed links in cast text are content — they
//                          keep their farcaster-embed-body-link class and are
//                          never touched.
// Seymour renders the card client-side, so the same rewrite runs as a DOM
// pass. The library renders nothing until its farcaster.tv fetch resolves
// (and swaps embeds in again on later updates), so a MutationObserver
// re-runs the pass on every subtree change; each write is guarded and
// idempotent, so the observer's own writes never loop.
function relinkEmbedLinks(root: ParentNode, waypoint: string) {
	for (const a of root.querySelectorAll<HTMLAnchorElement>(
		'a[target="_blank"]',
	)) {
		const rel = a.getAttribute("rel");
		if (!rel?.includes("noopener")) {
			a.setAttribute("rel", rel ? `${rel} noopener` : "noopener");
		}
	}
	for (const a of root.querySelectorAll<HTMLAnchorElement>(
		"a.farcaster-embed-farcaster-link",
	)) {
		if (a.getAttribute("href") !== waypoint) a.setAttribute("href", waypoint);
		if (a.getAttribute("title") !== ICON_TITLE) {
			a.setAttribute("title", ICON_TITLE);
		}
	}
}

/** Mounts one library card and keeps the link-out rewrite applied to it. */
const EmbedCardSlot = ({
	children,
	waypoint,
}: {
	children: ComponentChildren;
	waypoint: string;
}) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = ref.current;
		if (!root) return;
		relinkEmbedLinks(root, waypoint);
		const observer = new MutationObserver(() => {
			relinkEmbedLinks(root, waypoint);
		});
		observer.observe(root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["href", "rel", "title", "target"],
		});
		return () => observer.disconnect();
	}, [waypoint]);

	return <div ref={ref}>{children}</div>;
};

/** One card: native library embed, fed by whatever identity we can resolve. */
const EmbedCard = ({ cast }: { cast: HydratedCast }) => {
	// The library's fetch is keyed on username/hash — the shared dance asks
	// the shim's /u/{fid} when the payload carries no username, and
	// unresolvable flips only after that lookup finished empty.
	const { handle, unresolvable } = useResolvedHandle(
		cast.user.username,
		cast.user?.fid,
	);

	const card =
		handle !== undefined ? (
			<FarcasterEmbed
				username={handle}
				hash={cast.hash}
				options={EMBED_OPTIONS}
			/>
		) : unresolvable ? (
			// No resolvable username anywhere: the native fetch is unreachable,
			// so hand the library pre-mapped castData (lib/cast-data.ts) — same
			// renderer and embed handling, degraded data.
			<FarcasterEmbed castData={toCastData(cast)} options={EMBED_OPTIONS} />
		) : null;

	return (
		<EmbedCardSlot waypoint={conversationWaypoint(cast.hash)}>
			{card}
		</EmbedCardSlot>
	);
};

interface CastOrReplyProps {
	cast: HydratedCast;
}

export const CastOrReply = ({ cast }: CastOrReplyProps) => {
	// Card view swaps the whole row for the library's card, so a reply shows
	// its parent as a full card above its own (the self-rolled parent block
	// stays in the reader rows only). The parent renders from username + hash
	// — the same shape the old phase-3 CastOrReply fed the library.
	const isReply = !!cast.parentCastId;
	const parentUsername = useUsernameQuery(
		isReply ? cast.parentCastId?.fid : undefined,
	);

	return (
		<article className="py-3 text-base-content">
			{isReply && parentUsername.data && (
				<div className="mb-3 opacity-80">
					<EmbedCardSlot
						waypoint={conversationWaypoint(cast.parentCastId.hash)}
					>
						<FarcasterEmbed
							username={parentUsername.data}
							hash={cast.parentCastId.hash}
							options={EMBED_OPTIONS}
						/>
					</EmbedCardSlot>
				</div>
			)}
			<EmbedCard cast={cast} />
		</article>
	);
};
