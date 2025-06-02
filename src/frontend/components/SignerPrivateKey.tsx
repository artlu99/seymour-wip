import { useCallback, useState } from "preact/hooks";
import toast from "react-hot-toast";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { PkModal } from "./PkModal";

const fidRegex = /^[0-9]+$/;
const privateKeyRegex = /^0x[0-9a-fA-F]{64}$/;

export const SignerPrivateKey = () => {
	const { signerFid, signerPrivateKey, setSignerFid, setSignerPrivateKey } =
		useLocalStorageZustand();
	const [inputValue, setInputValue] = useState("");
	const [showModal, setShowModal] = useState(false);

	const handleFidInputChange = useCallback(
		(e: Event) => {
			const target = e.target as HTMLInputElement;
			const value = target.value ? Number(target.value) : null;
			setSignerFid(value);
		},
		[setSignerFid],
	);

	const handleInputChange = useCallback((e: Event) => {
		const target = e.target as HTMLInputElement;
		setInputValue(target.value);
	}, []);

	const handleSubmit = useCallback(() => {
		setSignerPrivateKey(inputValue);
	}, [inputValue, setSignerPrivateKey]);

	const handleKeyPress = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	const handleClear = useCallback(() => {
		setSignerPrivateKey(null);
		setInputValue("");
	}, [setSignerPrivateKey]);

	const handleCopy = useCallback(() => {
		if (signerPrivateKey) {
			navigator.clipboard.writeText(signerPrivateKey);
			toast.success("Copied to clipboard");
		}
	}, [signerPrivateKey]);

	const toggleModal = useCallback(() => {
		setShowModal(!showModal);
	}, [showModal]);

	return (
		<>
			{signerPrivateKey ? (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<form>
							<input
								type="tel"
								placeholder="signer FID"
								value={signerFid ?? ""}
								autoComplete="off"
								pattern={fidRegex.source}
								onChange={handleFidInputChange}
								className="input validator input-bordered join-item w-full min-w-[260px] focus:outline-none"
							/>
							<p className="validator validator-hint">must be a numeric FID</p>
						</form>
					</div>
					<div className="flex items-center justify-between">
						Private Key stored in browser only!
						<div className="join">
							<button
								type="button"
								onClick={handleCopy}
								className="btn btn-ghost btn-sm join-item"
								title="Copy to clipboard"
							>
								<i className="ri-file-copy-line" />
							</button>
							<button
								type="button"
								onClick={handleClear}
								className="btn btn-ghost btn-sm join-item"
								title="Clear private key"
							>
								<i className="ri-delete-bin-line" />
							</button>
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<div className="join w-full">
						<form>
							<input
								type="password"
								placeholder="[OPTIONAL] signer Private Key"
								value={inputValue}
								autoComplete="off"
								pattern={privateKeyRegex.source}
								onChange={handleInputChange}
								onKeyPress={handleKeyPress}
								className="input validator input-bordered join-item w-full min-w-[260px] focus:outline-none"
							/>
							<p className="validator validator-hint">
								must be a 40 character hex string
							</p>
						</form>
						<button
							type="button"
							onClick={handleSubmit}
							className="btn btn-primary join-item"
							disabled={!inputValue || !privateKeyRegex.test(inputValue)}
						>
							<i className="ri-arrow-right-line" />
						</button>
						<button
							type="button"
							onClick={toggleModal}
							className="btn btn-ghost join-item"
							title="Learn more about private keys"
						>
							<i className="ri-question-line" />
						</button>
					</div>
				</div>
			)}

			{/* Modal */}
			<PkModal showModal={showModal} toggleModal={toggleModal} />
		</>
	);
};
