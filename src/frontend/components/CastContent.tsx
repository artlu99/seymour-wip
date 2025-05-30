import type { VNode } from "preact";
import type { HydratedCast } from "../types";
import { MentionSpan } from "./MentionSpan";

interface CastContentProps {
	cast: HydratedCast;
	onUrlClick: (url: string) => void;
	onShowCardClick?: () => void;
}

export const CastContent = ({
	cast,
	onUrlClick,
	onShowCardClick,
}: CastContentProps) => {
	const textInBytes = new TextEncoder().encode(cast.text ?? "");
	const pieces: (string | VNode)[] = [];
	let lastIndex = 0;

	// Sort mentions positions to process them in order
	const sortedMentionPositions = [...cast.mentionsPositions].sort(
		(a, b) => a - b,
	);

	// Process each mention position
	for (const mentionPos of sortedMentionPositions) {
		// Add text before the mention
		if (mentionPos > lastIndex) {
			const textBeforeMention = new TextDecoder().decode(
				textInBytes.slice(lastIndex, mentionPos),
			);
			pieces.push(textBeforeMention);
		}

		// Add the mention
		const mentionIndex = cast.mentionsPositions.indexOf(mentionPos);
		pieces.push(<MentionSpan fid={cast.mentions[mentionIndex]} />);

		lastIndex = mentionPos + 1;
	}

	// Add any remaining text after the last mention
	if (lastIndex < textInBytes.length) {
		const remainingText = new TextDecoder().decode(
			textInBytes.slice(lastIndex),
		);
		pieces.push(remainingText);
	}

	return (
		<div className="-mt-6">
			<p
				className="text-sm text-base-content whitespace-pre-wrap leading-tight"
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
				{pieces}
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
		</div>
	);
};
