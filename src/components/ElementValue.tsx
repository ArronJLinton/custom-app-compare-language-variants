import DOMPurify from "dompurify";
import type { MultipleChoiceOption, VariantElement } from "../types";
import { getWordDiff } from "../utils/diff";
import { isElementEmpty, normalizeElementValue } from "../utils/normalize";

interface ElementValueProps {
  readonly element: VariantElement | null;
  readonly type: string;
  readonly options?: readonly MultipleChoiceOption[];
  readonly compareAgainst?: VariantElement | null;
  readonly showWordDiff?: boolean;
  readonly missing?: boolean;
}

const asIdList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }
    if (entry && typeof entry === "object" && "id" in entry) {
      return String((entry as { id: string }).id);
    }
    return JSON.stringify(entry);
  });
};

const formatDateTime = (value: unknown): string => {
  if (typeof value !== "string" || !value) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const WordDiff = ({ left, right }: { left: string; right: string }) => {
  const parts = getWordDiff(left, right);
  return (
    <span className="word-diff">
      {parts.map((part, index) => {
        const className = part.added
          ? "word-diff__added"
          : part.removed
            ? "word-diff__removed"
            : undefined;
        return (
          <span key={`${index}-${part.value.slice(0, 8)}`} className={className}>
            {part.value}
          </span>
        );
      })}
    </span>
  );
};

export const ElementValue = ({
  element,
  type,
  options,
  compareAgainst,
  showWordDiff = false,
  missing = false,
}: ElementValueProps) => {
  if (missing) {
    return <span className="element-value element-value--muted">Variant missing</span>;
  }

  if (isElementEmpty(element)) {
    return <span className="element-value element-value--muted">Empty</span>;
  }

  const value = element?.value;

  if (type === "text" || type === "url_slug") {
    const text = String(value ?? "");
    const other = compareAgainst
      ? normalizeElementValue(compareAgainst)
      : "";
    if (showWordDiff && compareAgainst && other !== text) {
      return (
        <div className="element-value">
          <WordDiff left={text} right={other} />
        </div>
      );
    }
    return <div className="element-value element-value--text">{text}</div>;
  }

  if (type === "rich_text") {
    const html = typeof value === "string" ? value : "";
    const clean = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    });
    const components = element?.components ?? [];
    return (
      <div className="element-value">
        <div
          className="element-value__richtext"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify
          dangerouslySetInnerHTML={{ __html: clean }}
        />
        {components.length > 0 && (
          <div className="component-chips">
            {components.map((component) => (
              <span className="chip" key={component.id} title={component.type.id}>
                Component · {component.id.slice(0, 8)}…
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === "number") {
    return <div className="element-value">{String(value)}</div>;
  }

  if (type === "date_time") {
    return <div className="element-value">{formatDateTime(value)}</div>;
  }

  if (type === "multiple_choice") {
    const ids = asIdList(value);
    const names = ids.map(
      (id) =>
        options?.find((option) => option.id === id || option.codename === id)
          ?.name ?? id,
    );
    return (
      <div className="element-value">
        {names.length === 0 ? "—" : names.join(", ")}
      </div>
    );
  }

  if (type === "taxonomy" || type === "modular_content" || type === "asset") {
    const ids = asIdList(value);
    return (
      <div className="element-value">
        <div className="element-value__count">
          {ids.length} {type === "asset" ? "asset" : type === "taxonomy" ? "term" : "item"}
          {ids.length === 1 ? "" : "s"}
        </div>
        {ids.length > 0 && (
          <ul className="id-list">
            {ids.map((id) => (
              <li key={id} title={id}>
                {id}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (type === "custom") {
    return (
      <pre className="element-value element-value--raw">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <pre className="element-value element-value--raw">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};
