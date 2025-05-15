import type { Hex } from "viem";

export const MAX_USD_TIP = 99.99;

export const pluralize = (count: number, word: string, suffix = "s") => {
	if (count === 1) {
		return `${count} ${word}`;
	}
	return `${count} ${word}${suffix}`;
};

export function dollarFormat(value: number, decimals = 2): string {
	if (value < 0) {
		return `-${dollarFormat(-value, decimals)}`;
	}
	if (value === 0) {
		return "-";
	}
	if (value < 0.01) {
		return "<1¢";
	}
	if (value < 1) {
		return value.toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		});
	}
	if (value > MAX_USD_TIP) {
		return `${value.toLocaleString("en-US", {
			minimumFractionDigits: 0,
			maximumFractionDigits: decimals,
		})} 🎩`;
	}
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	});
}

export function formatAddress(address: Hex, digits = 4) {
	return `${address.slice(0, digits + 2)}...${address.slice(-digits)}`;
}
