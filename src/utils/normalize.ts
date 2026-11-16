import type { MultipleChoiceOption, VariantElement } from "../types";

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
};

export const isElementEmpty = (element: VariantElement | null | undefined): boolean => {
  if (!element) {
    return true;
  }
  return isEmptyValue(element.value);
};

const sortIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object" && "id" in entry) {
        return String((entry as { id: string }).id);
      }
      return JSON.stringify(entry);
    })
    .sort();
};

/** Stable, comparable string for normalised equality checks. */
export const normalizeElementValue = (
  element: VariantElement | null | undefined,
  options?: readonly MultipleChoiceOption[],
): string => {
  if (!element || isEmptyValue(element.value)) {
    return "";
  }

  const { value } = element;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim().replace(/\s+/g, " ");
  }

  if (Array.isArray(value)) {
    // multiple_choice may be option ids; prefer names when options are known
    if (options && options.length > 0) {
      const names = value
        .map((id) => options.find((opt) => opt.id === id || opt.codename === id)?.name ?? String(id))
        .sort();
      return names.join("|");
    }
    return sortIds(value).join("|");
  }

  return JSON.stringify(value);
};

export const valuesAreEqual = (
  left: VariantElement | null | undefined,
  right: VariantElement | null | undefined,
  options?: readonly MultipleChoiceOption[],
): boolean => normalizeElementValue(left, options) === normalizeElementValue(right, options);
