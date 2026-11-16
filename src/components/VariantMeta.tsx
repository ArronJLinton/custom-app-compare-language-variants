import type { ContentItemVariant, Language } from "../types";

interface VariantMetaProps {
  readonly language: Language | undefined;
  readonly variant: ContentItemVariant | null;
  readonly missing: boolean;
  readonly side: "left" | "right";
}

const formatDate = (value?: string): string => {
  if (!value) {
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

export const VariantMeta = ({
  language,
  variant,
  missing,
  side,
}: VariantMetaProps) => {
  const stepId = variant?.workflow?.step_identifier?.id;
  const publishingState = variant?.publishing_state;

  return (
    <div className={`variant-meta variant-meta--${side}`}>
      <div className="variant-meta__lang">
        {language?.name ?? "Unknown language"}
        {language?.codename ? (
          <span className="variant-meta__code">{language.codename}</span>
        ) : null}
      </div>
      {missing ? (
        <div className="badge badge--missing">Missing variant</div>
      ) : (
        <div className="variant-meta__facts">
          <span>
            <strong>Workflow step</strong> {stepId ?? "—"}
          </span>
          <span>
            <strong>Last modified</strong> {formatDate(variant?.last_modified)}
          </span>
          {publishingState ? (
            <span>
              <strong>Publishing</strong> {publishingState}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
