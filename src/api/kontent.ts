import type {
  ContentItem,
  ContentItemVariant,
  ContentSnippet,
  ContentType,
  Language,
} from "../types";

export class KontentApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "KontentApiError";
    this.status = status;
  }
}

interface ProxyErrorBody {
  readonly message?: string;
  readonly status?: number;
}

const proxyBase = (): string => {
  if (import.meta.env.VITE_KONTENT_PROXY_URL) {
    return String(import.meta.env.VITE_KONTENT_PROXY_URL);
  }
  // Prefer the Netlify rewrite during local `netlify dev` and production.
  return "/api/kontent";
};

const buildUrl = (environmentId: string, path: string): string => {
  const url = new URL(proxyBase(), window.location.origin);
  url.searchParams.set("environmentId", environmentId);
  url.searchParams.set("path", path);
  return url.toString();
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ProxyErrorBody;
    if (body.message) {
      return body.message;
    }
  } catch {
    // ignore JSON parse failures
  }
  return response.statusText || "Request failed";
};

async function proxyGet<T>(
  environmentId: string,
  path: string,
  continuation?: string,
): Promise<{ data: T; continuation: string | null }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (continuation) {
    headers["X-Continuation"] = continuation;
  }

  const response = await fetch(buildUrl(environmentId, path), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new KontentApiError(response.status, message);
  }

  const data = (await response.json()) as T;
  return {
    data,
    continuation: response.headers.get("X-Continuation"),
  };
}

interface LanguagesResponse {
  readonly languages: Language[];
}

interface ItemsVariantsResponse {
  readonly variants: ContentItemVariant[];
}

export async function getLanguages(environmentId: string): Promise<Language[]> {
  const languages: Language[] = [];
  let continuation: string | undefined;

  do {
    const page = await proxyGet<LanguagesResponse>(
      environmentId,
      "languages",
      continuation,
    );
    languages.push(...page.data.languages);
    continuation = page.continuation ?? undefined;
  } while (continuation);

  return languages;
}

export async function getItem(
  environmentId: string,
  itemId: string,
): Promise<ContentItem> {
  const { data } = await proxyGet<ContentItem>(
    environmentId,
    `items/${itemId}`,
  );
  return data;
}

export async function getItemVariants(
  environmentId: string,
  itemId: string,
): Promise<ContentItemVariant[]> {
  const { data } = await proxyGet<ItemsVariantsResponse>(
    environmentId,
    `items/${itemId}/variants`,
  );
  return data.variants;
}

export async function getItemVariant(
  environmentId: string,
  itemId: string,
  languageId: string,
): Promise<ContentItemVariant> {
  const { data } = await proxyGet<ContentItemVariant>(
    environmentId,
    `items/${itemId}/variants/${languageId}`,
  );
  return data;
}

export async function getType(
  environmentId: string,
  typeId: string,
): Promise<ContentType> {
  const { data } = await proxyGet<ContentType>(
    environmentId,
    `types/${typeId}`,
  );
  return data;
}

export async function getSnippet(
  environmentId: string,
  snippetId: string,
): Promise<ContentSnippet> {
  const { data } = await proxyGet<ContentSnippet>(
    environmentId,
    `snippets/${snippetId}`,
  );
  return data;
}

/** Expand content type elements, inlining snippet fields in type order. */
export async function getExpandedTypeElements(
  environmentId: string,
  type: ContentType,
): Promise<ContentType["elements"]> {
  const expanded = [];

  for (const element of type.elements) {
    if (element.type === "snippet" && element.snippet?.id) {
      const snippet = await getSnippet(environmentId, element.snippet.id);
      expanded.push(...snippet.elements);
    } else if (element.type !== "guidelines") {
      expanded.push(element);
    }
  }

  return expanded;
}
