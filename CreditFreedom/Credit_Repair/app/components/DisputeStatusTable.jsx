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
    ? 'h-7 w-auto max-w-[110px] object-contain'
    : name === 'TransUnion'
      ? 'h-6 w-auto max-w-[132px] object-contain'
      : 'h-6 w-auto max-w-[112px] object-contain';

  return (
    <div className="flex min-h-8 items-center justify-center overflow-visible px-1">
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
    <div className="cf-glass bg-white rounded-xl border border-gray-200 shadow-sm px-4 pt-5 pb-2">
      <div className="overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 pr-3 text-left text-xs font-semibold text-gray-500">
                Status
              </th>
              <th className="px-2 pb-3">
                <BureauLogoHeader name="Equifax" />
              </th>
              <th className="px-2 pb-3">
                <BureauLogoHeader name="TransUnion" />
              </th>
              <th className="px-2 pb-3">
                <BureauLogoHeader name="Experian" />
              </th>
            </tr>
          </thead>
          <tbody>
            {DISPUTE_ROWS.map(row => (
              <tr key={row.key} className="border-b border-gray-50 last:border-0">
                <td className={`py-3 pl-2 pr-3 text-sm font-semibold leading-5 ${row.textClass}`}>
                  {row.label}
                </td>
                <td className={`px-2 py-3 text-center text-sm font-semibold ${row.textClass}`}>
                  {get('Equifax', row.key)}
                </td>
                <td className={`px-2 py-3 text-center text-sm font-semibold ${row.textClass}`}>
                  {get('TransUnion', row.key)}
                </td>
                <td className={`px-2 py-3 text-center text-sm font-semibold ${row.textClass}`}>
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
