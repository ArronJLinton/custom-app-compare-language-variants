import { useCallback, useEffect, useState } from "react";
import { getContentTypes, getItems, KontentApiError } from "../api/kontent.ts";
import type { ContentItem, ContentTypeSummary } from "../types.ts";

interface CatalogError {
  readonly status: number;
  readonly message: string;
}

interface UseContentCatalogResult {
  readonly types: ContentTypeSummary[];
  readonly items: ContentItem[];
  readonly isLoading: boolean;
  readonly error: CatalogError | null;
  readonly reload: () => void;
}

const toError = (err: unknown): CatalogError => {
  if (err instanceof KontentApiError) {
    return { status: err.status, message: err.message };
  }
  if (err instanceof Error) {
    return { status: 500, message: err.message };
  }
  return { status: 500, message: "Failed to load content types and items" };
};

export const useContentCatalog = (environmentId: string): UseContentCatalogResult => {
  const [types, setTypes] = useState<ContentTypeSummary[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<CatalogError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!environmentId) {
      setTypes([]);
      setItems([]);
      setIsLoading(false);
      setError({
        status: 400,
        message: "Environment is not available in this context.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [nextTypes, nextItems] = await Promise.all([
          getContentTypes(environmentId),
          getItems(environmentId),
        ]);
        if (cancelled) {
          return;
        }
        setTypes(nextTypes);
        setItems(nextItems);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setTypes([]);
        setItems([]);
        setError(toError(err));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void reloadKey;
    void load();

    return () => {
      cancelled = true;
    };
  }, [environmentId, reloadKey]);

  return { types, items, isLoading, error, reload };
};
