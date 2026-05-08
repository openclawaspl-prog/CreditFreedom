const { useState: useEligState } = React;

function EligToggle({ checked, onChange }) {
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

const PROGRAMS = [
  { key: 'frontOfFile',      emoji: '📁', label: 'Front of file'             },
  { key: 'achFile',          emoji: '📄', label: 'ACH file'                  },
  { key: 'financialFreedom', emoji: '🐦', label: 'Financial freedom program' },
];

function ProgramEligibilityCard() {
  const [programs, setPrograms] = useEligState({
    frontOfFile:      false,
    achFile:          false,
    financialFreedom: true,
  });

  function toggle(key) {
    setPrograms(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Program Eligibility</h2>

      {/* Loan eligibility */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-700">Loan Eligible?</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-600">Not Eligible</span>
        </div>
      </div>

      {/* Programs */}
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Available Programs</p>
      <div className="space-y-4">
        {PROGRAMS.map(({ key, emoji, label }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base select-none">{emoji}</span>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
            <EligToggle checked={programs[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.ProgramEligibilityCard = ProgramEligibilityCard;
