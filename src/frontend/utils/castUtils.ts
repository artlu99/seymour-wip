import type { HydratedCast } from "../types";

export const injectMentions = (cast: HydratedCast) => {
	const rawText = cast.text;
	const textInBytes = new TextEncoder().encode(rawText ?? "");
	let processedBytes = textInBytes;

	// Process mentions in reverse order to maintain correct indices
	const mentionsPositions = cast.mentionsPositions;
	for (let i = mentionsPositions.length - 1; i >= 0; i -= 1) {
		const idx = mentionsPositions[i];
		const mention = cast.mentions[i];
		const mentionText = `[@${mention}]`;
		const mentionBytes = new TextEncoder().encode(mentionText);

		processedBytes = new Uint8Array([
			...Array.from(processedBytes.slice(0, idx)),
			...Array.from(mentionBytes),
			...Array.from(processedBytes.slice(idx)),
		]);
	}

	return new TextDecoder().decode(processedBytes);
};

export const getCastUrl = (cast: HydratedCast) =>
	`https://warpcast.com/${cast.user.username}/${cast.hash.slice(0, 10)}`;
