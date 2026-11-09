import { currentSeasonLabel } from '../lib/dates';

export function DevMockBanner() {
  const showBanner = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_BANNER === 'true';
  return showBanner ? <aside className="mock" aria-label="Development preview notice">Development preview · Mock data in fixtures · {currentSeasonLabel()}</aside> : null;
}

export function Toast({ text }: { text: string | null }) {
  return text ? <div className="toast" role="status" aria-live="polite">{text}</div> : null;
}
