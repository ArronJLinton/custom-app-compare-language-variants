import { useCallback, useEffect, useState } from "react";
import {
  getExpandedTypeElements,
  getItem,
  getItemVariant,
  getItemVariants,
  getLanguages,
  getType,
  KontentApiError,
} from "../api/kontent";
import type {
  AppConfig,
  CompareRow,
  ContentItem,
  ContentItemVariant,
  ContentType,
  DiffStatus,
  Language,
  TypeElement,
  VariantElement,
} from "../types";
import { isElementEmpty, valuesAreEqual } from "../utils/normalize";

export interface CompareData {
  readonly item: ContentItem;
  readonly type: ContentType;
  readonly languages: Language[];
  readonly leftVariant: ContentItemVariant | null;
  readonly rightVariant: ContentItemVariant | null;
  readonly rows: CompareRow[];
  readonly leftMissing: boolean;
  readonly rightMissing: boolean;
}

interface UseCompareDataArgs {
  readonly environmentId: string;
  readonly contentItemId: string;
  readonly leftLanguageId: string;
  readonly rightLanguageId: string | null;
  readonly appConfig: AppConfig | null;
  readonly refreshKey?: number;
}

interface UseCompareDataResult {
  readonly data: CompareData | null;
  readonly isLoading: boolean;
  readonly error: { status: number; message: string } | null;
  readonly reload: () => void;
}

const elementMap = (
  variant: ContentItemVariant | null,
): Map<string, VariantElement> => {
  const map = new Map<string, VariantElement>();
  if (!variant) {
    return map;
  }
  for (const element of variant.elements) {
    map.set(element.element.id, element);
  }
  return map;
};

const resolveStatus = (
  left: VariantElement | null,
  right: VariantElement | null,
  leftMissing: boolean,
  rightMissing: boolean,
  options?: TypeElement["options"],
): DiffStatus => {
  if (leftMissing) {
    return "missing-left";
  }
  if (rightMissing) {
    return "missing-right";
  }

  const leftEmpty = isElementEmpty(left);
  const rightEmpty = isElementEmpty(right);

  if (leftEmpty && rightEmpty) {
    return "empty-both";
  }
  if (leftEmpty) {
    return "empty-left";
  }
  if (rightEmpty) {
    return "empty-right";
  }
  if (valuesAreEqual(left, right, options)) {
    return "same";
  }
  return "different";
};

const buildRows = (
  elements: readonly TypeElement[],
  leftVariant: ContentItemVariant | null,
  rightVariant: ContentItemVariant | null,
  leftMissing: boolean,
  rightMissing: boolean,
): CompareRow[] => {
  const leftMap = elementMap(leftVariant);
  const rightMap = elementMap(rightVariant);

  return elements.map((element) => {
    const left = leftMap.get(element.id) ?? null;
    const right = rightMap.get(element.id) ?? null;
    return {
      elementId: element.id,
      name: element.name,
      type: element.type,
      left,
      right,
      status: resolveStatus(
        left,
        right,
        leftMissing,
        rightMissing,
        element.options,
      ),
      options: element.options,
    };
  });
};

export const useCompareData = ({
  environmentId,
  contentItemId,
  leftLanguageId,
  rightLanguageId,
  appConfig,
  refreshKey = 0,
}: UseCompareDataArgs): UseCompareDataResult => {
  const [data, setData] = useState<CompareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(
    null,
  );
  const [localRefresh, setLocalRefresh] = useState(0);

  const reload = useCallback(() => {
    setLocalRefresh((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!environmentId || !contentItemId || !leftLanguageId) {
        setData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [item, languages, variants] = await Promise.all([
          getItem(environmentId, contentItemId),
          getLanguages(environmentId),
          getItemVariants(environmentId, contentItemId),
        ]);

        const allowed = appConfig?.allowedLanguages;
        const filteredLanguages = languages.filter((language) => {
          if (!language.is_active) {
            return false;
          }
          if (!allowed || allowed.length === 0) {
            return true;
          }
          return (
            allowed.includes(language.codename) || allowed.includes(language.id)
          );
        });

        const type = await getType(environmentId, item.type.id);
        const elements = await getExpandedTypeElements(environmentId, type);

        const variantByLang = new Map(
          variants.map((variant) => [variant.language.id, variant] as const),
        );

        const leftExists = variantByLang.has(leftLanguageId);
        const rightExists = rightLanguageId
          ? variantByLang.has(rightLanguageId)
          : false;

        const [leftVariant, rightVariant] = await Promise.all([
          leftExists
            ? getItemVariant(environmentId, contentItemId, leftLanguageId)
            : Promise.resolve(null),
          rightLanguageId && rightExists
            ? getItemVariant(environmentId, contentItemId, rightLanguageId)
            : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        const leftMissing = !leftExists;
        const rightMissing = Boolean(rightLanguageId) && !rightExists;

        setData({
          item,
          type,
          languages: filteredLanguages,
          leftVariant,
          rightVariant,
          leftMissing,
          rightMissing,
          rows: rightLanguageId
            ? buildRows(
                elements,
                leftVariant,
                rightVariant,
                leftMissing,
                rightMissing,
              )
            : [],
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof KontentApiError) {
          setError({ status: err.status, message: err.message });
        } else if (err instanceof Error) {
          setError({ status: 500, message: err.message });
        } else {
          setError({ status: 500, message: "Failed to load comparison data" });
        }
        setData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    environmentId,
    contentItemId,
    leftLanguageId,
    rightLanguageId,
    appConfig,
    refreshKey,
    localRefresh,
  ]);

  return { data, isLoading, error, reload };
};
