import type { HydratedCast } from "../types";

interface CastContentProps {
	cast: HydratedCast;
	text: string;
	onUrlClick: (url: string) => void;
	onShowCardClick?: () => void;
}

export const CastContent = ({
	cast,
	text,
	onUrlClick,
	onShowCardClick,
}: CastContentProps) => (
	<>
		<p
			className="text-sm text-slate-500 whitespace-pre-wrap"
			onClick={() =>
				onUrlClick(
					`https://warpcast.com/${cast.user.username}/${cast.hash.slice(0, 10)}`,
				)
			}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					onUrlClick(
						`https://warpcast.com/${cast.user.username}/${cast.hash.slice(0, 10)}`,
					);
				}
			}}
		>
			{text?.length && text.length > 320 ? `${text?.slice(0, 320)}...` : text}
		</p>
		{cast.embeds.length > 0 && onShowCardClick && (
			<button
				type="button"
				className="btn btn-sm btn-outline text-content-primary"
				onClick={onShowCardClick}
			>
				+ show
			</button>
		)}
	</>
);
