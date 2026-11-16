export interface AppConfig {
  readonly allowedLanguages?: string[];
  readonly defaultCompareLanguage?: string;
  readonly showDifferencesOnlyByDefault?: boolean;
}

export interface Language {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly is_active: boolean;
  readonly is_default: boolean;
}

export interface ContentItem {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly type: { readonly id: string };
  readonly collection?: { readonly id: string };
}

export interface WorkflowReference {
  readonly workflow_identifier?: { readonly id?: string };
  readonly step_identifier?: { readonly id?: string };
}

export interface ContentItemVariant {
  readonly item: { readonly id: string };
  readonly language: { readonly id: string };
  readonly elements: readonly VariantElement[];
  readonly last_modified?: string;
  readonly workflow?: WorkflowReference;
  readonly due_date?: string | null;
  readonly contributors?: readonly unknown[];
  readonly publishing_state?: string;
  readonly schedule?: {
    readonly publish_time?: string | null;
    readonly unpublish_time?: string | null;
  };
}

export type ElementType =
  | "text"
  | "rich_text"
  | "number"
  | "date_time"
  | "multiple_choice"
  | "taxonomy"
  | "modular_content"
  | "asset"
  | "url_slug"
  | "custom"
  | "guidelines"
  | "snippet"
  | string;

export interface TypeElement {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly type: ElementType;
  readonly guidelines?: string;
  readonly options?: readonly MultipleChoiceOption[];
  readonly snippet?: { readonly id: string };
}

export interface MultipleChoiceOption {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
}

export interface ContentType {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly elements: readonly TypeElement[];
}

export interface ContentSnippet {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly elements: readonly TypeElement[];
}

export interface VariantElement {
  readonly element: { readonly id: string };
  readonly value?: unknown;
  readonly searchable_value?: string;
  readonly mode?: string;
  readonly components?: readonly RichTextComponent[];
}

export interface RichTextComponent {
  readonly id: string;
  readonly type: { readonly id: string };
  readonly elements: readonly VariantElement[];
}

export type DiffStatus = "same" | "different" | "empty-left" | "empty-right" | "empty-both" | "missing-left" | "missing-right";

export interface CompareRow {
  readonly elementId: string;
  readonly name: string;
  readonly type: ElementType;
  readonly left: VariantElement | null;
  readonly right: VariantElement | null;
  readonly status: DiffStatus;
  readonly options?: readonly MultipleChoiceOption[];
}
