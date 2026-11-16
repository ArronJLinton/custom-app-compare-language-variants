import { setPopupSize } from "@kontent-ai/custom-app-sdk";
import { useEffect, useMemo, useState } from "react";
import { CompareHeader } from "./components/CompareHeader";
import { ElementRow } from "./components/ElementRow";
import { EmptyState } from "./components/EmptyState";
import { ErrorPanel } from "./components/ErrorPanel";
import { LanguagePicker } from "./components/LanguagePicker";
import { Skeleton } from "./components/Skeleton";
import { VariantMeta } from "./components/VariantMeta";
import { useAppConfig, useAppContext } from "./contexts/AppContext.tsx";
import { useCompareData } from "./hooks/useCompareData";
import type { AppConfig, Language } from "./types";
import "./App.css";

const parseAppConfig = (raw: unknown): AppConfig | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as AppConfig;
};

const pickDefaultRightLanguage = (
  languages: Language[],
  leftLanguageId: string,
  preferredCodename?: string,
): string | null => {
  const others = languages.filter((language) => language.id !== leftLanguageId);
  if (others.length === 0) {
    return null;
  }

  if (preferredCodename) {
    const preferred = others.find(
      (language) =>
        language.codename === preferredCodename ||
        language.id === preferredCodename,
    );
    if (preferred) {
      return preferred.id;
    }
  }

  const envDefault = others.find((language) => language.is_default);
  if (envDefault) {
    return envDefault.id;
  }

  return others[0]?.id ?? null;
};

const App = () => {
  const context = useAppContext();
  const rawConfig = useAppConfig();
  const appConfig = useMemo(() => parseAppConfig(rawConfig), [rawConfig]);

  const [rightLanguageId, setRightLanguageId] = useState<string | null>(null);
  const [displayLeftId, setDisplayLeftId] = useState<string | null>(null);
  const [displayRightId, setDisplayRightId] = useState<string | null>(null);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(
    () => appConfig?.showDifferencesOnlyByDefault ?? false,
  );
  const [showWordDiff] = useState(true);

  useEffect(() => {
    void setPopupSize({ unit: "%", value: 90 }, { unit: "%", value: 90 });
  }, []);

  useEffect(() => {
    setShowDifferencesOnly(appConfig?.showDifferencesOnlyByDefault ?? false);
  }, [appConfig?.showDifferencesOnlyByDefault]);

  const isItemEditor =
    context.currentPage === "itemEditor" && Boolean(context.contentItemId);

  const contextLanguageId =
    context.currentPage === "itemEditor" ||
    context.currentPage === "contentInventory"
      ? context.languageId
      : null;

  const contentItemId =
    context.currentPage === "itemEditor" ? context.contentItemId : null;

  // Reset pairing when the hosted item/language context changes.
  useEffect(() => {
    setRightLanguageId(null);
    setDisplayLeftId(contextLanguageId);
    setDisplayRightId(null);
  }, [contentItemId, contextLanguageId]);

  const { data, isLoading, error, reload } = useCompareData({
    environmentId: context.environmentId,
    contentItemId: contentItemId ?? "",
    leftLanguageId: displayLeftId ?? contextLanguageId ?? "",
    rightLanguageId: displayRightId ?? rightLanguageId,
    appConfig,
  });

  // Choose default compare language once languages are available.
  useEffect(() => {
    if (!data || !contextLanguageId || rightLanguageId) {
      return;
    }
    const next = pickDefaultRightLanguage(
      data.languages,
      contextLanguageId,
      appConfig?.defaultCompareLanguage,
    );
    setRightLanguageId(next);
    setDisplayLeftId(contextLanguageId);
    setDisplayRightId(next);
  }, [
    data,
    rightLanguageId,
    contextLanguageId,
    appConfig?.defaultCompareLanguage,
  ]);

  if (!isItemEditor || !contentItemId || !contextLanguageId) {
    return <EmptyState />;
  }

  const leftId = displayLeftId ?? contextLanguageId;
  const rightId = displayRightId ?? rightLanguageId;

  const handleSwap = () => {
    if (!rightId) {
      return;
    }
    setDisplayLeftId(rightId);
    setDisplayRightId(leftId);
  };

  const handleRightChange = (languageId: string) => {
    setRightLanguageId(languageId);
    setDisplayLeftId(contextLanguageId);
    setDisplayRightId(languageId);
  };

  const visibleRows =
    data?.rows.filter((row) => {
      if (!showDifferencesOnly) {
        return true;
      }
      return row.status !== "same" && row.status !== "empty-both";
    }) ?? [];

  const leftLang = data?.languages.find((language) => language.id === leftId);
  const rightLang = data?.languages.find((language) => language.id === (rightId ?? ""));

  return (
    <div className="app-shell">
      {isLoading && !data ? (
        <>
          <div className="brand-block brand-block--pad">
            <h1 className="app-title">Compare languages</h1>
            <p className="app-subtitle">Karma Health</p>
          </div>
          <Skeleton />
        </>
      ) : error && !data ? (
        <>
          <div className="brand-block brand-block--pad">
            <h1 className="app-title">Compare languages</h1>
            <p className="app-subtitle">Karma Health</p>
          </div>
          <ErrorPanel
            status={error.status}
            message={error.message}
            onRetry={reload}
          />
        </>
      ) : data ? (
        <>
          <CompareHeader itemName={data.item.name} typeName={data.type.name} />

          <LanguagePicker
            leftLanguageId={leftId}
            rightLanguageId={rightId}
            languages={data.languages}
            onRightChange={handleRightChange}
            onSwap={handleSwap}
            showDifferencesOnly={showDifferencesOnly}
            onToggleDifferencesOnly={setShowDifferencesOnly}
          />

          {!rightId && (
            <div className="banner banner--warning" role="status">
              No other active language is available to compare. Add another
              language in the environment (or adjust allowedLanguages).
            </div>
          )}

          {(data.leftMissing || data.rightMissing) && rightId && (
            <div className="banner banner--warning" role="status">
              {data.leftMissing && data.rightMissing
                ? "Both selected language variants are missing for this item."
                : data.leftMissing
                  ? `Missing variant on the left (${leftLang?.codename ?? leftId}).`
                  : `Missing variant on the right (${rightLang?.codename ?? rightId}).`}
            </div>
          )}

          <div className="meta-strip">
            <VariantMeta
              side="left"
              language={leftLang}
              variant={data.leftVariant}
              missing={data.leftMissing}
            />
            <VariantMeta
              side="right"
              language={rightLang}
              variant={data.rightVariant}
              missing={Boolean(rightId) && data.rightMissing}
            />
          </div>

          {error && (
            <ErrorPanel
              status={error.status}
              message={error.message}
              onRetry={reload}
            />
          )}

          {isLoading ? <Skeleton /> : null}

          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">Element</th>
                  <th scope="col">{leftLang?.name ?? "Left"}</th>
                  <th scope="col">{rightLang?.name ?? "Right"}</th>
                </tr>
              </thead>
              <tbody>
                {!rightId ? (
                  <tr>
                    <td colSpan={3} className="compare-table__empty">
                      Select a comparison language to see element differences.
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
                      leftMissing={data.leftMissing}
                      rightMissing={data.rightMissing}
                      showWordDiff={showWordDiff}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState message="Unable to load comparison data." />
      )}
    </div>
  );
};

export default App;
