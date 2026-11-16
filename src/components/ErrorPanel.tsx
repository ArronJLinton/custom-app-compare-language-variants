interface ErrorPanelProps {
  readonly status?: number;
  readonly message: string;
  readonly onRetry?: () => void;
}

export const ErrorPanel = ({ status, message, onRetry }: ErrorPanelProps) => (
  <div className="error-panel" role="alert">
    <h2 className="error-panel__title">Something went wrong</h2>
    {status !== undefined && (
      <p className="error-panel__status">Status: {status}</p>
    )}
    <p className="error-panel__message">{message}</p>
    {onRetry && (
      <button type="button" className="btn btn--secondary" onClick={onRetry}>
        Retry
      </button>
    )}
  </div>
);
