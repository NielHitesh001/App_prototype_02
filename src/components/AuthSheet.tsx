import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocusManagement } from './Dialog';

type AuthSheetProps = {
  onClose: () => void;
  onSubmit: (identifier: string) => void;
};

/** Local-only authentication stub. Replace `onSubmit` with the OTP verifier when an API is connected. */
export function AuthSheet({ onClose, onSubmit }: AuthSheetProps) {
  const [identifier, setIdentifier] = useState('');
  const ref = useRef<HTMLElement>(null);
  useDialogFocusManagement(ref, onClose);

  return (
    <div className="scrim" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sign-in-title" tabIndex={-1} ref={ref}>
        <button className="icon close" type="button" onClick={onClose} aria-label="Close dialog">
          <X aria-hidden="true" />
        </button>
        <h2 id="sign-in-title">Sign in to Troo</h2>
        <p className="lead">Use an email address or mobile number. We’ll send a one-time code when the service is connected.</p>
        <form onSubmit={event => {
          event.preventDefault();
          onSubmit(identifier);
        }}>
          <label className="field-label" htmlFor="auth-identifier">Email or mobile number</label>
          <input id="auth-identifier" required autoComplete="email" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="you@example.com" />
          <button className="primary mt-4" type="submit">Continue with mock OTP</button>
        </form>
        <p className="text-xs text-[#7a6a5a] mt-3">Development preview · Authentication is stored only in this browser.</p>
      </section>
    </div>
  );
}
