import type { Handler, HandlerEvent } from "@netlify/functions";

const MAPI_BASE = "https://manage.kontent.ai/v2/projects";

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const CODE_OR_ID = `(?:${UUID}|[A-Za-z0-9_-]+)`;

const ALLOWED_PATHS: RegExp[] = [
  /^languages$/,
  /^types$/,
  /^items$/,
  new RegExp(`^items/${CODE_OR_ID}$`),
  new RegExp(`^items/${CODE_OR_ID}/variants$`),
  new RegExp(`^items/${CODE_OR_ID}/variants/${CODE_OR_ID}$`),
  new RegExp(`^types/${CODE_OR_ID}$`),
  new RegExp(`^snippets/${CODE_OR_ID}$`),
];

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Continuation",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Expose-Headers": "X-Continuation",
  },
  body: JSON.stringify(body),
});

const isAllowedPath = (path: string): boolean =>
  ALLOWED_PATHS.some((pattern) => pattern.test(path));

const normalizePath = (raw: string): string =>
  raw.replace(/^\/+/, "").replace(/\/+$/, "").split("?")[0] ?? "";

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Continuation",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Expose-Headers": "X-Continuation",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return json(405, {
      message: "Only GET is allowed",
      status: 405,
    });
  }

  const apiKey = process.env.KONTENT_MANAGEMENT_API_KEY;
  if (!apiKey) {
    return json(500, {
      message: "Server is missing KONTENT_MANAGEMENT_API_KEY",
      status: 500,
    });
  }

  const params = event.queryStringParameters ?? {};
  const environmentId = params.environmentId ?? params.env;
  const path = normalizePath(params.path ?? "");

  if (!environmentId) {
    return json(400, {
      message: "Query parameter environmentId is required",
      status: 400,
    });
  }

  if (!path) {
    return json(400, {
      message: "Query parameter path is required",
      status: 400,
    });
  }

  const pinnedEnv = process.env.KONTENT_ENVIRONMENT_ID;
  if (pinnedEnv && pinnedEnv !== environmentId) {
    return json(403, {
      message: "environmentId does not match the pinned environment",
      status: 403,
    });
  }

  if (!isAllowedPath(path)) {
    return json(403, {
      message: "Path is not allowlisted",
      status: 403,
      path,
    });
  }

  const url = `${MAPI_BASE}/${encodeURIComponent(environmentId)}/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  const continuation = event.headers["x-continuation"] ?? event.headers["X-Continuation"];
  if (continuation) {
    headers["X-Continuation"] = continuation;
  }

  try {
    const upstream = await fetch(url, { method: "GET", headers });
    const text = await upstream.text();
    const responseHeaders: Record<string, string> = {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Continuation",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Expose-Headers": "X-Continuation",
    };

    const nextContinuation = upstream.headers.get("X-Continuation");
    if (nextContinuation) {
      responseHeaders["X-Continuation"] = nextContinuation;
    }

    // Never echo the API key; forward upstream body as-is when JSON/text.
    return {
      statusCode: upstream.status,
      headers: responseHeaders,
      body: text,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream request failed";
    return json(502, { message, status: 502 });
  }
};
