import { render } from "preact";
import { StrictMode } from "preact/compat";
import App from "./App.tsx";

import "react-farcaster-embed/dist/styles.css";
import "remixicon/fonts/remixicon.css";
import "./index.css";

const root = document.getElementById("root");
if (root) {
	render(
		<StrictMode>
			<App />
		</StrictMode>,
		root,
	);
}
