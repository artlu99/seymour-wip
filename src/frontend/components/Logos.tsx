import "./Logos.css";
import cloudflareLogo from "/Cloudflare_Logo.svg";
import honoLogo from "/hono.svg";
import preactLogo from "/preact.svg";
import viteLogo from "/vite.svg";

const uses = [
	{
		name: "Cloudflare",
		logo: cloudflareLogo,
		link: "https://workers.cloudflare.com/",
		className: "cloudflare",
	},
	{
		name: "Vite",
		logo: viteLogo,
		link: "https://vite.dev/",
		className: "vite",
	},
	{
		name: "Preact",
		logo: preactLogo,
		link: "https://preactjs.com/",
		className: "preact",
	},
	{
		name: "Hono",
		logo: honoLogo,
		link: "https://hono.dev/",
		className: "hono",
	},
];

export const Logos = ({ showText = true }: { showText?: boolean }) => {
	return (
		<div>
			<div className="flex flex-row justify-center gap-4">
				{uses.map((use) => (
					<a href={use.link} target="_blank" rel="noreferrer" key={use.name}>
						<img
							src={use.logo}
							className={`logo ${use.className}`}
							alt={use.name}
						/>
					</a>
				))}
			</div>
			{showText && (
				<div className="text-2xl font-bold">
					{uses.map((u) => u.name).join(" + ")}
				</div>
			)}
		</div>
	);
};
