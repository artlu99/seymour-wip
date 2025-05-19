import { useEffect, useState } from "preact/hooks";
import { Link, useLocation } from "wouter";
import { useLocalStorageZustand, useZustand } from "../hooks/use-zustand";
import { SettingsModal } from "./SettingsModal";
import { ThemeSelectorToggle } from "./ThemeToggleButton";

export const Dock = () => {
	const [location] = useLocation();
	const isActive = (path: string) => location === path;
	const [isScrollingUp, setIsScrollingUp] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	const { isSettingsOpen, setIsSettingsOpen } = useZustand();
	const { showNavigationCaptions } = useLocalStorageZustand();

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			setIsScrollingUp(currentScrollY < lastScrollY);
			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	return (
		<>
			<div
				className="dock dock-xs z-50 transition-all duration-300"
				style={{
					backgroundColor: isScrollingUp
						? "rgba(0, 0, 0, 0.85)"
						: "rgba(0, 0, 0, 0.15)",
				}}
			>
				<button type="button" className={isActive("/") ? "dock-active" : ""}>
					<Link to="/">
						<i class="ri-home-4-line text-xl" />
						{showNavigationCaptions && <div className="dock-label">Home</div>}
					</Link>
				</button>

				<button
					type="button"
					className={isActive("/feeds") ? "dock-active" : ""}
				>
					<Link to="/feeds">
						<i class="ri-inbox-line text-xl" />
						{showNavigationCaptions && <div className="dock-label">Feeds</div>}
					</Link>
				</button>

				<div>
					<ThemeSelectorToggle isScrollingUp={isScrollingUp} />
				</div>

				<button
					type="button"
					className={isSettingsOpen ? "dock-active" : ""}
					onClick={() => setIsSettingsOpen(!isSettingsOpen)}
				>
					<i class="ri-settings-5-line text-xl" />
					{showNavigationCaptions && (
						<span className="dock-label">Settings</span>
					)}
				</button>
			</div>
			<SettingsModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
		</>
	);
};
