interface CompareHeaderProps {
  readonly itemName: string;
  readonly typeName: string;
}

export const CompareHeader = ({ itemName, typeName }: CompareHeaderProps) => (
  <header className="compare-header">
    <div>
      <h2 className="compare-header__name">{itemName}</h2>
      <p className="compare-header__type">{typeName}</p>
    </div>
  </header>
);
