import type { Language } from "../types.ts";

interface LanguagePickerProps {
  readonly baselineLanguageId: string | null;
  readonly compareLanguageId: string | null;
  readonly languages: readonly Language[];
  readonly onCompareChange: (languageId: string) => void;
  readonly showDifferencesOnly: boolean;
  readonly onToggleDifferencesOnly: (value: boolean) => void;
}

export const LanguagePicker = ({
  baselineLanguageId,
  compareLanguageId,
  languages,
  onCompareChange,
  showDifferencesOnly,
  onToggleDifferencesOnly,
}: LanguagePickerProps) => {
  const baseline = languages.find((language) => language.id === baselineLanguageId);
  const options = languages.filter((language) => language.id !== baselineLanguageId);

  return (
    <div className="language-picker">
      <div className="language-picker__side">
        <span className="language-picker__label">Default language</span>
        <div className="language-picker__value" title={baseline?.id}>
          {baseline?.name ?? "No default language"}
          {baseline?.codename && baseline.codename !== "default" ? (
            <span className="language-picker__code">{baseline.codename}</span>
          ) : null}
        </div>
      </div>

      <div className="language-picker__side">
        <label className="language-picker__label" htmlFor="compare-variant">
          Compare variant
        </label>
        <select
          id="compare-variant"
          className="language-picker__select"
          value={compareLanguageId ?? ""}
          onChange={(event) => onCompareChange(event.target.value)}
          disabled={options.length === 0}
        >
          {options.length === 0 ? (
            <option value="">No other languages</option>
          ) : (
            options.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name} ({language.codename})
              </option>
            ))
          )}
        </select>
      </div>

      <label className="language-picker__toggle">
        <input
          type="checkbox"
          checked={showDifferencesOnly}
          onChange={(event) => onToggleDifferencesOnly(event.target.checked)}
        />
        Show differences only
      </label>
    </div>
  );
};
