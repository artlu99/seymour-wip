interface Cast {
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

interface User {
	fid: number;
	username: string | null;
	displayName: string | null;
	pfpUrl: string | null;
	primaryAddress: `0x${string}` | null;
	proNft: { order: number; timestamp: number } | null;
}

export interface Channel {
	id: string;
	url: string;
	name: string;
	imageUrl?: string;
}

export interface HydratedCast extends Cast {
	user: User;
	channel?: Channel;
	sentBy?: string | null;
}
