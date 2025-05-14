import { formatDistanceToNow } from "date-fns";
import { useZustand } from "../hooks/use-zustand";

export const ClickableDateSpan = ({ timestamp }: { timestamp: number }) => {
	const { isRelative, setIsRelative } = useZustand();

	const date = new Date(timestamp * 1000);
	const dateString = date.toLocaleString();
	const relativeDateString = formatDistanceToNow(date, {
		addSuffix: true,
	});

	return (
		<span
			onClick={() => setIsRelative(!isRelative)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					setIsRelative(!isRelative);
				}
			}}
		>
			{isRelative ? relativeDateString : dateString}
		</span>
	);
};
