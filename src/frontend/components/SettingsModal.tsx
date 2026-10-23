import {
	Dialog,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import type { ReactNode } from "preact/compat";
import { Fragment } from "preact/compat";
import { useLocalStorageZustand } from "../hooks/use-zustand";
import { SignerPrivateKey } from "./SignerPrivateKey";

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface ToggleRowProps {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}

const ToggleRow = ({ label, checked, disabled, onChange }: ToggleRowProps) => (
	<label className="flex items-center justify-between py-2.5 cursor-pointer gap-4">
		<span className="text-sm">{label}</span>
		<input
			type="checkbox"
			className="toggle toggle-primary"
			disabled={disabled}
			checked={checked}
			onChange={(e) => onChange(e.currentTarget.checked)}
		/>
	</label>
);

interface GroupProps {
	title: string;
	children: ReactNode;
}

const Group = ({ title, children }: GroupProps) => (
	<section className="py-3 border-t border-base-content/10 first:border-t-0">
		<h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/45 mb-1">
			{title}
		</h4>
		{children}
	</section>
);

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
	const {
		showCardView,
		setShowCardView,
		showPfpAndDisplayName,
		setShowPfpAndDisplayName,
		showNavigationCaptions,
		setShowNavigationCaptions,
	} = useLocalStorageZustand();

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="modal modal-open" onClose={onClose}>
				{/** biome-ignore lint/a11y/noStaticElementInteractions: standard model concept */}
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
					<div className="modal-box bg-base-200">
						<DialogTitle as="h3" className="text-lg font-medium leading-6">
							Settings
						</DialogTitle>

						<div className="mt-2">
							<Group title="Feed">
								<ToggleRow
									label="Card view (inline embeds)"
									checked={showCardView}
									onChange={setShowCardView}
								/>
								<ToggleRow
									label="Zen mode (no avatars or names)"
									disabled={showCardView}
									checked={!showPfpAndDisplayName}
									onChange={(v) => setShowPfpAndDisplayName(!v)}
								/>
								<div className="flex justify-center py-1">
									{showPfpAndDisplayName ? (
										<img
											src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWQ2YWRuN2g1aXVmZmhmbmV3Zml2OHpxZDRhM3N0NWtheDIwN2UxdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/fIJKug8WuncQV50F1j/giphy.gif"
											alt="Audrey 2"
											className="w-32 h-32 rounded-box"
										/>
									) : (
										<div className="w-32 h-32 rounded-box bg-base-300" />
									)}
								</div>
							</Group>

							<Group title="Navigation">
								<ToggleRow
									label="Show navigation labels"
									checked={showNavigationCaptions}
									onChange={setShowNavigationCaptions}
								/>
							</Group>

							<Group title="Signer">
								<SignerPrivateKey />
							</Group>
						</div>

						<div className="modal-action">
							<button
								type="button"
								className="btn btn-primary btn-sm"
								onClick={onClose}
							>
								Done
							</button>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
};
