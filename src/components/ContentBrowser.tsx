import type { ContentItem, ContentTypeSummary } from "../types.ts";

interface ContentBrowserProps {
  readonly types: ContentTypeSummary[];
  readonly items: ContentItem[];
  readonly selectedTypeId: string | null;
  readonly selectedItemId: string | null;
  readonly isLoading: boolean;
  readonly onTypeChange: (typeId: string) => void;
  readonly onItemSelect: (itemId: string) => void;
}

export const ContentBrowser = ({
  types,
  items,
  selectedTypeId,
  selectedItemId,
  isLoading,
  onTypeChange,
  onItemSelect,
}: ContentBrowserProps) => {
  const selectedType = types.find((type) => type.id === selectedTypeId);

  return (
    <section className="browser">
      <div className="browser__field">
        <label className="language-picker__label" htmlFor="content-type">
          Content type
        </label>
        <select
          id="content-type"
          className="language-picker__select"
          value={selectedTypeId ?? ""}
          onChange={(event) => onTypeChange(event.target.value)}
          disabled={isLoading || types.length === 0}
        >
          <option value="">{isLoading ? "Loading content types…" : "Select a content type"}</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTypeId ? (
        <div className="browser__items">
          <p className="browser__count">
            {items.length === 0
              ? `No content items use ${selectedType?.name ?? "this type"}.`
              : `${items.length} content ${items.length === 1 ? "item" : "items"}`}
          </p>
          {items.length > 0 ? (
            <ul className="item-list">
              {items.map((item) => {
                const selected = item.id === selectedItemId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={
                        selected
                          ? "item-list__button item-list__button--selected"
                          : "item-list__button"
                      }
                      aria-pressed={selected}
                      onClick={() => onItemSelect(item.id)}
                    >
                      <span className="item-list__name">{item.name}</span>
                      <span className="item-list__code">{item.codename}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="browser__hint">Choose a content type to list its content items.</p>
      )}
    </section>
  );
};
