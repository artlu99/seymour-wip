import {
	Dialog,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { Fragment } from "preact/compat";
import { useFrameSDK } from "../hooks/use-frame-sdk";
import { useLocalStorageZustand } from "../hooks/use-zustand";
interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
	const {
		showCardView,
		setShowCardView,
		showPfpAndDisplayName,
		setShowPfpAndDisplayName,
		showTipButtons,
		setShowTipButtons,
		showNavigationCaptions,
		setShowNavigationCaptions,
	} = useLocalStorageZustand();

	const { contextFid } = useFrameSDK();

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="modal modal-open" onClose={onClose}>
				<div
					className="modal-backdrop backdrop-blur-sm"
					onClick={onClose}
					onKeyDown={(e) => e.key === "Escape" && onClose()}
					role="presentation"
				/>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="modal-box">
						<DialogTitle as="h3" className="text-lg font-medium leading-6">
							Settings
						</DialogTitle>

						<div className="mt-4">
							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-4">
									<input
										type="checkbox"
										className="toggle toggle-primary"
										checked={showCardView}
										onChange={(e) => setShowCardView(e.currentTarget.checked)}
									/>
									<span className="label-text">Show Card View</span>
								</label>
							</div>
						</div>

						<div className="mt-4">
							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-4">
									<input
										type="checkbox"
										className="toggle toggle-primary"
										disabled={showCardView}
										checked={!showPfpAndDisplayName}
										onChange={(e) =>
											setShowPfpAndDisplayName(!e.currentTarget.checked)
										}
									/>
									<span className="label-text">Display Feed in Zen Mode</span>
								</label>
							</div>
						</div>

						{contextFid ? (
							<div className="mt-4">
								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-4">
										<input
											type="checkbox"
											className="toggle toggle-primary"
											checked={showTipButtons}
											onChange={(e) =>
												setShowTipButtons(e.currentTarget.checked)
											}
										/>
										<span className="label-text">Show Tip Buttons</span>
									</label>
								</div>
							</div>
						) : null}

						<div className="mt-4">
							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-4">
									<input
										type="checkbox"
										className="toggle toggle-primary"
										checked={showNavigationCaptions}
										onChange={(e) =>
											setShowNavigationCaptions(e.currentTarget.checked)
										}
									/>
									<span className="label-text">Show Navigation Labels</span>
								</label>
							</div>
						</div>

						<div className="modal-action">
							<button type="button" className="btn btn-ghost" onClick={onClose}>
								Close
							</button>
						</div>

						<div className="mt-4">
							{showPfpAndDisplayName ? (
								<img
									src={
										"https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWQ2YWRuN2g1aXVmZmhmbmV3Zml2OHpxZDRhM3N0NWtheDIwN2UxdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/fIJKug8WuncQV50F1j/giphy.gif"
									}
									alt="Audrey 2"
									className="mx-auto w-64 h-64"
								/>
							) : (
								<div className="mx-auto w-64 h-64 bg-base-100 rounded-full" />
							)}
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
};
