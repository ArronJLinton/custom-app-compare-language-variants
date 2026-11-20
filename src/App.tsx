import { setPopupSize } from "@kontent-ai/custom-app-sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { CompareHeader } from "./components/CompareHeader.tsx";
import { ContentBrowser } from "./components/ContentBrowser.tsx";
import { ElementRow } from "./components/ElementRow.tsx";
import { ErrorPanel } from "./components/ErrorPanel.tsx";
import { LanguagePicker } from "./components/LanguagePicker.tsx";
import { Skeleton } from "./components/Skeleton.tsx";
import { VariantMeta } from "./components/VariantMeta.tsx";
import { useAppConfig, useAppContext } from "./contexts/AppContext.tsx";
import { useCompareData } from "./hooks/useCompareData.ts";
import { useContentCatalog } from "./hooks/useContentCatalog.ts";
import type { AppConfig } from "./types.ts";
import "./App.css";

const parseAppConfig = (raw: unknown): AppConfig | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as AppConfig;
};

const App = () => {
  const context = useAppContext();
  const rawConfig = useAppConfig();
  const appConfig = useMemo(() => parseAppConfig(rawConfig), [rawConfig]);

  const catalog = useContentCatalog(context.environmentId);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rightLanguageId, setRightLanguageId] = useState<string | null>(null);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(
    () => appConfig?.showDifferencesOnlyByDefault ?? false,
  );
  const [showWordDiff] = useState(true);
  const appliedContextItem = useRef<boolean>(false);

  useEffect(() => {
    void setPopupSize({ unit: "%", value: 90 }, { unit: "%", value: 90 });
  }, []);

  useEffect(() => {
    setShowDifferencesOnly(appConfig?.showDifferencesOnlyByDefault ?? false);
  }, [appConfig?.showDifferencesOnlyByDefault]);

  const contextItemId = context.currentPage === "itemEditor" ? context.contentItemId : null;

  useEffect(() => {
    if (!context.environmentId) {
      return;
    }
    appliedContextItem.current = false;
    setSelectedTypeId(null);
    setSelectedItemId(null);
    setRightLanguageId(null);
  }, [context.environmentId]);

  useEffect(() => {
    if (appliedContextItem.current || !contextItemId || catalog.items.length === 0) {
      return;
    }
    const match = catalog.items.find((item) => item.id === contextItemId);
    if (!match) {
      return;
    }
    appliedContextItem.current = true;
    setSelectedTypeId(match.type.id);
    setSelectedItemId(match.id);
    setRightLanguageId(null);
  }, [catalog.items, contextItemId]);

  const itemsForType = useMemo(
    () => catalog.items.filter((item) => item.type.id === selectedTypeId),
    [catalog.items, selectedTypeId],
  );

  const { data, isLoading, error, reload } = useCompareData({
    environmentId: context.environmentId,
    contentItemId: selectedItemId ?? "",
    rightLanguageId,
  });

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId || null);
    setSelectedItemId(null);
    setRightLanguageId(null);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setRightLanguageId(null);
  };

  const comparison = data && data.item.id === selectedItemId ? data : null;

  const visibleRows =
    comparison?.rows.filter((row) => {
      if (!showDifferencesOnly) {
        return true;
      }
      return row.status !== "same" && row.status !== "empty-both";
    }) ?? [];

  const leftLang = comparison?.languages.find(
    (language) => language.id === comparison.baselineLanguageId,
  );
  const rightLang = comparison?.languages.find(
    (language) => language.id === (comparison.compareLanguageId ?? ""),
  );

  return (
    <div className="app-shell">
      <div className="brand-block brand-block--pad">
        <h1 className="app-title">Compare languages</h1>
        <p className="app-subtitle">Karma Health</p>
      </div>

      {catalog.error ? (
        <ErrorPanel
          status={catalog.error.status}
          message={catalog.error.message}
          onRetry={catalog.reload}
        />
      ) : (
        <ContentBrowser
          types={catalog.types}
          items={itemsForType}
          selectedTypeId={selectedTypeId}
          selectedItemId={selectedItemId}
          isLoading={catalog.isLoading}
          onTypeChange={handleTypeChange}
          onItemSelect={handleItemSelect}
        />
      )}

      {selectedItemId && isLoading && !comparison ? <Skeleton /> : null}

      {selectedItemId && error && !comparison ? (
        <ErrorPanel status={error.status} message={error.message} onRetry={reload} />
      ) : null}

      {comparison ? (
        <>
          <CompareHeader itemName={comparison.item.name} typeName={comparison.type.name} />

          <LanguagePicker
            baselineLanguageId={comparison.baselineLanguageId}
            compareLanguageId={rightLanguageId ?? comparison.compareLanguageId}
            languages={comparison.languages}
            onCompareChange={setRightLanguageId}
            showDifferencesOnly={showDifferencesOnly}
            onToggleDifferencesOnly={setShowDifferencesOnly}
          />

          {!comparison.compareLanguageId && (
            <div className="banner banner--warning" role="status">
              This item has no other variant to compare against {leftLang?.name ?? "the baseline"}.
            </div>
          )}

          {comparison.compareLanguageId && (comparison.leftMissing || comparison.rightMissing) ? (
            <div className="banner banner--warning" role="status">
              {comparison.leftMissing && comparison.rightMissing
                ? "Both selected language variants are missing for this item."
                : comparison.leftMissing
                  ? `Missing variant on the left (${leftLang?.codename ?? comparison.baselineLanguageId}).`
                  : `Missing variant on the right (${rightLang?.codename ?? comparison.compareLanguageId}).`}
            </div>
          ) : null}

          <div className="meta-strip">
            <VariantMeta
              side="left"
              language={leftLang}
              variant={comparison.leftVariant}
              missing={comparison.leftMissing}
            />
            <VariantMeta
              side="right"
              language={rightLang}
              variant={comparison.rightVariant}
              missing={Boolean(comparison.compareLanguageId) && comparison.rightMissing}
            />
          </div>

          {error ? (
            <ErrorPanel status={error.status} message={error.message} onRetry={reload} />
          ) : null}

          {isLoading ? <Skeleton /> : null}

          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">Element</th>
                  <th scope="col">{leftLang?.name ?? "English"}</th>
                  <th scope="col">{rightLang?.name ?? "Variant"}</th>
                </tr>
              </thead>
              <tbody>
                {!comparison.compareLanguageId ? (
                  <tr>
                    <td colSpan={3} className="compare-table__empty">
                      Select a variant to compare against {leftLang?.name ?? "the baseline"}.
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="compare-table__empty">
                      {showDifferencesOnly
                        ? "No differences for this pair."
                        : "No elements to compare."}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <ElementRow
                      key={row.elementId}
                      row={row}
                      leftMissing={comparison.leftMissing}
                      rightMissing={comparison.rightMissing}
                      showWordDiff={showWordDiff}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default App;
