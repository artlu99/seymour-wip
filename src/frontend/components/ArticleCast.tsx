import { useQuery } from "@tanstack/react-query";
import { useState } from "preact/hooks";
import { useArticleQuery } from "../hooks/queries/useArticleQuery";
import { useCastIdQuery } from "../hooks/queries/useShimQuery";
import { useStickersQuery } from "../hooks/queries/useStickersQuery";
import {
	ARTICLE,
	articleKind,
	cardOpening,
	coverOf,
	displayOf,
	displayOfPart,
	headOf,
	hexHash,
	segments,
} from "../lib/article";
import type { Embed } from "../lib/article";
import { parseArticle } from "../lib/article-text";
import type { ArticleBlock, ArticleList, ArticlePiece } from "../lib/article-text";
import { safeUrl, shortUrl } from "../lib/cast-text";
import type { Sticker } from "../lib/stickers";
import { warpcastUrl } from "../lib/common";
import type { HydratedCast } from "../types";
import { MentionSpan } from "./MentionSpan";
import { StickerImg } from "./StickerImg";

const stop = (e: Event) => e.stopPropagation();

const LINK = "link no-underline text-primary";

const isDirectImage = (u: string) =>
	/\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(u) || /imagedelivery\.net|i\.imgur\.com/i.test(u);
const isDirectVideo = (u: string) => /\.(m3u8|mp4|webm|mov)(\?|$)/i.test(u);

// A URL embed Quilcast would unfurl: an image address renders as the picture
// (a content-type of image/*, or a URL that loads as one), anything else as a link.
function useEmbedKind(url: string) {
	const known = isDirectImage(url) ? "image" : isDirectVideo(url) ? "video" : null;
	const probed = useQuery({
		queryKey: ["embed-kind", url],
		enabled: !known,
		staleTime: Number.POSITIVE_INFINITY,
		queryFn: async (): Promise<"image" | "video" | "link"> => {
			try {
				const r = await fetch(url, { method: "HEAD" });
				const t = (r.headers.get("content-type") ?? "").toLowerCase();
				if (t.startsWith("image/")) return "image";
				if (t.startsWith("video/")) return "video";
				if (t) return "link";
			} catch {
				// HEAD blocked: fall through and see if it loads as a picture
			}
			return await new Promise((resolve) => {
				const img = new Image();
				const finish = (kind: "image" | "link") => resolve(kind);
				const timer = setTimeout(() => finish("link"), 8000);
				img.onload = () => {
					clearTimeout(timer);
					finish("image");
				};
				img.onerror = () => {
					clearTimeout(timer);
					finish("link");
				};
				img.referrerPolicy = "no-referrer";
				img.src = url;
			});
		},
	});
	return known ?? probed.data ?? "link";
}

const Pieces = ({
	pieces,
	refs,
	stickers,
	plain = false,
}: {
	pieces: ArticlePiece[];
	refs: Map<string, number>;
	stickers?: Map<string, Sticker>;
	plain?: boolean;
}) => {
	const out = [];
	for (let i = 0; i < pieces.length; i++) {
		const p = pieces[i];
		switch (p.kind) {
			case "text":
				out.push(p.text);
				break;
			case "br":
				out.push(<br key={i} />);
				break;
			case "url":
				out.push(
					<a key={i} className={LINK} href={p.href} target="_blank" rel="noopener noreferrer nofollow" onClick={stop}>
						{p.label}
					</a>,
				);
				break;
			case "handle":
				out.push(
					<a
						key={i}
						className={LINK}
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
					<a key={i} className={LINK} href={p.href} target="_blank" rel="noopener noreferrer nofollow" onClick={stop}>
						<Pieces pieces={p.children} refs={refs} stickers={stickers} plain />
					</a>,
				);
				break;
			case "image": {
				const sticker = stickers?.get(p.src);
				out.push(
					<a
						key={i}
						className={sticker ? "inline-block align-middle" : "my-1.5 block"}
						href={p.src}
						target="_blank"
						rel="noopener noreferrer nofollow"
						onClick={stop}
					>
						{sticker ? (
							<StickerImg src={p.src} sticker={sticker} />
						) : (
							<img
								src={p.src}
								alt={p.alt}
								loading="lazy"
								decoding="async"
								referrerPolicy="no-referrer"
								className="block max-h-[360px] min-h-[60px] min-w-[120px] max-w-full rounded-xl border border-base-content/10 bg-base-content/5 object-contain"
							/>
						)}
					</a>,
				);
				break;
			}
			case "bold":
				out.push(
					<strong key={i}>
						<Pieces pieces={p.children} refs={refs} stickers={stickers} plain={plain} />
					</strong>,
				);
				break;
			case "em":
				out.push(
					<em key={i}>
						<Pieces pieces={p.children} refs={refs} stickers={stickers} plain={plain} />
					</em>,
				);
				break;
			case "strike":
				out.push(
					<s key={i}>
						<Pieces pieces={p.children} refs={refs} stickers={stickers} plain={plain} />
					</s>,
				);
				break;
			case "under":
				out.push(
					<u key={i} className="underline-offset-2">
						<Pieces pieces={p.children} refs={refs} stickers={stickers} plain={plain} />
					</u>,
				);
				break;
			case "code":
				out.push(
					<code key={i} className="rounded bg-base-content/10 px-1 py-px font-mono text-[0.88em]">
						{p.text}
					</code>,
				);
				break;
			case "math":
				out.push(
					<code key={i} className="font-mono text-[0.88em] italic">
						{p.text}
					</code>,
				);
				break;
			case "mention-ref": {
				const fid = refs.get(p.ref);
				if (fid !== undefined) out.push(<MentionSpan key={i} fid={fid} plain={plain} />);
				break;
			}
		}
	}
	return <>{out}</>;
};

const ListBlock = ({
	list,
	refs,
	stickers,
}: {
	list: ArticleList;
	refs: Map<string, number>;
	stickers?: Map<string, Sticker>;
}) => {
	const Tag = list.ordered ? "ol" : "ul";
	return (
		<Tag className={`my-1 ps-6 ${list.ordered ? "list-decimal" : "list-disc"}`}>
			{list.items.map((item, i) => (
				<li key={i}>
					<Pieces pieces={item.pieces} refs={refs} stickers={stickers} />
					{item.kids.map((kid, k) => (
						<ListBlock key={k} list={kid} refs={refs} stickers={stickers} />
					))}
				</li>
			))}
		</Tag>
	);
};

const Blocks = ({
	blocks,
	refs,
	stickers,
}: {
	blocks: ArticleBlock[];
	refs: Map<string, number>;
	stickers?: Map<string, Sticker>;
}) => (
	<>
		{blocks.map((b, i) => {
			switch (b.kind) {
				case "p":
					return (
						<p key={i} className="mb-[0.45em]">
							<Pieces pieces={b.pieces} refs={refs} stickers={stickers} />
						</p>
					);
				case "gap":
					return <p key={i} className="mb-[0.45em] min-h-[0.6em]" />;
				case "heading": {
					const Tag = b.level === 2 ? "h3" : "h4";
					return (
						<Tag
							key={i}
							className={`mb-[0.35em] font-semibold leading-snug ${i ? "mt-[0.9em]" : "mt-1"} ${b.level === 2 ? "text-[1.35em]" : "text-[1.15em]"}`}
						>
							<Pieces pieces={b.pieces} refs={refs} stickers={stickers} />
						</Tag>
					);
				}
				case "quote":
					return (
						<blockquote
							key={i}
							className="my-1.5 border-l-[3px] border-base-content/15 pl-2.5 text-base-content/70"
						>
							{b.paras.map((para, k) => (
								<p key={k} className="mb-0">
									<Pieces pieces={para} refs={refs} stickers={stickers} />
								</p>
							))}
						</blockquote>
					);
				case "list":
					return <ListBlock key={i} list={b.list} refs={refs} stickers={stickers} />;
				case "code":
					return (
						<pre
							key={i}
							className="my-1.5 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-base-content/10 bg-base-content/5 px-2.5 py-2 font-mono text-[0.88em]"
						>
							<code className="whitespace-pre-wrap break-words">{b.text}</code>
						</pre>
					);
				case "math":
					return (
						<pre
							key={i}
							className="my-1.5 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-base-content/10 bg-base-content/5 px-2.5 py-2 font-mono text-[0.88em] italic"
						>
							<code className="whitespace-pre-wrap break-words">{b.text}</code>
						</pre>
					);
				case "rule":
					return <hr key={i} className="my-2 border-0 border-t border-base-content/15" />;
				case "table":
					return (
						<table key={i} className="my-1.5 block max-w-full overflow-x-auto border-collapse">
							<thead>
								<tr>
									{b.head.map((cell, k) => (
										<th key={k} className="border border-base-content/15 px-2 py-[3px] text-left font-semibold">
											<Pieces pieces={cell} refs={refs} stickers={stickers} />
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{b.rows.map((row, r) => (
									<tr key={r}>
										{row.map((cell, k) => (
											<td key={k} className="border border-base-content/15 px-2 py-[3px] text-left">
												<Pieces pieces={cell} refs={refs} stickers={stickers} />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					);
			}
		})}
	</>
);

// Quilcast .fa-cover: the first cast's one image. The frame is 2:1 and full
// width; a picture of another shape sits inside it (object-contain) on the
// soft background instead of being cropped. `framed` is the open article,
// where the cover is its own rounded block; the feed card clips it instead.
const CoverImage = ({ src, framed }: { src: string; framed?: boolean }) => (
	<img
		src={src}
		alt=""
		loading="lazy"
		decoding="async"
		referrerPolicy="no-referrer"
		className={`block aspect-[2/1] w-full bg-base-content/5 object-contain ${framed ? "mb-3 rounded-xl" : ""}`}
	/>
);

// Quilcast .imgs.n1: an embedded picture later in the article. It fills the
// column and keeps its own height (capped at 510px), rather than the cover's
// 2:1 frame.
const ArticleFigure = ({ url, stickers }: { url: string; stickers?: Map<string, Sticker> }) => {
	const sticker = stickers?.get(url);
	if (sticker)
		return (
			<a href={url} target="_blank" rel="noopener noreferrer nofollow" onClick={stop} className="inline-block">
				<StickerImg src={url} sticker={sticker} />
			</a>
		);
	return (
		<a href={url} target="_blank" rel="noopener noreferrer nofollow" onClick={stop} className="block w-full">
			<img
				src={url}
				alt=""
				loading="lazy"
				decoding="async"
				referrerPolicy="no-referrer"
				className="block h-auto w-full rounded-xl border border-base-content/15"
			/>
		</a>
	);
};

const LinkRow = ({ url }: { url: string }) => {
	let host = url;
	try {
		host = new URL(url).hostname.replace(/^www\./, "");
	} catch {
		// already not a URL; shortUrl still has something to show
	}
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer nofollow"
			onClick={stop}
			className="block rounded-xl border border-base-content/15 px-3 py-2 no-underline"
		>
			<span className="block text-xs text-base-content/50">{host}</span>
			<span className="block truncate text-sm text-base-content/80">{shortUrl(url)}</span>
		</a>
	);
};

const UrlEmbed = ({ url, stickers }: { url: string; stickers?: Map<string, Sticker> }) => {
	const kind = useEmbedKind(url);
	if (kind === "image") return <ArticleFigure url={url} stickers={stickers} />;
	if (kind === "video")
		return (
			<video
				className="aspect-video w-full max-h-[520px] rounded-xl bg-black"
				controls
				preload="metadata"
				src={url}
				onClick={stop}
			/>
		);
	return <LinkRow url={url} />;
};

const QuoteEmbed = ({ id }: { id: { fid: number; hash: string } }) => {
	const q = useCastIdQuery(id.fid, hexHash(id.hash));
	if (q.isError || (q.isSuccess && !q.data))
		return (
			<div className="rounded-xl border border-base-content/15 px-3 py-2 text-sm text-base-content/50">
				This cast is unavailable.
			</div>
		);
	if (!q.data)
		return <div className="h-16 animate-pulse rounded-xl border border-base-content/10 bg-base-content/5" />;
	const title = articleKind(q.data) === "article" ? headOf(q.data.text ?? "").title : null;
	return (
		<a
			href={warpcastUrl(q.data)}
			target="_blank"
			rel="noopener noreferrer nofollow"
			onClick={stop}
			className="block rounded-xl border border-base-content/15 px-3 py-2 no-underline"
		>
			<span className="text-xs font-medium text-base-content/80">
				@{q.data.user.username ?? q.data.user.displayName}
			</span>
			<span className="mt-0.5 block whitespace-pre-wrap text-sm text-base-content/70 line-clamp-4">
				{title || q.data.text}
			</span>
		</a>
	);
};

const ArticleEmbeds = ({ embeds, stickers }: { embeds: Embed[]; stickers?: Map<string, Sticker> }) => (
	<div className="my-2 flex flex-col gap-2">
		{embeds.map((e, i) => {
			if (e.castId) return <QuoteEmbed key={i} id={e.castId} />;
			const url = safeUrl(e.url);
			return url ? <UrlEmbed key={url} url={url} stickers={stickers} /> : null;
		})}
	</div>
);

/** One part's text and the embeds the text places, in article Markdown. */
const ArticleChunk = ({
	text,
	embeds,
	refs,
	skip = [],
	format = ARTICLE,
	zen,
	clamp,
}: {
	text: string;
	embeds: Embed[];
	refs: Map<string, number>;
	skip?: number[];
	format?: number;
	zen: boolean;
	clamp?: boolean;
}) => {
	const { data: stickers } = useStickersQuery();
	const face = `${zen ? "font-serif " : ""}min-w-0 max-w-full break-words ${
		clamp
			? "line-clamp-4 text-sm leading-relaxed text-base-content/70"
			: "text-[17px] leading-[1.55] text-base-content/90"
	}`;
	const segs = format === ARTICLE ? segments(text, embeds, skip) : null;
	if (!segs)
		return (
			<div className={`whitespace-pre-wrap ${face}`}>
				{text}
				<ArticleEmbeds embeds={embeds} stickers={stickers} />
			</div>
		);
	return (
		<>
			{segs.map((s, i) =>
				"text" in s ? (
					<div key={i} dir="auto" className={face}>
						<Blocks blocks={parseArticle(s.text)} refs={refs} stickers={stickers} />
					</div>
				) : (
					<ArticleEmbeds key={i} embeds={s.embeds} stickers={stickers} />
				),
			)}
		</>
	);
};

const openIfBare = (e: MouseEvent, open: () => void) => {
	const el = e.target as HTMLElement | null;
	if (el?.closest("a, button, video")) return;
	open();
};

const ArticleCard = ({
	cast,
	zen,
	onOpen,
}: {
	cast: HydratedCast;
	zen: boolean;
	onOpen: () => void;
}) => {
	const { text, refs } = displayOf(cast);
	const { title, opening } = headOf(text);
	const cover = coverOf(cast.embeds);
	const preview = cardOpening(opening, cast.embeds).trim();
	return (
		<div
			className={`not-prose mt-2 overflow-hidden rounded-xl border border-base-content/15 ${zen ? "font-serif" : ""}`}
			onClick={(e) => openIfBare(e, onOpen)}
		>
			{cover && <CoverImage src={cover} />}
			<div className="flex flex-col gap-1 px-3 py-2.5">
				<b className="break-words text-[1.15em] font-bold leading-snug" dir="auto">
					{title}
				</b>
				{preview && <ArticleChunk text={preview} embeds={[]} refs={refs} zen={zen} clamp />}
				<button
					type="button"
					className="w-fit text-sm font-semibold text-primary"
					onClick={onOpen}
				>
					Read article
				</button>
			</div>
		</div>
	);
};

const ArticleFull = ({
	cast,
	zen,
	onClose,
}: {
	cast: HydratedCast;
	zen: boolean;
	onClose: () => void;
}) => {
	const { text, refs } = displayOf(cast);
	const { title, opening } = headOf(text);
	const cover = coverOf(cast.embeds);
	const query = useArticleQuery(cast, true);
	return (
		<div className={`not-prose mt-2 ${zen ? "font-serif" : ""}`}>
			{cover && (
				<a href={cover} target="_blank" rel="noopener noreferrer nofollow" onClick={stop} className="block">
					<CoverImage src={cover} framed />
				</a>
			)}
			<h2 className="mb-2.5 break-words text-[1.6em] font-bold leading-tight" dir="auto">
				{title}
			</h2>
			<ArticleChunk text={opening} embeds={cast.embeds} refs={refs} skip={cover ? [0] : []} zen={zen} />
			{query.data?.parts.slice(1).map((p, i) => {
				if (!p)
					return (
						<p key={i} className="my-2 text-sm text-base-content/50">
							A part of this article is missing.
						</p>
					);
				const shown = displayOfPart(p);
				return (
					<ArticleChunk
						key={p.hash}
						text={shown.text}
						embeds={p.embeds}
						refs={shown.refs}
						format={p.format}
						zen={zen}
					/>
				);
			})}
			{query.isFetching && !query.data && (
				<p className="mt-2 text-sm text-base-content/50">Loading the rest of this article…</p>
			)}
			{query.isError && (
				<p className="mt-2 text-sm text-base-content/50">The rest of this article couldn't be loaded.</p>
			)}
			<button type="button" className="mt-2 text-sm font-semibold text-primary" onClick={onClose}>
				Show less
			</button>
		</div>
	);
};

/** An article's first cast: the cover, title and opening, and the rest on request. */
export const ArticleCast = ({ cast, zen }: { cast: HydratedCast; zen: boolean }) => {
	// Stay on the card until Read article. A chain can be 100 casts, so the
	// feed must not open one on load.
	const [open, setOpen] = useState(false);
	if (!open) return <ArticleCard cast={cast} zen={zen} onOpen={() => setOpen(true)} />;
	return <ArticleFull cast={cast} zen={zen} onClose={() => setOpen(false)} />;
};

/** A later part, on its own in the feed: the way back to the whole article. */
export const ArticlePartCast = ({ cast, zen }: { cast: HydratedCast; zen: boolean }) => {
	const [open, setOpen] = useState(false);
	const root = cast.chain?.root;
	const n = (cast.chain?.index ?? 0) + 1;
	const rootCast = useCastIdQuery(root?.fid, root ? hexHash(root.hash) : undefined, { enabled: open });
	if (!open)
		return (
			<button
				type="button"
				className={`mt-1.5 text-left text-sm font-semibold text-primary ${zen ? "font-serif" : ""}`}
				onClick={() => setOpen(true)}
			>
				Part {n} of an article · Read article
			</button>
		);
	if (rootCast.isError || (rootCast.isSuccess && !rootCast.data))
		return <p className="mt-2 text-sm text-base-content/50">This article couldn't be loaded.</p>;
	if (!rootCast.data)
		return <p className="mt-2 text-sm text-base-content/50">Loading article…</p>;
	return <ArticleFull cast={rootCast.data} zen={zen} onClose={() => setOpen(false)} />;
};
