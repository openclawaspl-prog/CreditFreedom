/*
  DisputeStatusTable
  Receives: counts = {
    Equifax:    { late: N, new: N, start: N, charged: N, closed: N, account_change: N, removed: N },
    TransUnion: { … },
    Experian:   { … },
  }
  block_type picklist values (from Client_Account module):
    'late' | 'new' | 'start' | 'charged' | 'closed' | 'account_change' | 'removed'
*/

const DISPUTE_ROWS = [
  { label: 'Late Account', key: 'late', textClass: 'text-rose-600' },
  { label: 'New Account', key: 'new', textClass: 'text-sky-600' },
  { label: 'Started Account', key: 'start', textClass: 'text-emerald-600' },
  { label: 'Charged Account', key: 'charged', textClass: 'text-orange-600' },
  { label: 'Closed Account', key: 'closed', textClass: 'text-slate-600' },
  { label: 'Account Change', key: 'account_change', textClass: 'text-violet-600' },
  { label: 'Removed Change', key: 'removed', textClass: 'text-amber-600' },
];

const BUREAU_LOGOS = {
  Equifax: './assets/equifax-logo.svg',
  TransUnion: './assets/transunion-logo.svg',
  Experian: './assets/experian-logo.svg',
};

function BureauLogoHeader({ name }) {
  const logoClass = name === 'Experian'
    ? 'h-7 w-auto max-w-[120px] object-contain'
    : 'h-5 w-auto max-w-[120px] object-contain';

  return (
    <div className="flex items-center justify-center">
      <img src={BUREAU_LOGOS[name]} alt={name} className={logoClass} />
    </div>
  );
}

function DisputeStatusTable({ counts }) {
  function get(bureau, key) {
    return (counts && counts[bureau] && counts[bureau][key] != null)
      ? counts[bureau][key]
      : 0;
  }

  return (
    <div className="cf-glass bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-2">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-6 whitespace-nowrap">
                Status
              </th>
              <th className="pb-3 px-4">
                <BureauLogoHeader name="Equifax" />
              </th>
              <th className="pb-3 px-4">
                <BureauLogoHeader name="TransUnion" />
              </th>
              <th className="pb-3 px-4">
                <BureauLogoHeader name="Experian" />
              </th>
            </tr>
          </thead>
          <tbody>
            {DISPUTE_ROWS.map(row => (
              <tr key={row.key} className="border-b border-gray-50 last:border-0">
                <td className={`py-3 pl-3 pr-6 text-sm font-semibold whitespace-nowrap ${row.textClass}`}>
                  {row.label}
                </td>
                <td className={`py-3 px-4 text-center text-sm font-semibold ${row.textClass}`}>
                  {get('Equifax', row.key)}
                </td>
                <td className={`py-3 px-4 text-center text-sm font-semibold ${row.textClass}`}>
                  {get('TransUnion', row.key)}
                </td>
                <td className={`py-3 px-4 text-center text-sm font-semibold ${row.textClass}`}>
                  {get('Experian', row.key)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.DisputeStatusTable = DisputeStatusTable;
