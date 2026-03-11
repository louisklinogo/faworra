import "server-only";

import type { IncomingMessage } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const LOCALHOST_LOOPBACK_ADDRESS = "127.0.0.1";

const isPortlessLocalHostname = (hostname: string): boolean =>
	hostname !== "localhost" && hostname.endsWith(".localhost");

const getDefaultPort = (protocol: string): number =>
	protocol === "https:" ? 443 : 80;

const getResponseHeaders = (response: IncomingMessage): Headers => {
	const responseHeaders = new Headers();

	for (const [key, value] of Object.entries(response.headers)) {
		if (!value) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const entry of value) {
				responseHeaders.append(key, entry);
			}
			continue;
		}

		responseHeaders.set(key, value);
	}

	return responseHeaders;
};

const getRequestBody = async (
	body: RequestInit["body"]
): Promise<Buffer | undefined> => {
	if (!body) {
		return undefined;
	}

	if (typeof body === "string") {
		return Buffer.from(body);
	}

	if (body instanceof URLSearchParams) {
		return Buffer.from(body.toString());
	}

	if (body instanceof Blob) {
		return Buffer.from(await body.arrayBuffer());
	}

	if (body instanceof ArrayBuffer) {
		return Buffer.from(body);
	}

	if (ArrayBuffer.isView(body)) {
		return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
	}

	throw new Error("Unsupported request body for local Portless SSR fetch");
};

export const portlessAwareFetch = async (
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> => {
	const url =
		input instanceof Request ? new URL(input.url) : new URL(input.toString());

	if (!isPortlessLocalHostname(url.hostname)) {
		return fetch(input, init);
	}

	const requestHeaders = new Headers(init?.headers);
	requestHeaders.set("host", url.host);
	const port = url.port ? Number(url.port) : getDefaultPort(url.protocol);

	const requestBody = await getRequestBody(init?.body);
	if (requestBody && !requestHeaders.has("content-length")) {
		requestHeaders.set("content-length", `${requestBody.byteLength}`);
	}

	return new Promise((resolve, reject) => {
		const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;
		const request = requestImpl(
			{
				hostname: LOCALHOST_LOOPBACK_ADDRESS,
				port,
				path: `${url.pathname}${url.search}`,
				method: init?.method ?? "GET",
				headers: Object.fromEntries(requestHeaders.entries()),
			},
			(response) => {
				const chunks: Buffer[] = [];

				response.on("data", (chunk: Buffer | string) => {
					chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
				});
				response.on("end", () => {
					resolve(
						new Response(Buffer.concat(chunks), {
							headers: getResponseHeaders(response),
							status: response.statusCode ?? 500,
						})
					);
				});
			}
		);

		request.on("error", reject);

		if (requestBody) {
			request.write(requestBody);
		}

		request.end();
	});
};
