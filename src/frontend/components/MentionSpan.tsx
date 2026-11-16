import { useUsernameQuery } from "../hooks/queries/useShimQuery";
import { useProfiles } from "../hooks/use-profiles";

// `plain` renders the name without the click: it lives inside a real link
// (a [label](url)'s label), where a nested button would be invalid.
export const MentionSpan = ({ fid, plain = false }: { fid: number; plain?: boolean }) => {
	const { data: username } = useUsernameQuery(fid);
	const { viewProfile } = useProfiles();

	if (plain) return <span class="link no-underline text-primary">@{username}</span>;

	return (
		<button
			type="button"
			class="link no-underline text-primary"
			onClick={(e) => {
				// the mention's click is the mention's, not the cast's around it
				e.stopPropagation();
				viewProfile(fid);
			}}
		>
			@{username}{" "}
		</button>
	);
};
