import type { Sticker } from "../lib/stickers";

// A recognized sticker, compact per the sticker doc: small, transparent
// background, aspect preserved, alt kept, and still just an image link —
// open/share behave exactly like any image. Unrecognized URLs never reach
// here (they render as plain images), but `sticker` is optional so the
// compact size stays one decision away from the manifest data.
export const StickerImg = ({ src, sticker }: { src: string; sticker?: Sticker }) => (
	<img
		src={src}
		alt={sticker?.alt || sticker?.name || ""}
		title={sticker?.name}
		loading="lazy"
		decoding="async"
		referrerPolicy="no-referrer"
		class="inline-block h-28 w-28 object-contain align-middle"
	/>
);
