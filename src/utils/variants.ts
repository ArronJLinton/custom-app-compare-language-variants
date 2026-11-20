import type { ContentItemVariant, Language } from "../types.ts";

/** The environment default from Localization (`is_default` on GET /languages). */
export const pickBaselineLanguage = (languages: readonly Language[]): Language | null => {
  const active = languages.filter((language) => language.is_active);
  return active.find((language) => language.is_default) ?? active[0] ?? null;
};

/**
 * The variant immediately after the baseline in the Management API array.
 * If the baseline is last or missing, the first other variant.
 */
export const pickNextVariantLanguageId = (
  variants: readonly ContentItemVariant[],
  baselineLanguageId: string,
): string | null => {
  if (variants.length === 0) {
    return null;
  }

  const index = variants.findIndex((variant) => variant.language.id === baselineLanguageId);

  if (index >= 0) {
    const next = variants[index + 1];
    if (next && next.language.id !== baselineLanguageId) {
      return next.language.id;
    }
  }

  const other = variants.find((variant) => variant.language.id !== baselineLanguageId);
  return other?.language.id ?? null;
};
