import { useCallback, useEffect, useState } from "react";
import {
  getExpandedTypeElements,
  getItem,
  getItemVariant,
  getItemVariants,
  getLanguages,
  getType,
  KontentApiError,
} from "../api/kontent.ts";
import type {
  CompareRow,
  ContentItem,
  ContentItemVariant,
  ContentType,
  DiffStatus,
  Language,
  TypeElement,
  VariantElement,
} from "../types.ts";
import { isElementEmpty, valuesAreEqual } from "../utils/normalize.ts";
import { pickBaselineLanguage, pickNextVariantLanguageId } from "../utils/variants.ts";

export interface CompareData {
  readonly item: ContentItem;
  readonly type: ContentType;
  readonly languages: Language[];
  readonly baselineLanguageId: string | null;
  readonly compareLanguageId: string | null;
  readonly leftVariant: ContentItemVariant | null;
  readonly rightVariant: ContentItemVariant | null;
  readonly rows: CompareRow[];
  readonly leftMissing: boolean;
  readonly rightMissing: boolean;
}

interface UseCompareDataArgs {
  readonly environmentId: string;
  readonly contentItemId: string;
  readonly rightLanguageId: string | null;
  readonly refreshKey?: number;
}

interface UseCompareDataResult {
  readonly data: CompareData | null;
  readonly isLoading: boolean;
  readonly error: { status: number; message: string } | null;
  readonly reload: () => void;
}

const elementMap = (variant: ContentItemVariant | null): Map<string, VariantElement> => {
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
      status: resolveStatus(left, right, leftMissing, rightMissing, element.options),
      options: element.options,
    };
  });
};

export const useCompareData = ({
  environmentId,
  contentItemId,
  rightLanguageId,
  refreshKey = 0,
}: UseCompareDataArgs): UseCompareDataResult => {
  const [data, setData] = useState<CompareData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(contentItemId));
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  const reload = useCallback(() => {
    setLocalRefresh((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!environmentId || !contentItemId) {
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

        const activeLanguages = languages.filter((language) => language.is_active);

        const visibleIds = new Set(activeLanguages.map((language) => language.id));
        const visibleVariants = variants.filter((variant) => visibleIds.has(variant.language.id));
        const baseline = pickBaselineLanguage(activeLanguages);
        const baselineLanguageId = baseline?.id ?? null;
        const autoRight = baselineLanguageId
          ? pickNextVariantLanguageId(visibleVariants, baselineLanguageId)
          : null;
        const requestedRight =
          rightLanguageId &&
          rightLanguageId !== baselineLanguageId &&
          visibleIds.has(rightLanguageId)
            ? rightLanguageId
            : null;
        const compareLanguageId = requestedRight ?? autoRight;

        const type = await getType(environmentId, item.type.id);
        const elements = await getExpandedTypeElements(environmentId, type);

        const variantByLang = new Map(
          variants.map((variant) => [variant.language.id, variant] as const),
        );

        const leftExists = baselineLanguageId ? variantByLang.has(baselineLanguageId) : false;
        const rightExists = compareLanguageId ? variantByLang.has(compareLanguageId) : false;

        const [leftVariant, rightVariant] = await Promise.all([
          leftExists && baselineLanguageId
            ? getItemVariant(environmentId, contentItemId, baselineLanguageId)
            : Promise.resolve(null),
          compareLanguageId && rightExists
            ? getItemVariant(environmentId, contentItemId, compareLanguageId)
            : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        const leftMissing = Boolean(baselineLanguageId) && !leftExists;
        const rightMissing = Boolean(compareLanguageId) && !rightExists;

        setData({
          item,
          type,
          languages: activeLanguages,
          baselineLanguageId,
          compareLanguageId,
          leftVariant,
          rightVariant,
          leftMissing,
          rightMissing,
          rows: compareLanguageId
            ? buildRows(elements, leftVariant, rightVariant, leftMissing, rightMissing)
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

    void refreshKey;
    void localRefresh;
    void load();

    return () => {
      cancelled = true;
    };
  }, [environmentId, contentItemId, rightLanguageId, refreshKey, localRefresh]);

  return { data, isLoading, error, reload };
};
