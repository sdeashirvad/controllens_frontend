export function LoadingBlock({ label = 'Loading illustrative data' }: { label?: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="skel skel-lg" />
      <div className="skel" />
      <div className="skel" />
      <div className="skel skel-sm" />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <h2>This view could not be loaded</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}
