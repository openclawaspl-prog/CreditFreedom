const { useState: useAccountsState } = React;

const MOCK_ACCOUNTS = [
  { id: 1, name: 'Capital One Business', type: 'Credit Card', bureau: 'All 3', balance: '$5,200', limit: '$10,000', status: 'Active' },
  { id: 2, name: 'Capital One Business', type: 'Credit Card', bureau: 'All 3', balance: '$5,200', limit: '$10,000', status: 'Active' },
  { id: 3, name: 'Capital One Business', type: 'Credit Card', bureau: 'All 3', balance: '$5,200', limit: '$10,000', status: 'Active' },
];

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function StartedAccountsCard() {
  const [accounts, setAccounts] = useAccountsState(MOCK_ACCOUNTS);
  const MAX_VISIBLE = 5;
  const needsScroll = accounts.length > MAX_VISIBLE;

  function remove(id) {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  const headers = ['Account Name', 'Type', 'Bureau', 'Balance', 'Limit', 'Status', 'Actions'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Started Accounts</h2>

      <div className={`overflow-x-auto${needsScroll ? ' max-h-[260px] overflow-y-auto pr-1' : ''}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {headers.map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 pb-3 pr-6 last:pr-0 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-gray-400">No accounts</td>
              </tr>
            )}
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3 pr-6 text-sm text-gray-800 whitespace-nowrap">{acc.name}</td>
                <td className="py-3 pr-6 text-sm text-gray-600">{acc.type}</td>
                <td className="py-3 pr-6 text-sm text-gray-600">{acc.bureau}</td>
                <td className="py-3 pr-6 text-sm text-gray-600">{acc.balance}</td>
                <td className="py-3 pr-6 text-sm text-gray-600">{acc.limit}</td>
                <td className="py-3 pr-6">
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    {acc.status}
                  </span>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => remove(acc.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove account"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.StartedAccountsCard = StartedAccountsCard;
