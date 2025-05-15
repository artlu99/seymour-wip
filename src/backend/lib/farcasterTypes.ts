import { z } from "zod";
// frame-sdk 0.0.26

export const FrameContextSchema = z.object({
	user: z.object({
		fid: z.number(),
		username: z.string().optional(),
		displayName: z.string().optional(),
		pfpUrl: z.string().optional(),
		location: z
			.object({
				placeId: z.string(),
				description: z.string(),
			})
			.optional(),
	}),
	client: z
		.object({
			clientFid: z.number(),
			added: z.boolean(),
			notificationDetails: z.any().optional(),
			safeAreaInsets: z.any().optional(),
		})
		.optional(),
});

declare const notificationDetailsSchema: z.ZodObject<
	{
		url: z.ZodString;
		token: z.ZodString;
	},
	"strip",
	z.ZodTypeAny,
	{
		url: string;
		token: string;
	},
	{
		url: string;
		token: string;
	}
>;
export type FrameNotificationDetails = z.infer<
	typeof notificationDetailsSchema
>;

type CastEmbedLocationContext = {
	type: "cast_embed";
	embed: string;
	cast: {
		fid: number;
		hash: string;
	};
};
type NotificationLocationContext = {
	type: "notification";
	notification: {
		notificationId: string;
		title: string;
		body: string;
	};
};
type LauncherLocationContext = {
	type: "launcher";
};
type ChannelLocationContext = {
	type: "channel";
	channel: {
		/**
		 * Channel key identifier
		 */
		key: string;
		/**
		 * Channel name
		 */
		name: string;
		/**
		 * Channel profile image URL
		 */
		imageUrl?: string;
	};
};
type LocationContext =
	| CastEmbedLocationContext
	| NotificationLocationContext
	| LauncherLocationContext
	| ChannelLocationContext;
type AccountLocation = {
	placeId: string;
	/**
	 * Human-readable string describing the location
	 */
	description: string;
};
type UserContext = {
	fid: number;
	username?: string;
	displayName?: string;
	/**
	 * Profile image URL
	 */
	pfpUrl?: string;
	location?: AccountLocation;
};
type SafeAreaInsets = {
	top: number;
	bottom: number;
	left: number;
	right: number;
};
type ClientContext = {
	clientFid: number;
	added: boolean;
	notificationDetails?: FrameNotificationDetails;
	safeAreaInsets?: SafeAreaInsets;
};
export type FrameContext = {
	user: UserContext;
	client?: ClientContext; // differs from official type
	location?: LocationContext;
};
