// Shim → react-farcaster-embed data mapping.

//
// Lifted from ../forkcaster (worker/cast-data.ts), trimmed to Seymour's
// HydratedCast: no fname on users, and no unfurl service — Seymour never
// enriches URL embeds with Open Graph data client-side, so link cards
// degrade to hostname-title stubs exactly like forkcaster's unfurl-failure
// fallback. Pure functions — the I/O (native farcaster.tv fetch) stays
// inside the library.
//
// This path only runs for casts whose author has no resolvable username:
// the library's own fetch is keyed on username/hash (farcaster.tv CORS is
// open), so without a username the only way to render a card at all is to
// hand the library pre-mapped castData. Its native embed handling still
// renders the card.
import type { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import type { HydratedCast } from "../types";

// Same derivation forkcaster uses on its server import — the library only
// exports the component, so the data shape comes out of its signature.
export type EmbedCastData = NonNullable<
	Parameters<typeof FarcasterEmbed>[0]["castData"]
>;

// Shim embeds are raw message items: {url} or {castId} quotes, untyped.
// Warpcast-hosted cast images live on imagedelivery.net; external images
// usually carry an image extension. Everything else renders as a link embed.
export function isImageUrl(url: string): boolean {
	return (
		/imagedelivery\.net\//i.test(url) ||
		/\.(png|jpe?g|gif|webp|avif)([?#]|$)/i.test(url)
	);
}

// Quote embeds are dropped, not rendered: the embed bundle reads
// quote.author.pfp.url unguarded and Shim's message-level embeds carry no
// hydrated author data, so any quote card would either crash or render as
// an empty shell. URL embeds render as link cards via openGraph.
function urlOpenGraph(url: string): {
	url: string;
	domain: string;
	title: string;
} {
	try {
		const parsed = new URL(url);
		return { url, domain: parsed.hostname, title: parsed.hostname };
	} catch {
		return { url, domain: "", title: "" };
	}
}

/**
 * The display waterfall: displayName → username. For NAME slots —
 * the embed library renders author.displayName with NO fallback (an empty
 * <p> for a no-displayName author), so this guarantees something human
 * always renders on the card. NOT @-safe (displayName may carry emoji and
 * spaces): never feed it to an @handle or URL slot.
 */
function displayNameOf(user: {
	displayName?: string | null;
	username?: string | null;
}): string {
	const name = user?.displayName?.trim();
	if (name) return name;
	return user?.username?.trim() || "";
}

export function toCastData(cast: HydratedCast): EmbedCastData {
	const images: NonNullable<EmbedCastData["embeds"]>["images"] = [];
	const urls: NonNullable<EmbedCastData["embeds"]>["urls"] = [];
	for (const embed of cast.embeds ?? []) {
		if (embed.castId?.hash) continue;
		if (embed.url && isImageUrl(embed.url)) {
			images.push({
				type: "image",
				url: embed.url,
				sourceUrl: embed.url,
				alt: "",
			});
		} else if (embed.url) {
			const og = urlOpenGraph(embed.url);
			urls.push({
				type: "url",
				openGraph: og,
			});
		}
	}
	// The embed bundle reads e.recasts.count and e.tags.length unguarded, and
	// Shim's message data carries no engagement counts — stub them with zeros
	// so rendering can't crash.
	return {
		hash: cast.hash,
		text: cast.text ?? undefined,
		timestamp: cast.timestamp === undefined ? undefined : cast.timestamp * 1000,
		author: {
			fid: cast.user?.fid,
			username: cast.user?.username ?? undefined,
			displayName: displayNameOf(cast.user),
			pfp: { url: cast.user?.pfpUrl ?? undefined },
			profile: cast.user?.bio ? { bio: { text: cast.user.bio } } : undefined,
		},
		embeds: { images, urls },
		replies: { count: 0 },
		reactions: { count: 0 },
		recasts: { count: 0 },
		tags: [],
	};
}
