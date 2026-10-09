/**
 * Manual production probe — not a CI test.
 *
 * Hits live seymour.artlu.xyz + shim.artlu.xyz (incl. mutating /refresh and
 * /webhook). Run by hand when you want latency/ok-rate numbers; do not wire
 * into CI or deploy pipelines.
 *
 * Usage: bun scripts/bench-flows.ts [iterations]
 *
 * Flows covered (as exercised by the frontend in production):
 *  1. Landing page HTML load            GET  seymour.artlu.xyz/
 *  2. Farcaster manifest fetch          GET  /.well-known/farcaster.json
 *  3. App name (Landing hydration)      GET  /api/name
 *  4. Username -> fid lookup            GET  shim /f/:username
 *  5. fid -> username lookup            GET  shim /u/:fid
 *  6. Feed timeline load                POST shim /reverse-chron
 *  7. Cast detail (reply view)          GET  shim /i/:fid/:hash
 *  8. Feed refresh (mutation)           POST shim /refresh
 *  9. Webhook (FC events)               POST /api/webhook
 */

const SEYMOUR = "https://seymour.artlu.xyz";
const SHIM = "https://shim.artlu.xyz";

export {};

declare const process: {
	argv: string[];
	stdout: { write: (s: string) => void };
};

const N = Number(process.argv[2] ?? 25);
const WARMUP = 3;

const USERNAME = "dwr";
const FID = 3;
const HASH = "0x637dac8526ad7a2a1146cadb5b0ba60c77f95a71" as const;

interface Result {
	flow: string;
	n: number;
	min: number;
	p50: number;
	mean: number;
	p95: number;
	max: number;
	ok: number;
}

async function bench(
	flow: string,
	fn: () => Promise<boolean>,
	iterations = N,
	warmup = WARMUP,
): Promise<Result> {
	for (let i = 0; i < warmup; i++) await fn();
	const samples: number[] = [];
	let ok = 0;
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		try {
			const valid = await fn();
			if (valid) ok++;
		} catch (e) {
			console.error(`  ${flow} iteration ${i + 1} failed: ${e}`);
			continue; // failed calls don't contribute a latency sample
		}
		samples.push(performance.now() - start);
	}
	if (samples.length === 0) {
		return {
			flow,
			n: iterations,
			min: NaN,
			p50: NaN,
			mean: NaN,
			p95: NaN,
			max: NaN,
			ok: 0,
		};
	}
	samples.sort((a, b) => a - b);
	const min = samples[0];
	const max = samples[samples.length - 1];
	const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
	const p50 = samples[Math.floor(samples.length * 0.5)];
	const p95 =
		samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))];
	return { flow, n: iterations, min, p50, mean, p95, max, ok };
}

async function json(res: Response): Promise<unknown> {
	try {
		return await res.json();
	} catch {
		return null;
	}
}

// --- flow definitions -----------------------------------------------------

const flows: Array<{
	name: string;
	run: () => Promise<boolean>;
	iters?: number;
	warmup?: number;
}> = [
	{
		name: "Landing page HTML",
		run: async () => {
			const res = await fetch(`${SEYMOUR}/`);
			const html = await res.text();
			return res.status === 200 && html.includes("<script");
		},
	},
	{
		name: "Farcaster manifest",
		run: async () => {
			const res = await fetch(`${SEYMOUR}/.well-known/farcaster.json`);
			const j = (await json(res)) as { frameUrl?: string } | null;
			return res.status === 200 && !!j;
		},
	},
	{
		name: "GET /api/name",
		run: async () => {
			const res = await fetch(`${SEYMOUR}/api/name`);
			const j = (await json(res)) as { name?: string } | null;
			return res.status === 200 && j?.name === "Feed Me, Seymour";
		},
	},
	{
		name: "Shim GET /f/:username",
		run: async () => {
			const res = await fetch(`${SHIM}/f/${USERNAME}`);
			const j = (await json(res)) as { success?: boolean; fid?: number } | null;
			return res.status === 200 && j?.success === true && j?.fid === FID;
		},
	},
	{
		name: "Shim GET /u/:fid",
		run: async () => {
			const res = await fetch(`${SHIM}/u/${FID}`);
			const j = (await json(res)) as {
				success?: boolean;
				username?: string;
			} | null;
			return res.status === 200 && j?.success === true;
		},
	},
	{
		name: "Shim POST /reverse-chron",
		run: async () => {
			const res = await fetch(`${SHIM}/reverse-chron`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ fids: [FID], limit: 25, cursor: "" }),
			});
			const j = (await json(res)) as {
				success?: boolean;
				casts?: unknown[];
			} | null;
			return (
				res.status === 200 && j?.success === true && Array.isArray(j?.casts)
			);
		},
	},
	{
		name: "Shim GET /i/:fid/:hash",
		run: async () => {
			const res = await fetch(`${SHIM}/i/${FID}/${HASH}`);
			const j = (await json(res)) as {
				success?: boolean;
				cast?: unknown;
			} | null;
			return res.status === 200 && j?.success === true && !!j?.cast;
		},
	},
	{
		name: "Shim POST /refresh",
		run: async () => {
			const res = await fetch(`${SHIM}/refresh`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ fids: [FID] }),
			});
			const j = (await json(res)) as { success?: boolean } | null;
			return res.status === 200 && j?.success === true;
		},
		iters: 5,
		warmup: 1,
	},
	{
		name: "POST /api/webhook",
		run: async () => {
			const res = await fetch(`${SEYMOUR}/api/webhook`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ event: { object: "hub_event" }, data: {} }),
			});
			const j = (await json(res)) as { success?: boolean } | null;
			return res.status === 200 && j?.success === true;
		},
	},
];

// --- main -------------------------------------------------------------------

const results: Result[] = [];
for (const f of flows) {
	process.stdout.write(`Benchmarking: ${f.name} ... `);
	const r = await bench(f.name, f.run, f.iters ?? N, f.warmup ?? WARMUP);
	results.push(r);
	console.log(`p50=${r.p50.toFixed(0)}ms`);
}

const cols = ["flow", "n", "ok", "min", "p50", "mean", "p95", "max"];
const fmt = (r: Result) => ({
	flow: r.flow,
	n: String(r.n),
	ok: `${r.ok}/${r.n}`,
	min: `${r.min.toFixed(0)}ms`,
	p50: `${r.p50.toFixed(0)}ms`,
	mean: `${r.mean.toFixed(0)}ms`,
	p95: `${r.p95.toFixed(0)}ms`,
	max: `${r.max.toFixed(0)}ms`,
});

console.log("\n=== Happy-path flow benchmarks (prod) ===");
const rows = results.map(fmt);
const widths = cols.map((c) =>
	Math.max(c.length, ...rows.map((r) => r[c as keyof typeof r].length)),
);
const line = (cells: string[]) =>
	cells.map((c, i) => c.padEnd(widths[i])).join("  ");
console.log(line(cols));
console.log(widths.map((w) => "-".repeat(w)).join("  "));
for (const r of rows)
	console.log(line(cols.map((c) => r[c as keyof typeof r])));
