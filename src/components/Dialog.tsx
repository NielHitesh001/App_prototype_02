import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';

/** Gives every sheet the same Escape handling, focus trap, and opener focus return. */
export function useDialogFocusManagement(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !ref.current) return;
      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const opener = openerRef.current;
      if (opener?.isConnected) requestAnimationFrame(() => opener.focus());
    };
  }, [onClose, ref]);
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocusManagement(ref, onClose);
  return <div className="scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={ref} tabIndex={-1}>
      <button className="icon close" onClick={onClose} aria-label="Close dialog"><X aria-hidden="true" /></button>
      <h2 id="dialog-title">{title}</h2>{children}
    </div>
  </div>;
}

export function PromotionTermsDialog({ onClose }: { onClose: () => void }) {
  return <Dialog title="Promotion terms" onClose={onClose}>
    <div className="py-2 text-sm text-[#5a483a]"><h3 className="font-semibold text-base mb-2">Offer terms & conditions</h3><p className="p-3 bg-[#fcf9f5] rounded-lg border border-[#ebdcd3] text-stone-700">[PLACEHOLDER: promotion terms — pending legal review]</p></div>
    <button className="primary mt-4 w-full" onClick={onClose} type="button">Close terms</button>
  </Dialog>;
}
