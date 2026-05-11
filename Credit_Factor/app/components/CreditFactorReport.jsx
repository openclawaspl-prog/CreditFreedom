const { useEffect, useRef, useState } = React;

function Dropdown({ label, options, value, onChange, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white flex items-center justify-between text-left"
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>{value || placeholder}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-indigo-50 ${
                opt === value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, note, badgeValue }) {
  const badge = badgeValue || value;
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">{title}</p>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold whitespace-nowrap">
          {badge}
        </span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{note}</p>
    </div>
  );
}

function CreditFactorReport() {
  const [provider, setProvider] = useState('TransUnion');
  const [changeType, setChangeType] = useState('All');
  const [changeBureau, setChangeBureau] = useState('Equifax');
  const [disputeProvider, setDisputeProvider] = useState('');

  const stats = [
    {
      title: 'Hard Inquiries',
      value: '14',
      badgeValue: '14',
      note: "Number of times you've applied for credit",
    },
    {
      title: 'Total Accounts',
      value: '15%',
      badgeValue: '15%',
      note: 'Total open and close accounts',
    },
    {
      title: 'Credit Age',
      value: '0',
      badgeValue: '0',
      note: 'Average age of your open accounts',
    },
    {
      title: 'Derogatory marks',
      value: '3 yrs 2 mos',
      badgeValue: '3y 2m',
      note: 'Collection, tax liens, bankruptcies or civil judgments on your report',
    },
    {
      title: 'Credit card use',
      value: '64',
      badgeValue: '64',
      note: "How much credit you're using compared to your total limits",
    },
    {
      title: 'Payment history',
      value: '100%',
      badgeValue: '100%',
      note: "Percentage of payments you've made on time",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-[1200px] mx-auto space-y-5">
        <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h1 className="text-sm font-semibold text-gray-800 mb-4">Credit Factor Report</h1>
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-4 items-end">
            <div>
              <Dropdown
                label="Select Provider*"
                value={provider}
                onChange={setProvider}
                options={['TransUnion', 'Equifax', 'Experian']}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Credit Factor Date*</label>
              <input
                type="date"
                defaultValue="2026-11-22"
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700"
              />
            </div>
            <button className="h-10 px-5 rounded-lg bg-indigo-900 text-white text-sm font-semibold">
              Submit
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Credit Factor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">What's Changed</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
            <Dropdown
              value={changeType}
              onChange={setChangeType}
              options={['All', 'Positive', 'Negative']}
            />
            <Dropdown
              value={changeBureau}
              onChange={setChangeBureau}
              options={['Equifax', 'Experian', 'TransUnion']}
            />
            <input
              type="date"
              defaultValue="2021-12-28"
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700"
            />
            <button className="h-10 px-5 rounded-lg bg-indigo-900 text-white text-sm font-semibold">
              Submit
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Dispute Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <Dropdown
                label="Select Any Provider"
                value={disputeProvider}
                onChange={setDisputeProvider}
                options={['Equifax', 'Experian', 'TransUnion']}
                placeholder="Select"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Select Any Date</label>
              <input
                type="date"
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700"
              />
            </div>
            <button className="h-10 px-5 rounded-lg bg-indigo-900 text-white text-sm font-semibold">
              Submit
            </button>
          </div>
        </section>

        <footer className="text-center text-xs text-gray-500 py-2">
          Powered by Credit Freedom & Restoration Corp
        </footer>
      </div>
    </div>
  );
}

window.CreditFactorReport = CreditFactorReport;
