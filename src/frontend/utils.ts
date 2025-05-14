export const pluralize = (count: number, word: string, suffix = "s") => {
	if (count === 1) {
		return `${count} ${word}`;
	}
	return `${count} ${word}${suffix}`;
};
