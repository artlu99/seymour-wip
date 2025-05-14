export interface Cast {
	fid: number;
	hash: `0x${string}`;
	text: string | null;
	embeds: {
		url?: string;
		castId?: {
			fid: number;
			hash: `0x${string}`;
		};
	}[];
	mentions: number[];
	mentionsPositions: number[];
	parentCastId: {
		fid: number;
		hash: `0x${string}`;
	};
	parentUrl: string;
	timestamp: number;
}

export interface HydratedCast extends Cast {
	username: string;
	channelId?: string;
}
