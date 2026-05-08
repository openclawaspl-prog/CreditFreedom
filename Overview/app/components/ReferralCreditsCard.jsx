const MOCK_REFERRALS = [
  { id: 1, name: 'Mike Johnson',   date: 'Feb 10, 2026', amount: '$150' },
  { id: 2, name: 'Sarah Williams', date: 'Jan 28, 2026', amount: '$150' },
  { id: 3, name: 'David Chen',     date: 'Jan 15, 2026', amount: '$150' },
];

function ReferralCreditsCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Referral Credits</h2>
        <button className="text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
          Add
        </button>
      </div>

      {/* Total banner */}
      <div className="bg-indigo-50 rounded-xl px-4 py-3 mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Referral Credits</p>
          <p className="text-2xl font-bold text-gray-900">$450</p>
          <p className="text-xs text-gray-500 mt-1">3 successful referrals</p>
        </div>
        <span className="text-2xl select-none">🎁</span>
      </div>

      {/* Referral rows */}
      <div className="divide-y divide-gray-100">
        {MOCK_REFERRALS.map(r => (
          <div key={r.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{r.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Referred: {r.date}</p>
            </div>
            <span className="text-sm font-semibold text-green-600">{r.amount}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

window.ReferralCreditsCard = ReferralCreditsCard;
