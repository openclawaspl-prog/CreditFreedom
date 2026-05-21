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
  { key: 'frontOfFile',      emoji: '📁', label: ['Front of file']              },
  { key: 'achFile',          emoji: '📄', label: ['ACH file']                   },
  { key: 'financialFreedom', emoji: '🐦', label: ['Financial freedom', 'program'] },
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
    <div className="flex min-h-[320px] w-full flex-col rounded-xl border border-gray-200 bg-white px-4 pt-5 pb-4 shadow-sm">
      <h2 className="text-base font-bold text-gray-900 mb-4">Program Eligibility</h2>

      <div className="flex flex-1 flex-col justify-center">
        {/* Loan eligibility */}
        <div className="grid max-w-[310px] grid-cols-[minmax(0,1fr)_122px] items-center gap-2 mb-6">
          <span className="text-sm text-gray-700">Loan Eligible?</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">Not Eligible</span>
          </div>
        </div>

        {/* Programs */}
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Available Programs</p>
        <div className="space-y-4">
          {PROGRAMS.map(({ key, emoji, label }) => (
            <div key={key} className="grid w-[205px] grid-cols-[minmax(0,1fr)_36px] items-end gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <span className="text-base select-none">{emoji}</span>
                <span className="min-w-0 text-sm leading-snug text-gray-700">
                  {label.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </span>
              </div>
              <EligToggle checked={programs[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ProgramEligibilityCard = ProgramEligibilityCard;
