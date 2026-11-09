import { useCallback, useState } from 'react';

export type ResourceState<T> = { status: 'loading'; data: null; error: null } | { status: 'error'; data: null; error: string } | { status: 'ready'; data: T; error: null };

/** Fixture resources resolve synchronously today; HTTP resources can retain this interface later. */
export function useFixtureResource<T>(load: () => T): ResourceState<T> & { retry: () => void } {
  const [state, setState] = useState<ResourceState<T>>(() => {
    try { return { status: 'ready', data: load(), error: null }; }
    catch { return { status: 'error', data: null, error: 'We could not load this right now.' }; }
  });
  const retry = useCallback(() => {
    try { setState({ status: 'ready', data: load(), error: null }); }
    catch { setState({ status: 'error', data: null, error: 'We could not load this right now.' }); }
  }, [load]);
  return { ...state, retry };
}

export function LoadingState({ label = 'Loading content' }: { label?: string }) {
  return <div className="loading-state" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><span>{label}…</span></div>;
}

export function ErrorState({ onRetry, message = 'We could not load this right now.' }: { onRetry: () => void; message?: string }) {
  return <div className="empty" role="alert"><h2>Something went wrong</h2><p>{message}</p><button className="secondary" type="button" onClick={onRetry}>Try again</button></div>;
}
