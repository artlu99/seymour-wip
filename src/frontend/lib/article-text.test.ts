import { describe, expect, test } from "bun:test";
import { parseArticle } from "./article-text";
import type { ArticleBlock, ArticleList, ArticlePiece } from "./article-text";

// The same tags Quilcast's articleHtml emits, so a fixture from that renderer
// still compares after numeric entities are decoded.
const pieces = (ps: ArticlePiece[]): string =>
	ps
		.map((p) => {
			switch (p.kind) {
				case "text":
					return p.text;
				case "br":
					return "<br>";
				case "url":
					return `<a href="${p.href}" target="_blank" rel="noopener noreferrer nofollow">${p.label}</a>`;
				case "link":
					return `<a class="md-link" href="${p.href}" target="_blank" rel="noopener noreferrer nofollow">${pieces(p.children)}</a>`;
				case "image":
					return `<img class="md-img" src="${p.src}" alt="${p.alt}">`;
				case "bold":
					return `<strong>${pieces(p.children)}</strong>`;
				case "em":
					return `<em>${pieces(p.children)}</em>`;
				case "strike":
					return `<s>${pieces(p.children)}</s>`;
				case "under":
					return `<u>${pieces(p.children)}</u>`;
				case "code":
					return `<code>${p.text}</code>`;
				case "math":
					return `<code class="md-math">${p.text}</code>`;
				case "handle":
					return `<a href="/u/${p.name}">@${p.name}</a>`;
				case "mention-ref":
					return `@${p.ref}`;
			}
		})
		.join("");

const list = (l: ArticleList): string => {
	const tag = l.ordered ? "ol" : "ul";
	return `<${tag}>${l.items.map((it) => `<li>${pieces(it.pieces)}${it.kids.map(list).join("")}</li>`).join("")}</${tag}>`;
};

const htmlOf = (text: string) =>
	parseArticle(text)
		.map((b) => {
			switch (b.kind) {
				case "p":
					return `<p>${pieces(b.pieces)}</p>`;
				case "gap":
					return `<p class="md-gap"></p>`;
				case "heading":
					return `<h${b.level}>${pieces(b.pieces)}</h${b.level}>`;
				case "quote":
					return `<blockquote>${b.paras.map((p) => `<p>${pieces(p)}</p>`).join("")}</blockquote>`;
				case "list":
					return list(b.list);
				case "code":
					return `<pre><code>${b.text}</code></pre>`;
				case "math":
					return `<pre class="md-math"><code>${b.text}</code></pre>`;
				case "rule":
					return "<hr>";
				case "table": {
					const cell = (tag: string, cs: ArticlePiece[]) => `<${tag}>${pieces(cs)}</${tag}>`;
					const row = (tag: string, cells: ArticlePiece[][]) =>
						`<tr>${cells.map((c) => cell(tag, c)).join("")}</tr>`;
					return `<table><thead>${row("th", b.head)}</thead><tbody>${b.rows.map((r) => row("td", r)).join("")}</tbody></table>`;
				}
			}
		})
		.join("");

const norm = (s: string) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

// Fixtures are Quilcast's articleHtml for these strings.
const cases: [string, string][] = [
	["# Big\n## Small\n### not one", "<h2>Big</h2><h3>Small</h3><p>### not one</p>"],
	[
		"- a\n  - b\n    - c\n- d\n1. one\n2. two",
		"<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li><li>d</li></ul><ol><li>one</li><li>two</li></ol>",
	],
	["> said\n> more\nafter", "<blockquote><p>said</p><p>more</p></blockquote><p>after</p>"],
	["a\n\nb", '<p>a</p><p class="md-gap"></p><p>b</p>'],
	["one\\\ntwo\\\\\nthree", "<p>one<br>two&#92;</p><p>three</p>"],
	[
		"**b** _i_ ~~s~~ ++u++ snake_case_name",
		"<p><strong>b</strong> <em>i</em> <s>s</s> <u>u</u> snake_case_name</p>",
	],
	["\\*not em\\* \\_x\\_ C\\+\\+ \\a", "<p>&#42;not em&#42; &#95;x&#95; C&#43;&#43; \\a</p>"],
	[
		"\\# not a heading\n\\- not a list\n\\> nor a quote",
		"<p># not a heading</p><p>- not a list</p><p>&#62; nor a quote</p>",
	],
	['```js\nconst a = "<b>"\n```', "<pre><code>const a = &#34;&#60;b&#62;&#34;</code></pre>"],
	[
		"$$\nE = mc^2\n$$\n$$x^2$$\nand $$y$$ inline",
		'<pre class="md-math"><code>E = mc^2</code></pre><pre class="md-math"><code>x^2</code></pre><p>and <code class="md-math">y</code> inline</p>',
	],
	[
		"|a\\|b|c\\-d|\n|-|-|\n|1|2|",
		"<table><thead><tr><th>a|b</th><th>c-d</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>",
	],
	["---", "<hr>"],
	["`a\\*b` $$x\\_1 \\\\ y$$ \\*e\\*", "<p><code>a\\*b</code> <code class=\"md-math\">x\\_1 \\\\ y</code> &#42;e&#42;</p>"],
	[
		"[x](https://a.co/a\\_b) https://a.co/c\\_d",
		'<p><a class="md-link" href="https://a.co/a_b" target="_blank" rel="noopener noreferrer nofollow">x</a> <a href="https://a.co/c_d" target="_blank" rel="noopener noreferrer nofollow">a.co/c_d</a></p>',
	],
	[
		'<img src=x onerror=alert(1)> [x](javascript:alert) [ok](https://a.co)',
		'<p>&#60;img src=x onerror=alert(1)&#62; x <a class="md-link" href="https://a.co/" target="_blank" rel="noopener noreferrer nofollow">ok</a></p>',
	],
	["hi @ann", '<p>hi <a href="/u/ann">@ann</a></p>'],
	["\ue000", "<p>\uFFFD</p>"],
	["**Embedded casts **\n[$1]", "<p><strong>Embedded casts</strong> </p><p>[$1]</p>"],
];

describe("article Markdown, as Quilcast draws it", () => {
	for (const [src, html] of cases) {
		test(src.split("\n")[0].slice(0, 40), () => {
			expect(norm(htmlOf(src))).toBe(norm(html));
		});
	}

	test("an unclosed fence takes the rest and is closed by stopping", () => {
		const blocks = parseArticle("```\nconst a = 1");
		expect(blocks).toEqual([{ kind: "code", text: "const a = 1" }]);
	});
});

describe("the article under test", () => {
	const root =
		'When Blind Process Isn\'t Enough\n\n# 1. "you have one job!"\nMy agents built a [small tool](https://code.artlu.xyz/sns_secrets_cli) in Typescript, a developer-friendly language where it\'s easy to get stuff done.';

	test("the opening is a heading and a paragraph with the tool link", () => {
		const opening = root.split("\n").slice(2).join("\n");
		const blocks = parseArticle(opening);
		expect(blocks.map((b) => b.kind)).toEqual(["heading", "p"]);
		const heading = blocks[0] as ArticleBlock & { pieces: ArticlePiece[] };
		expect(heading.kind).toBe("heading");
		expect(pieces((blocks[0] as { pieces: ArticlePiece[] }).pieces)).toBe('1. "you have one job!"');
		const para = pieces((blocks[1] as { pieces: ArticlePiece[] }).pieces);
		expect(para).toContain('href="https://code.artlu.xyz/sns_secrets_cli"');
		expect(para).toContain(">small tool</a>");
	});
});
