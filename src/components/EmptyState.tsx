interface EmptyStateProps {
  readonly message?: string;
}

export const EmptyState = ({
  message = "Open a content item, then launch Compare languages.",
}: EmptyStateProps) => (
  <div className="empty-state" role="status">
    <div className="brand-block">
      <h1 className="app-title">Compare languages</h1>
      <p className="app-subtitle">Karma Health</p>
    </div>
    <p className="empty-state__message">{message}</p>
  </div>
);
