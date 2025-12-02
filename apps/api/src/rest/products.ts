import type { Context, Hono } from "hono";
import baseLogger from "../lib/logger";
import type { ApiEnv } from "../types/hono-env";

export function registerProductsRoutes(app: Hono<ApiEnv>) {
  // Upload product media to storage (product-media bucket)
  app.post("/products/uploads", handleUploadProductMedia);

  // Copy external URL into storage (server downloads and uploads to product-media bucket)
  app.post("/products/uploads/url", handleUploadFromUrl);
}

const HTTP = {
  BAD_REQUEST: 400,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const KB = 1024;
const MB = KB * KB;
const MAX_UPLOAD_MB = 25;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * MB; // 25MB
const HTTP_URL_REGEX = /^https?:\/\//i;

async function handleUploadProductMedia(c: Context<ApiEnv>): Promise<Response> {
  const logger = c.get("logger") || baseLogger;
  const start = Date.now();
  let productIdStr: string | undefined;
  try {
    const form = await c.req.formData();
    const val = form.get("file");
    const productId = form.get("productId");
    productIdStr = typeof productId === "string" ? productId : undefined;
    if (!val) {
      return c.json({ error: "file is required" }, HTTP.BAD_REQUEST);
    }
    if (!(val instanceof File)) {
      return c.json({ error: "invalid file" }, HTTP.BAD_REQUEST);
    }
    if (!productId || typeof productId !== "string") {
      return c.json({ error: "productId is required" }, HTTP.BAD_REQUEST);
    }

    const file = val as File;
    if ((file.size ?? 0) > MAX_UPLOAD_BYTES) {
      logger.warn(
        {
          productId: productId,
          sizeBytes: file.size ?? null,
          mimeType: file.type || null,
          durationMs: Date.now() - start,
        },
        "products.uploads:payload_too_large",
      );
      return c.json({ error: "file too large" }, HTTP.PAYLOAD_TOO_LARGE);
    }
    if (!String(file.type || "").toLowerCase().startsWith("image/")) {
      logger.warn(
        {
          productId: productId,
          sizeBytes: file.size ?? null,
          mimeType: file.type || null,
          durationMs: Date.now() - start,
        },
        "products.uploads:unsupported_media",
      );
      return c.json({ error: "only image uploads are allowed" }, HTTP.UNSUPPORTED_MEDIA_TYPE);
    }

    const supabase = c.get("supabaseAdmin");
    const teamId = c.get("teamId") as string;
    const id = crypto.randomUUID();
    const safeName = file.name || id;
    const path = `${teamId}/${productId}/${id}_${safeName}`;

    const { error: upErr } = await supabase.storage.from("product-media").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) {
      logger.error(
        { productId, error: upErr.message, durationMs: Date.now() - start },
        "products.uploads:error",
      );
      return c.json({ error: upErr.message }, HTTP.INTERNAL_SERVER_ERROR);
    }
    const { data: pub } = supabase.storage.from("product-media").getPublicUrl(path);

    const durationMs = Date.now() - start;
    logger.info(
      {
        productId,
        path,
        sizeBytes: file.size ?? null,
        mimeType: file.type || null,
        durationMs,
      },
      "products.uploads:success",
    );

    return c.json({
      path,
      url: pub.publicUrl,
      contentType: file.type || null,
      filename: safeName,
      size: file.size ?? null,
    });
  } catch (e: any) {
    logger.error(
      { productId: productIdStr, error: String(e?.message || e), durationMs: Date.now() - start },
      "products.uploads:error",
    );
    return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
  }
}

function parseUploadFromUrlRequest(
  c: Context<ApiEnv>,
): Promise<{ url: string; productId: string }> {
  const ct = c.req.header("content-type") || "";
  if (ct.includes("application/json")) {
    return c.req
      .json()
      .catch(() => ({}))
      .then((body: any) => ({
        url: typeof body?.url === "string" ? body.url : "",
        productId: typeof body?.productId === "string" ? body.productId : "",
      }));
  }
  return c.req.formData().then((form) => ({
    url: String(form.get("url") || ""),
    productId: String(form.get("productId") || ""),
  }));
}

async function downloadRemote(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`fetch failed: ${resp.status}`);
  }
  const buffer = await resp.arrayBuffer();
  const contentType = resp.headers.get("content-type") || "application/octet-stream";
  return { buffer, contentType };
}

function buildStoragePath(teamId: string, productId: string, sourceUrl: string) {
  let baseName = "file";
  try {
    const urlPath = new URL(sourceUrl).pathname;
    baseName = urlPath.split("/").filter(Boolean).pop() || baseName;
  } catch (_err) {
    // ignore URL parse errors; use default baseName
  }
  const id = crypto.randomUUID();
  const safeName = `${id}_${baseName}`;
  const path = `${teamId}/${productId}/${safeName}`;
  return { path, safeName };
}

async function handleUploadFromUrl(c: Context<ApiEnv>): Promise<Response> {
  const logger = c.get("logger") || baseLogger;
  const start = Date.now();
  try {
    const { url, productId } = await parseUploadFromUrlRequest(c);
    if (!(url && HTTP_URL_REGEX.test(url))) {
      return c.json({ error: "valid url is required" }, HTTP.BAD_REQUEST);
    }
    if (!productId) {
      return c.json({ error: "productId is required" }, HTTP.BAD_REQUEST);
    }

    const { buffer, contentType } = await downloadRemote(url);
    const size = buffer.byteLength;
    if (size > MAX_UPLOAD_BYTES) {
      logger.warn(
        { productId, sizeBytes: size, durationMs: Date.now() - start },
        "products.uploads_url:payload_too_large",
      );
      return c.json({ error: "file too large" }, HTTP.PAYLOAD_TOO_LARGE);
    }
    if (!String(contentType || "").toLowerCase().startsWith("image/")) {
      logger.warn(
        { productId, mimeType: contentType, durationMs: Date.now() - start },
        "products.uploads_url:unsupported_media",
      );
      return c.json({ error: "only image uploads are allowed" }, HTTP.UNSUPPORTED_MEDIA_TYPE);
    }

    const teamId = c.get("teamId") as string;
    const supabase = c.get("supabaseAdmin");
    const { path, safeName } = buildStoragePath(teamId, productId, url);

    const { error: upErr } = await supabase.storage
      .from("product-media")
      .upload(path, buffer, { contentType, upsert: false });
    if (upErr) {
      logger.error(
        { productId, error: upErr.message, durationMs: Date.now() - start },
        "products.uploads_url:error",
      );
      return c.json({ error: upErr.message }, HTTP.INTERNAL_SERVER_ERROR);
    }
    const { data: pub } = supabase.storage.from("product-media").getPublicUrl(path);

    const durationMs = Date.now() - start;
    logger.info(
      { productId, path, sizeBytes: size, mimeType: contentType, durationMs },
      "products.uploads_url:success",
    );

    return c.json({ path, url: pub.publicUrl, contentType, filename: safeName, size });
  } catch (e: any) {
    logger.error(
      { error: String(e?.message || e), durationMs: Date.now() - start },
      "products.uploads_url:error",
    );
    return c.json({ error: String(e?.message || e) }, HTTP.INTERNAL_SERVER_ERROR);
  }
}
