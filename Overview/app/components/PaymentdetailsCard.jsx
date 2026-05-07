const { useState } = React;

/* ═══════════════════════════════════════════
   Icons
═══════════════════════════════════════════ */
function Svg({ size = 16, className = '', children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

const CheckIcon = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>;
const XIcon = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;

/* ═══════════════════════════════════════════
   Payment Details Card
═══════════════════════════════════════════ */
function PaymentDetailsCard() {
  const payments = [
    {
      id: 1,
      type: 'Success Payment',
      date: 'Feb 22, 2026',
      cardLast4: '*********9934',
      amount: '+$2,450.00',
      status: 'success',
    },
    {
      id: 2,
      type: 'Decline Payment',
      date: 'Nov 23, 2025',
      cardLast4: '*********9934',
      amount: '+$99.00',
      status: 'decline',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Payment Details</h2>
      
      <div className="space-y-4">
        {payments.map(payment => (
          <div key={payment.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
              payment.status === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {payment.status === 'success' ? (
                <CheckIcon size={20} className="text-green-600" />
              ) : (
                <XIcon size={20} className="text-red-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{payment.type}</p>
              <p className="text-xs text-gray-500 mt-1">
                {payment.date} {payment.cardLast4}
              </p>
            </div>
            
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">{payment.amount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Payment Actions Card
═══════════════════════════════════════════ */
function PaymentActionsCard() {
  const [nextChargeDate, setNextChargeDate] = useState('2026-04-15');

  const handleDateChange = (e) => {
    setNextChargeDate(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col">
      <h2 className="text-base font-bold text-gray-900 mb-4">Payment Actions</h2>
      
      {/* Action Buttons */}
      <div className="mb-6 space-y-3">
        {/* Top Row - Send Payment Link and Add New Card */}
        <div className="flex gap-3">
          <button className="flex-1 h-10 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors">
            Send Payment Link
          </button>
          <button className="flex-1 h-10 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
            <span>+</span> Add New Card
          </button>
        </div>
        
        {/* Full Width - Re-run payment */}
        <button className="w-full h-10 px-4 rounded-lg  bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2">
          <span>↻</span> Re-run payment
        </button>
      </div>

      {/* Change Next Charge Date */}
      <div className="border-t border-gray-200 pt-4 mt-auto">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Change Next Charge Date
        </label>
        <input
          type="date"
          value={nextChargeDate}
          onChange={handleDateChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
        />
      </div>
    </div>
  );
}

window.PaymentDetailsCard = PaymentDetailsCard;
window.PaymentActionsCard = PaymentActionsCard;
