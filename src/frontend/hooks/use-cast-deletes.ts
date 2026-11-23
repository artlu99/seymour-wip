import { useQueryClient } from "@tanstack/react-query";
import { deleteCast } from "../lib/hubs";
import type { HydratedCast } from "../types";
import { useLocalStorageZustand, useDeletingCasts } from "./use-zustand";

// Shared delete orchestration for the single (CastFooter) and batch
// (FeedTimeLine) flows. Marks hashes deleting — rows gray out while the
// signed CastRemove is in flight — un-grays on failure, and holds
// successes grayed until the feed refetch drops them, so they never flash
// back during the gap between hub confirm and shim read.
export const useCastDeletes = () => {
	const queryClient = useQueryClient();
	const { signerFid, signerPrivateKey, feedFids } = useLocalStorageZustand();
	const {
		hashes: deletingCastHashes,
		addDeletingCastHash,
		removeDeletingCastHash,
	} = useDeletingCasts();

	const hasSigner = !!signerFid && !!signerPrivateKey;
	// Deletion is a CastRemove signed by the signer fid, so it can only ever
	// succeed on the signer's own casts — hide the affordance everywhere else.
	const canDeleteCast = (cast: HydratedCast) =>
		hasSigner && cast.user.fid === signerFid;

	const deleteCasts = async (hashes: string[]) => {
		if (!hasSigner || !signerFid || !signerPrivateKey || hashes.length === 0) {
			return hashes.map((hash) => ({ hash, ok: false }));
		}
		const pk = `0x${signerPrivateKey.replace("0x", "")}` as `0x${string}`;
		hashes.forEach((h) => addDeletingCastHash(h));

		const results = await Promise.allSettled(
			hashes.map((hash) => deleteCast(signerFid, pk, hash as `0x${string}`)),
		);

		const failed: string[] = [];
		const succeeded: string[] = [];
		results.forEach((result, i) => {
			if (result.status === "fulfilled") {
				succeeded.push(hashes[i]);
			} else {
				failed.push(hashes[i]);
				console.error(`Failed to delete cast ${hashes[i]}:`, result.reason);
			}
		});
		failed.forEach((h) => removeDeletingCastHash(h));

		if (succeeded.length > 0) {
			await queryClient.invalidateQueries({
				queryKey: ["keccers-feed", feedFids],
			});
			succeeded.forEach((h) => removeDeletingCastHash(h));
		}

		return hashes.map((hash, i) => ({
			hash,
			ok: results[i].status === "fulfilled",
		}));
	};

	return { hasSigner, canDeleteCast, deleteCasts, deletingCastHashes };
};
