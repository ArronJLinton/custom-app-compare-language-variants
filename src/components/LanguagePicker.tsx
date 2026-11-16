import type { Language } from "../types";

interface LanguagePickerProps {
  readonly leftLanguageId: string;
  readonly rightLanguageId: string | null;
  readonly languages: Language[];
  readonly onRightChange: (languageId: string) => void;
  readonly onSwap: () => void;
  readonly showDifferencesOnly: boolean;
  readonly onToggleDifferencesOnly: (value: boolean) => void;
}

export const LanguagePicker = ({
  leftLanguageId,
  rightLanguageId,
  languages,
  onRightChange,
  onSwap,
  showDifferencesOnly,
  onToggleDifferencesOnly,
}: LanguagePickerProps) => {
  const left = languages.find((language) => language.id === leftLanguageId);
  const rightOptions = languages.filter(
    (language) => language.id !== leftLanguageId,
  );

  return (
    <div className="language-picker">
      <div className="language-picker__side">
        <span className="language-picker__label">Left</span>
        <div className="language-picker__value" title={left?.id}>
          {left?.name ?? leftLanguageId}
          {left?.codename ? (
            <span className="language-picker__code">{left.codename}</span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="btn btn--secondary language-picker__swap"
        onClick={onSwap}
        disabled={!rightLanguageId}
        title="Swap languages"
      >
        Swap
      </button>

      <div className="language-picker__side">
        <label className="language-picker__label" htmlFor="compare-language">
          Right (compare)
        </label>
        <select
          id="compare-language"
          className="language-picker__select"
          value={rightLanguageId ?? ""}
          onChange={(event) => onRightChange(event.target.value)}
          disabled={rightOptions.length === 0}
        >
          {rightOptions.length === 0 ? (
            <option value="">No other languages</option>
          ) : (
            rightOptions.map((language) => (
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
