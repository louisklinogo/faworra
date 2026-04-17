#!/usr/bin/env node

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { CheerioCrawler, log } from "crawlee";
import TurndownService from "turndown";

const DOCS_ORIGIN = "https://docs.mono.co";
const DOCS_PREFIX = `${DOCS_ORIGIN}/docs`;
const START_URL = process.env.MONO_DOCS_START_URL ?? DOCS_PREFIX;
const OUTPUT_DIR = path.resolve(process.cwd(), "docs/mono");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const INDEX_PATH = path.join(OUTPUT_DIR, "index.md");
const GENERATED_AT = new Date().toISOString();
const MAX_REQUESTS = Number.parseInt(
	process.env.MONO_DOCS_MAX_REQUESTS ?? "500",
	10
);
const MAX_CONCURRENCY = Number.parseInt(
	process.env.MONO_DOCS_CONCURRENCY ?? "8",
	10
);

const manifest = [];
const queued = new Set();

const turndown = new TurndownService({
	bulletListMarker: "-",
	codeBlockStyle: "fenced",
	headingStyle: "atx",
});

turndown.keep(["table", "thead", "tbody", "tr", "th", "td"]);

turndown.addRule("fencedCodeBlocksWithLanguage", {
	filter: (node) => {
		return (
			node.nodeName === "PRE" &&
			Boolean(node.firstChild) &&
			node.firstChild.nodeName === "CODE"
		);
	},
	replacement: (_content, node) => {
		const codeNode = node.firstChild;
		const className = codeNode?.getAttribute?.("class") ?? "";
		const languageMatch = className.match(/language-([\w-]+)/);
		const language = languageMatch?.[1] ?? "";
		const code = codeNode?.textContent?.replace(/\n$/, "") ?? "";

		return `\n\n0${language}\n${code}\n0\n\n`.replaceAll(
			"\u00060\u0006",
			"```"
		);
	},
});

const normalizeUrl = (value) => {
	if (!value) {
		return null;
	}

	let url;

	try {
		url = new URL(value, DOCS_PREFIX);
	} catch {
		return null;
	}

	if (url.origin !== DOCS_ORIGIN || !url.pathname.startsWith("/docs")) {
		return null;
	}

	url.hash = "";
	url.search = "";

	if (url.pathname !== "/docs" && url.pathname.endsWith("/")) {
		url.pathname = url.pathname.replace(/\/+$/, "");
	}

	if (url.pathname === "/docs/") {
		url.pathname = "/docs";
	}

	return url.toString();
};

const sanitizeSegment = (segment) => {
	const decoded = decodeURIComponent(segment).trim().toLowerCase();

	return (
		decoded
			.replace(/[^a-z0-9._-]+/g, "-")
			.replace(/-{2,}/g, "-")
			.replace(/^-+|-+$/g, "") || "index"
	);
};

const getOutputPath = (url) => {
	const { pathname } = new URL(url);
	const relative = pathname.replace(/^\/docs\/?/, "");

	if (!relative) {
		return path.join(OUTPUT_DIR, "index.md");
	}

	const segments = relative
		.split("/")
		.filter(Boolean)
		.map((segment) => sanitizeSegment(segment));

	const filename = `${segments.pop()}.md`;

	return path.join(OUTPUT_DIR, ...segments, filename);
};

const escapeFrontmatter = (value) =>
	value.replaceAll(/\\/g, "\\\\").replaceAll(/"/g, '\\"');

const extractTitle = ($) => {
	const articleTitle = $("article h1").first().text().trim();

	if (articleTitle) {
		return articleTitle;
	}

	const pageTitle = $("title").text().trim();

	if (!pageTitle) {
		return "Mono Docs";
	}

	return pageTitle.replace(/^Mono\s*-\s*/u, "").trim();
};

const extractDescription = ($) => {
	return $("meta[name='description']").attr("content")?.trim() ?? "";
};

const extractContentHtml = ($) => {
	const article = $("article").first();
	const main = $("main").first();
	const source = article.length > 0 ? article.clone() : main.clone();

	if (source.length === 0) {
		return "";
	}

	source
		.find("nav, aside, script, style, button, form, footer, header")
		.remove();

	return source.html()?.trim() ?? "";
};

const buildDocument = ({ description, markdown, title, url }) => {
	const frontmatter = [
		"---",
		`title: "${escapeFrontmatter(title)}"`,
		`source_url: "${escapeFrontmatter(url)}"`,
		`scraped_at: "${GENERATED_AT}"`,
		description ? `description: "${escapeFrontmatter(description)}"` : null,
		"---",
		"",
	]
		.filter(Boolean)
		.join("\n");

	return `${frontmatter}${markdown.trim() ? markdown.trim() : "> No content extracted."}\n`;
};

const buildIndex = (entries) => {
	const lines = [
		"# Mono Docs Mirror",
		"",
		`- Source: ${DOCS_PREFIX}`,
		`- Scraped at: ${GENERATED_AT}`,
		`- Pages: ${entries.length}`,
		"",
		"## Pages",
		"",
	];

	for (const entry of entries) {
		lines.push(`- [${entry.title}](./${entry.localPath}) — ${entry.sourceUrl}`);
	}

	lines.push("");

	return lines.join("\n");
};

const savePage = async ({ description, markdown, title, url }) => {
	const outputPath = getOutputPath(url);
	const relativePath = path
		.relative(OUTPUT_DIR, outputPath)
		.split(path.sep)
		.join("/");

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(
		outputPath,
		buildDocument({ description, markdown, title, url }),
		"utf8"
	);

	manifest.push({
		localPath: relativePath,
		sourceUrl: url,
		title,
	});

	log.info(`Saved ${url} -> docs/mono/${relativePath}`);
};

const queueDiscoveredLinks = async (crawler, $, currentUrl) => {
	const urls = new Set();

	$("a[href]").each((_index, element) => {
		const href = $(element).attr("href");
		const normalized = normalizeUrl(
			href ? new URL(href, currentUrl).toString() : null
		);

		if (!normalized || normalized === currentUrl || queued.has(normalized)) {
			return;
		}

		queued.add(normalized);
		urls.add(normalized);
	});

	if (urls.size === 0) {
		return;
	}

	await crawler.addRequests(
		Array.from(urls, (url) => ({
			uniqueKey: url,
			url,
		}))
	);
};

const start = normalizeUrl(START_URL);

if (!start) {
	throw new Error(`Invalid MONO_DOCS_START_URL: ${START_URL}`);
}

queued.add(start);

await rm(OUTPUT_DIR, { force: true, recursive: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const crawler = new CheerioCrawler({
	maxConcurrency: MAX_CONCURRENCY,
	maxRequestsPerCrawl: MAX_REQUESTS,
	requestHandler: async ({ $, request }) => {
		const currentUrl = normalizeUrl(request.loadedUrl ?? request.url);

		if (!currentUrl) {
			return;
		}

		const title = extractTitle($);
		const description = extractDescription($);
		const contentHtml = extractContentHtml($);
		const markdown = contentHtml ? turndown.turndown(contentHtml) : "";

		await savePage({
			description,
			markdown,
			title,
			url: currentUrl,
		});

		await queueDiscoveredLinks(crawler, $, currentUrl);
	},
	requestHandlerTimeoutSecs: 120,
	failedRequestHandler: async ({ request }) => {
		log.error(`Failed to scrape ${request.url}`);
	},
});

await crawler.run([
	{
		uniqueKey: start,
		url: start,
	},
]);

manifest.sort((left, right) => left.localPath.localeCompare(right.localPath));

await writeFile(
	MANIFEST_PATH,
	`${JSON.stringify(manifest, null, 2)}\n`,
	"utf8"
);
await writeFile(INDEX_PATH, buildIndex(manifest), "utf8");

log.info(`Done. Wrote ${manifest.length} pages to ${OUTPUT_DIR}`);
log.info(`Manifest: ${MANIFEST_PATH}`);
