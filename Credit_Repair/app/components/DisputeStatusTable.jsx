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
  { label: 'Late Account', key: 'late' },
  { label: 'New Account', key: 'new' },
  { label: 'Started Account', key: 'start' },
  { label: 'Charged Account', key: 'charged' },
  { label: 'Closed Account', key: 'closed' },
  { label: 'Account Change', key: 'account_change' },
  { label: 'Removed Change', key: 'removed' },
];

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
              <th className="text-center text-xs font-semibold text-gray-700 pb-3 px-4 whitespace-nowrap">
                Equifax
              </th>
              <th className="text-center text-xs font-semibold text-gray-700 pb-3 px-4 whitespace-nowrap">
                TransUnion
              </th>
              <th className="text-center text-xs font-semibold text-gray-700 pb-3 px-4 whitespace-nowrap">
                Experian
              </th>
            </tr>
          </thead>
          <tbody>
            {DISPUTE_ROWS.map(row => (
              <tr key={row.key} className="border-b border-gray-50 last:border-0">
                <td className="py-3 pr-6 text-sm text-gray-700 whitespace-nowrap">
                  {row.label}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">
                  {get('Equifax', row.key)}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">
                  {get('TransUnion', row.key)}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">
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
