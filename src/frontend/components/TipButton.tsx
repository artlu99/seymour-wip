import toast from "react-hot-toast";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { MAX_USD_TIP, dollarFormat } from "../utils";

interface TipButtonProps {
	username: string;
	fid: number;
	recipient: `0x${string}`;
	tokenSymbol: string;
	amount: number;
	castHash: string | null;
	degenPrice?: number;
	disabled?: boolean;
}

export function TipButton({
	username,
	fid,
	recipient,
	tokenSymbol,
	amount,
	castHash,
	degenPrice,
	disabled,
}: TipButtonProps) {
	const { contextFid, context, ethProvider, connectedWallet } = useFrameSDK();

	const tipAmount =
		tokenSymbol === "USDC" || amount > MAX_USD_TIP
			? amount
			: Math.round(amount / (degenPrice ?? 0));

	async function ensureBaseChain() {
		const chainId = await ethProvider.request({
			method: "eth_chainId",
		});
		const chainIdDecimal =
			typeof chainId === "number" ? chainId : Number.parseInt(chainId, 16);
		if (chainIdDecimal !== 8453) {
			await ethProvider.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: "0x2105" }], // Base mainnet chainId
			});
		}
	}

	async function sendERC20(
		recipient: string,
		amt: number,
		tokenSymbol: string,
		dollarsPerUnit: number,
		castHash: string | null,
	) {
		const decimals = tokenSymbol === "USDC" ? 6 : 18; // USDC has 6 decimals
		const tokenAddress =
			tokenSymbol === "DEGEN"
				? "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
				: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

		try {
			await ensureBaseChain();

			const from = await connectedWallet() ?? undefined;
			const to = `0x${tokenAddress.replace("0x", "")}` as `0x${string}`;

			const amountHex = formatAmount(amt, decimals);
			const amountNoPrefix = amountHex.startsWith("0x")
				? amountHex.slice(2)
				: amountHex;

			const transferFunctionSignature = "0xa9059cbb";
			const recipientPadded = formatAddress(recipient);
			const paddedAmount = amountNoPrefix.padStart(64, "0");

			const data =
				`${transferFunctionSignature}${recipientPadded}${paddedAmount}` as `0x${string}`;

			const txHash = await ethProvider.request({
				method: "eth_sendTransaction",
				params: [{ from, to, data, value: "0x0" }],
			});

			// post the log-transaction api
			try {
				await fetch("https://picosub.artlu.xyz/api/log-transaction", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						idempotencyKey: txHash,
						senderFid: contextFid,
						recipientFid: fid,
						amount: amountHex,
						amountUsdCents: Math.round(tipAmount * dollarsPerUnit * 100),
						tokenAddress: tokenAddress,
						tokenSymbol: tokenSymbol,
						timestamp: Date.now().toString(),
						payload: {
							username: context?.user?.username, // this is the sender's username
							recipient: username, // this is the recipient's username
							amount: amt.toString(),
							symbol: tokenSymbol,
							castHash,
						},
						txnHash: txHash,
					}),
				});
			} catch (error) {
				console.error(
					"Unable to log transaction:",
					error instanceof Error ? error.message : String(error),
				);
			}
			toast.success(`Sent ${amount} $${tokenSymbol} to ${username}`);

			return txHash;
		} catch (error) {
			throw new Error(
				`Did not send ${tokenSymbol}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	const handleClick = async () => {
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}
		try {
			await sendERC20(
				recipient,
				tipAmount,
				tokenSymbol,
				tokenSymbol === "USDC" ? 1.0 : (degenPrice ?? 0),
				castHash,
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to send tip",
			);
		}
	};

	return (
		<button
			type="button"
			onClick={() => handleClick()}
			disabled={disabled}
			className={"btn btn-circle btn-ghost btn-sm text-base-content/60"} 
		>
			{tokenSymbol === "USDC"
				? `${dollarFormat(tipAmount)} `
				: `${tipAmount.toLocaleString()} $`}
		</button>
	);
}

// Helper functions
function formatAmount(amount: number, decimals: number) {
	const wei = BigInt(Math.floor(amount * 10 ** decimals)).toString(16);
	return `0x${wei}`;
}

function formatAddress(address: string) {
	return address.slice(2).padStart(64, "0");
}
