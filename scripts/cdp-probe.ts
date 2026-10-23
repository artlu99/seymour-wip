// CDP probe against an already-running chromium (--remote-debugging-port=9222).
// Usage: bun design/_cdp-probe.ts <url> <waitMs> [outPng] [width] [height]
const url = process.argv[2];
const waitMs = Number(process.argv[3] ?? 12000);
const outPng = process.argv[4];
const width = Number(process.argv[5] ?? 430);
const height = Number(process.argv[6] ?? 1400);

const newTab = await fetch(
	`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`,
	{ method: "PUT" },
).then((r) => r.json());

const pending = new Map<number, (m: any) => void>();
const logs: string[] = [];
const failed: string[] = [];
let msgId = 0;
let ws: WebSocket;

const wsReady = new Promise<void>((resolve, reject) => {
	ws = new WebSocket(newTab.webSocketDebuggerUrl);
	ws.onopen = () => resolve();
	ws.onerror = () => reject(new Error("ws error"));
	ws.onmessage = (ev) => {
		const msg = JSON.parse(String(ev.data));
		if (msg.id && pending.has(msg.id)) {
			pending.get(msg.id)(msg);
			pending.delete(msg.id);
		} else if (msg.method) {
			handleEvent(msg);
		}
	};
});
await wsReady;

function send(method: string, params: any = {}) {
	return new Promise<any>((resolve) => {
		const id = ++msgId;
		pending.set(id, resolve);
		ws.send(JSON.stringify({ id, method, params }));
	});
}

function handleEvent(msg: any) {
	if (msg.method === "Runtime.consoleAPICalled") {
		const text = msg.params.args
			.map((a: any) => a.value ?? a.description ?? "")
			.join(" ");
		logs.push(`[${msg.params.type}] ${text}`);
	} else if (msg.method === "Runtime.exceptionThrown") {
		logs.push(
			`[exception] ${msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text}`,
		);
	} else if (msg.method === "Network.loadingFailed") {
		failed.push(
			`${msg.params.errorText} ${msg.params.blockedReason ?? ""} (${msg.params.type})`,
		);
	} else if (msg.method === "Network.responseReceived") {
		const { status, url: u } = msg.params.response;
		if (status >= 400) failed.push(`HTTP ${status} ${u}`);
	}
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
	width,
	height,
	deviceScaleFactor: 1,
	mobile: true,
});
await send("Page.navigate", { url });
await Bun.sleep(waitMs);

// seed localStorage then reload (arg 8: JSON stored under "zustand-store")
const seedStorage = process.argv[8];
if (seedStorage) {
	await send("Runtime.evaluate", {
		expression: `localStorage.setItem("zustand-store", ${JSON.stringify(seedStorage)})`,
	});
	await send("Page.navigate", { url });
	await Bun.sleep(waitMs);
}

const clickSelector = process.argv[7];
if (clickSelector) {
	await send("Runtime.evaluate", {
		expression: `document.querySelector(${JSON.stringify(clickSelector)})?.click()`,
	});
	await Bun.sleep(1200);
}

const summary = await send("Runtime.evaluate", {
	expression: `JSON.stringify({
		skeletons: document.querySelectorAll(".skeleton").length,
		feedItems: document.querySelectorAll('ul[role="feed"] > li').length,
		firstByline: document.querySelector('ul[role="feed"] h4')?.textContent ?? null,
	})`,
	returnByValue: true,
});
console.log("PAGE:", summary.result?.result?.value);
console.log("CONSOLE:");
for (const l of logs.slice(0, 20)) console.log(" ", l);
console.log("FAILED NETWORK:");
for (const f of failed.slice(0, 20)) console.log(" ", f);

if (outPng) {
	await send("Page.captureScreenshot", {
		format: "png",
		clip: { x: 0, y: 0, width, height, scale: 1 },
		captureBeyondViewport: true,
	}).then((r) => {
		Bun.write(outPng, Buffer.from(r.result.data, "base64"));
	});
	console.log("SHOT:", outPng);
}
ws.close();
process.exit(0);
