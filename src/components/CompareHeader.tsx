interface CompareHeaderProps {
  readonly itemName: string;
  readonly typeName: string;
}

export const CompareHeader = ({ itemName, typeName }: CompareHeaderProps) => (
  <header className="compare-header">
    <div className="brand-block">
      <h1 className="app-title">Compare languages</h1>
      <p className="app-subtitle">Karma Health</p>
    </div>
    <div className="compare-header__item">
      <h2 className="compare-header__name">{itemName}</h2>
      <p className="compare-header__type">{typeName}</p>
    </div>
  </header>
);
