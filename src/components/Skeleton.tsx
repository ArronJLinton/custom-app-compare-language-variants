export const Skeleton = () => (
  <div className="skeleton" aria-busy="true" aria-label="Loading comparison">
    <div className="skeleton__header">
      <div className="skeleton__line skeleton__line--lg" />
      <div className="skeleton__line skeleton__line--sm" />
    </div>
    <div className="skeleton__meta">
      <div className="skeleton__chip" />
      <div className="skeleton__chip" />
      <div className="skeleton__chip" />
    </div>
    <div className="skeleton__table">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="skeleton__row" key={`sk-${index}`}>
          <div className="skeleton__cell" />
          <div className="skeleton__cell" />
          <div className="skeleton__cell" />
        </div>
      ))}
    </div>
  </div>
);
