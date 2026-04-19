import { fetcher } from "itty-fetcher";
import { z } from "zod";

const warpcastApi = fetcher({ base: "https://api.farcaster.xyz" });

const VerificationSchema = z.object({
	fid: z.number(),
	platform: z.literal("x"),
	platformId: z.string(),
	platformUsername: z.string(),
	verifiedAt: z.number(),
});

const VerificationsResponseSchema = z.object({
	result: z.object({
		verifications: z.array(VerificationSchema),
	}),
	cursor: z.string().optional(),
});

const StarterPackMemberSchema = z.object({
	fid: z.number(),
	memberAt: z.number(),
});

const GetStarterPackMembersResponseSchema = z.object({
	result: z.object({
		members: z.array(StarterPackMemberSchema),
	}),
});

interface GetVerificationsResponse {
	ok: boolean;
	verifications: string[];
	message?: string;
}
export const getVerifications = async (
	fid: number,
	platform = "x",
): Promise<GetVerificationsResponse> => {
	try {
		const response = await warpcastApi.get(
			`/fc/account-verifications?fid=${fid}`,
		);
		const data = VerificationsResponseSchema.parse(response);
		return {
			ok: true,
			verifications: data.result.verifications
				.map((v) => (v.platform === platform ? v.platformUsername : null))
				.filter((username): username is string => username !== null),
		};
	} catch (error) {
		console.error(error);
		return {
			ok: false,
			verifications: [],
			message: `Failed to fetch verifications for fid ${fid}: ${error}`,
		};
	}
};

interface GetStarterPackMembersResponse {
	ok: boolean;
	members: z.infer<typeof StarterPackMemberSchema>[];
}

export const getStarterPackMembers = async (
	starterPackId: string,
): Promise<GetStarterPackMembersResponse> => {
	try {
		const response = await warpcastApi.get(
			`/fc/starter-pack-members?id=${starterPackId}`,
		);
		const data = GetStarterPackMembersResponseSchema.parse(response);
		return { ok: true, members: data.result.members };
	} catch (error) {
		console.error(error);
		return { ok: false, members: [] };
	}
};
