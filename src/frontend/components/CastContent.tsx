import type { VNode } from "preact";
import { useProfiles } from "../hooks/use-profiles";
import { useStickersQuery } from "../hooks/queries/useStickersQuery";
import { parseBlocks } from "../lib/cast-text";
import type { Block, InlinePiece } from "../lib/cast-text";
import { warpcastUrl } from "../lib/common";
import type { Sticker } from "../lib/stickers";
import type { HydratedCast } from "../types";
import { MentionSpan } from "./MentionSpan";
import { StickerImg } from "./StickerImg";

interface CastContentProps {
	cast: HydratedCast;
	zen?: boolean;
}

// Seymour's mentions arrive as byte positions in the UTF-8 text; the text
// parser works on JS strings. So each mention is encoded as a U+F0000-wrapped
// placeholder ref before parsing and swapped back at render time — the
// placeholder rides through paragraphs, quotes, lists and tables untouched,
// and the mention still flows inline exactly where the protocol put it.
const PH_OPEN = "\u{F0000}";
const PH_CLOSE = "\u{F0001}";

const encodeMentions = (cast: HydratedCast): { text: string; refs: Map<string, number> } => {
	const raw = cast.rawText ?? "";
	const bytes = new TextEncoder().encode(raw);
	const refs = new Map<string, number>();
	let out = "";
	let lastIndex = 0;
	let n = 0;
	const run = (from: number, to: number) => {
		if (to > from) out += new TextDecoder().decode(bytes.slice(from, to));
	};
	for (const pos of [...cast.mentionsPositions].sort((a, b) => a - b)) {
		run(lastIndex, pos);
		const fid = cast.mentions[cast.mentionsPositions.indexOf(pos)];
		const ref = (n++).toString(36);
		refs.set(ref, fid);
		out += `${PH_OPEN}${ref}${PH_CLOSE}`;
		lastIndex = pos + 1;
	}
	run(lastIndex, bytes.length);
	return { text: out, refs };
};

const LINK_CLS = "link no-underline text-primary";

const stop = (e: MouseEvent) => e.stopPropagation();

const Pieces = ({
	pieces,
	refs,
	stickers,
	live = true,
}: {
	pieces: InlinePiece[];
	refs: Map<string, number>;
	stickers?: Map<string, Sticker>;
	live?: boolean;
}) => {
	const out: (string | VNode)[] = [];
	for (let i = 0; i < pieces.length; i++) {
		const p = pieces[i];
		switch (p.kind) {
			case "text":
				out.push(p.text);
				break;
			case "url":
				out.push(
					<a class={LINK_CLS} href={p.href} target="_blank" rel="noopener noreferrer nofollow" onClick={stop}>
						{p.label}
					</a>,
				);
				break;
			case "handle":
				out.push(
					<a
						class={LINK_CLS}
						href={`https://farcaster.xyz/${p.name}`}
						target="_blank"
						rel="noopener noreferrer nofollow"
						onClick={stop}
					>
						@{p.name}
					</a>,
				);
				break;
			case "link":
				out.push(
					<a class={LINK_CLS} href={p.href} target="_blank" rel="noopener noreferrer nofollow" onClick={stop}>
						<Pieces pieces={p.children} refs={refs} stickers={stickers} live={false} />
					</a>,
				);
				break;
			case "image": {
				// a manifest-known URL shrinks to a compact sticker (transparent,
				// contained); everything else keeps Quilcast's md-img frame
				const sticker = stickers?.get(p.src);
				if (sticker)
					out.push(
						<a
							class="inline-block align-middle cursor-zoom-in"
							href={p.src}
							target="_blank"
							rel="noopener noreferrer nofollow"
							onClick={stop}
						>
							<StickerImg src={p.src} sticker={sticker} />
						</a>,
					);
				else
					out.push(
						// Quilcast's md-img: block-shaped, contained, framed; the click
						// is the picture's own, not the cast's around it
						<a
							class="block my-1.5 cursor-zoom-in"
							href={p.src}
							target="_blank"
							rel="noopener noreferrer nofollow"
							onClick={stop}
						>
							<img
								src={p.src}
								alt={p.alt}
								loading="lazy"
								decoding="async"
								referrerPolicy="no-referrer"
								class="block max-w-full max-h-[360px] min-w-[120px] min-h-[60px] object-contain rounded-xl border border-base-content/10 bg-base-content/5"
							/>
						</a>,
					);
				break;
			}
			case "bold":
				out.push(<strong><Pieces pieces={p.children} refs={refs} stickers={stickers} live={live} /></strong>);
				break;
			case "em":
				out.push(<em><Pieces pieces={p.children} refs={refs} stickers={stickers} live={live} /></em>);
				break;
			case "strike":
				out.push(<s><Pieces pieces={p.children} refs={refs} stickers={stickers} live={live} /></s>);
				break;
			case "code":
				out.push(
					<code class="break-words font-mono text-[0.88em] bg-base-content/10 rounded px-1 py-px">{p.text}</code>,
				);
				break;
			case "mention-ref": {
				const fid = refs.get(p.ref);
				if (fid !== undefined) out.push(<MentionSpan fid={fid} plain={!live} />);
				break;
			}
		}
	}
	return <>{out}</>;
};

const Blocks = ({
	blocks,
	refs,
	stickers,
	zen,
}: {
	blocks: Block[];
	refs: Map<string, number>;
	stickers?: Map<string, Sticker>;
	zen: boolean;
}) => {
	const out: VNode[] = [];
	for (let i = 0; i < blocks.length; i++) {
		const b = blocks[i];
		switch (b.kind) {
			case "p":
				out.push(
					<div class={i ? "mt-1.5" : ""}>
						<Pieces pieces={b.pieces} refs={refs} stickers={stickers} />
					</div>,
				);
				break;
			case "heading": {
				const size = b.level === 1 ? "text-[1.3em]" : b.level === 2 ? "text-[1.15em]" : "text-[1.05em]";
				out.push(
					<div class={`font-semibold ${size} mt-1.5 mb-0.5`}>
						<Pieces pieces={b.pieces} refs={refs} stickers={stickers} />
					</div>,
				);
				break;
			}
			case "code-block":
				out.push(
					<pre class="my-1.5 max-w-full overflow-x-auto whitespace-pre-wrap break-words px-2.5 py-2 rounded-lg bg-base-content/5 border border-base-content/10 font-mono text-[0.88em]">
						<code class="whitespace-pre-wrap break-words">{b.text}</code>
					</pre>,
				);
				break;
			case "quote":
				out.push(
					<blockquote class="my-1.5 border-l-[3px] border-base-content/15 pl-2.5 text-base-content/70">
						<Blocks blocks={b.blocks} refs={refs} stickers={stickers} zen={zen} />
					</blockquote>,
				);
				break;
			case "list":
				out.push(
					b.ordered ? (
						<ol class="my-1.5 ps-6 list-decimal" start={b.start}>
							{b.items.map((item) => (
								<li class="list-item">
									<Blocks blocks={item} refs={refs} stickers={stickers} zen={zen} />
								</li>
							))}
						</ol>
					) : (
						<ul class="my-1.5 ps-6 list-disc">
							{b.items.map((item) => (
								<li class="list-item">
									<Blocks blocks={item} refs={refs} stickers={stickers} zen={zen} />
								</li>
							))}
						</ul>
					),
				);
				break;
			case "rule":
				out.push(<hr class="my-2 border-0 border-t border-base-content/15" />);
				break;
			case "table":
				out.push(
					<table class="my-1.5 block max-w-full overflow-x-auto border-collapse [white-space:normal]">
						<thead>
							<tr>
								{b.head.map((cell, k) => (
									<th class={`border border-base-content/15 px-2 py-[3px] font-semibold ${b.align[k] === "center" ? "text-center" : b.align[k] === "right" ? "text-right" : "text-left"}`}>
										<Pieces pieces={cell} refs={refs} stickers={stickers} />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{b.rows.map((row) => (
								<tr>
									{row.map((cell, k) => (
										<td class={`border border-base-content/15 px-2 py-[3px] ${b.align[k] === "center" ? "text-center" : b.align[k] === "right" ? "text-right" : "text-left"}`}>
											<Pieces pieces={cell} refs={refs} stickers={stickers} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>,
				);
				break;
		}
	}
	return <>{out}</>;
};

export const CastContent = ({ cast, zen = false }: CastContentProps) => {
	const { openUrl } = useProfiles();
	// The shim's readable text lives in `text`, with mentions already written
	// out, and `rawText` null. `rawText` is the protocol string (mention bytes
	// still to be put back) when a payload has both.
	const { text, refs } =
		cast.rawText != null
			? encodeMentions(cast)
			: { text: cast.text ?? "", refs: new Map<string, number>() };
	const blocks = parseBlocks(text);
	// localStorage warm-started, so stickers are known on the first paint of a
	// repeat visit; first-ever visits upgrade plain images to stickers in place
	const { data: stickers } = useStickersQuery();

	return (
		<div class="mt-1">
			<div
				dir="auto"
				className={`min-w-0 max-w-full whitespace-pre-wrap break-words ${
					zen
						? "font-serif text-[15px] leading-relaxed text-base-content/90"
						: "text-sm text-base-content/90 leading-snug"
				}`}
				onClick={() => openUrl(warpcastUrl(cast))}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						openUrl(warpcastUrl(cast));
					}
				}}
			>
				<Blocks blocks={blocks} refs={refs} stickers={stickers} zen={zen} />
			</div>
		</div>
	);
};
