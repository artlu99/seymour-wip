import type { SpamScores } from "../hooks/queries/useSpamQuery";
import type { HydratedCast } from "../types";

interface SpamPillsProps {
	cast: HydratedCast;
	scores?: SpamScores;
	zen?: boolean;
}

const pct = (score: number) => `${Math.round(score * 100)}%`;

// Quilcast's calibration: 0.7 is the default spam cutoff, 0.9 is near-certain.
const tone = (
	score: number,
): { badge: string; text: string; label: string } => {
	if (score >= 0.9) {
		return { badge: "badge-error", text: "text-error", label: "spam" };
	}
	if (score >= 0.7) {
		return {
			badge: "badge-error badge-soft",
			text: "text-error/80",
			label: "likely spam",
		};
	}
	if (score >= 0.4) {
		return {
			badge: "badge-warning badge-soft",
			text: "text-warning",
			label: "iffy",
		};
	}
	return {
		badge: "badge-success badge-soft",
		text: "text-success/70",
		label: "ok",
	};
};

const SpamPill = ({
	score,
	icon,
	what,
	zen,
}: {
	score: number;
	icon: string;
	what: string;
	zen: boolean;
}) => {
	const { badge, text, label } = tone(score);
	const title = `${what} spam score ${pct(score)} (${label}) · Quilcast`;
	if (zen) {
		return (
			<span title={title} className={`font-mono ${text} whitespace-nowrap`}>
				<i className={icon} aria-hidden="true" /> {pct(score)}
			</span>
		);
	}
	return (
		<span
			title={title}
			className={`badge badge-soft badge-xs gap-0.5 whitespace-nowrap ${badge}`}
		>
			<i className={icon} aria-hidden="true" />
			{pct(score)}
		</span>
	);
};

export const SpamPills = ({ cast, scores, zen = false }: SpamPillsProps) => {
	if (!scores) {
		return null;
	}
	const castScore = scores.byHash[cast.hash.toLowerCase()];
	const userScore = scores.byFid[String(cast.user.fid)];

	return (
		<>
			{typeof castScore === "number" && (
				<SpamPill
					score={castScore}
					icon="ri-chat-1-line"
					what="Cast"
					zen={zen}
				/>
			)}
			{typeof userScore === "number" && (
				<SpamPill
					score={userScore}
					icon="ri-user-line"
					what="Account"
					zen={zen}
				/>
			)}
		</>
	);
};
