import { useEffect, useRef, useState } from "preact/hooks";

/**
 * True once the referenced element has entered the viewport (with a little
 * lead room), latched for the element's life. Lets per-row hydration fire
 * for each cast actually shown instead of for the whole scrolled history
 * at mount.
 */
export const useInViewOnce = <T extends HTMLElement>() => {
	const ref = useRef<T>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el || inView) return;
		if (typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "200px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [inView]);

	return { ref, inView };
};
