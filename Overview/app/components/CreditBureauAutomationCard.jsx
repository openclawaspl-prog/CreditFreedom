const { useState: useAutoState } = React;

function AutoToggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}

function CreditBureauAutomationCard() {
  const [autoBot,  setAutoBot]  = useAutoState(false);
  const [selected, setSelected] = useAutoState('Equifax');

  const bureaus = ['Equifax', 'TransUnion', 'Experian'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full lg:w-4/5 min-h-[240px] px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Credit Bureau Automation</h2>

      {/* Auto bot toggle */}
      <div className="grid max-w-[310px] grid-cols-[minmax(0,1fr)_36px] items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">Pick for Auto Bot (CreditKarma)</span>
        <AutoToggle checked={autoBot} onChange={setAutoBot} />
      </div>

      {/* Bureau selector */}
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Bureau Selection</p>
      <div className="grid max-w-[315px] grid-cols-3 gap-2 mb-4">
        {bureaus.map(b => (
          <button
            key={b}
            onClick={() => setSelected(b)}
            className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
              selected === b
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid max-w-[315px] grid-cols-[minmax(0,1fr)_112px] gap-2">
        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
          <UploadIcon />
          Experian File Upload
        </button>
        <button className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap">
          <PrintIcon />
          Print Letter
        </button>
      </div>
    </div>
  );
}

window.CreditBureauAutomationCard = CreditBureauAutomationCard;
