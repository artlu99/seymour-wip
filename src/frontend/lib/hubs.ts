import {
	FarcasterNetwork,
	Message,
	NobleEd25519Signer,
	ReactionType,
	makeReactionAdd,
} from "@farcaster/core";
import { Buffer } from "buffer";
import { fetcher } from "itty-fetcher";
import { hexToBytes } from "viem";

export async function likeCast(
	fid: number,
	pk: `0x${string}`,
	targetCast: {
		fid: number;
		hash: `0x${string}`;
	},
	hub: { url: string; k: string },
) {
	const client = fetcher({
		base: `https://${hub.url}`,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/octet-stream",
			"x-api-key": hub.k,
		},
	});
	const signer = new NobleEd25519Signer(hexToBytes(pk));

	console.log("Attempting to like cast using @farcaster/core...");
	const dataOptions = {
		fid,
		network: FarcasterNetwork.MAINNET,
	};
	const result = await makeReactionAdd(
		{
			targetCastId: {
				fid: targetCast.fid,
				hash: hexToBytes(targetCast.hash),
			},
			type: ReactionType.LIKE,
		},
		dataOptions,
		signer,
	);

	if (result.isErr()) {
		throw new Error(`Error creating message: ${result.error}`);
	}

	console.log("created message, encoding...");
	const messageBytes = Buffer.from(Message.encode(result.value).finish());
	console.log("encoded message, sending via Neynar HTTPS Hubs API...");

	try {
		const response = await client.post<Response>(
			"/v1/submitMessage",
			messageBytes,
		);
		console.log("Cast liked successfully");
		return response;
	} catch (e) {
		console.error("Error liking cast:", e);
		throw e;
	}
}
