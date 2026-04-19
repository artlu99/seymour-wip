import { useContext } from "preact/hooks";
import {
	ProfileContext,
	type ProfileContextType,
} from "../providers/ProfileContext";

export function useProfiles(): ProfileContextType {
	const context = useContext(ProfileContext);
	if (context === undefined) {
		throw new Error("useProfiles must be used within a ProfileProvider");
	}
	return context;
}
