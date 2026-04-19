import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import { useProfiles } from "../hooks/use-profiles";

export const MentionSpan = ({ fid }: { fid: number }) => {
	const { data: username } = useUsernameQuery(fid);
	const { viewProfile } = useProfiles();

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
