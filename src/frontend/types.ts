interface Cast {
	fid: number;
	hash: `0x${string}`;
	text: string | null;
	rawText: string | null;
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
	// FIP "Cast Format and Chained Casts": 1 means article Markdown. Absent on
	// older shim payloads, which then render as ordinary casts.
	formatVersion?: number;
	chain?: {
		index?: number;
		count?: number;
		root?: {
			fid: number;
			hash: string;
		};
	} | null;
}

interface User {
	fid: number;
	username: string | null;
	displayName: string | null;
	pfpUrl: string | null;
	bio: string | null;
	primaryAddress: `0x${string}` | null;
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
