type PassTab = 'pass' | 'ledger';

export function PassTabs({ active, onChange }: { active: PassTab; onChange: (tab: PassTab) => void }) {
  return (
    <div role="tablist" className="tabs" aria-label="Pass views">
      <button role="tab" aria-selected={active === 'pass'} id="tab-pass" aria-controls="panel-pass" onClick={() => onChange('pass')}>My pass</button>
      <button role="tab" aria-selected={active === 'ledger'} id="tab-ledger" aria-controls="panel-ledger" onClick={() => onChange('ledger')}>Credit ledger</button>
    </div>
  );
}
