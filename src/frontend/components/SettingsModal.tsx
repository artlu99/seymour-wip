import {
	Dialog,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { Fragment } from "preact/compat";
import { useLocalStorageZustand } from "../hooks/use-zustand";

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
	const { showCardView, setShowCardView } = useLocalStorageZustand();

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="modal modal-open" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="modal-backdrop backdrop-blur-sm" />
				</TransitionChild>

				<div className="modal-box">
					<DialogTitle as="h3" className="text-lg font-medium leading-6">
						Settings
					</DialogTitle>

					<div className="mt-4">
						<div className="form-control">
							<label className="label cursor-pointer justify-start gap-4">
								<span className="label-text">Show Card View</span>
								<input
									type="checkbox"
									className="toggle toggle-primary"
									checked={showCardView}
									onChange={(e) => setShowCardView(e.currentTarget.checked)}
								/>
							</label>
						</div>
					</div>

					<div className="modal-action">
						<button type="button" className="btn btn-ghost" onClick={onClose}>
							Close
						</button>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
};
