import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import { useFrameSDK } from "../hooks/use-frame-sdk";

export const MentionSpan = ({ fid }: { fid: number }) => {
	const { data: username } = useUsernameQuery(fid);
	const { viewProfile } = useFrameSDK();

	return (
		<button
			type="button"
			className="link no-underline text-primary"
			onClick={() => viewProfile(fid)}
		>
			@{username}{" "}
		</button>
	);
};
