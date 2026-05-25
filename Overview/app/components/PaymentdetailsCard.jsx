const { useEffect, useState } = React;

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

function paymentStr(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.display_value || value.name || value.Name || value.value || '';
  return String(value);
}

function paymentLookupId(value) {
  if (!value) return '';
  if (Array.isArray(value)) return paymentLookupId(value[0]);
  if (typeof value === 'object') return String(value.id || value.ID || value.record_id || value.RecordID || '').trim();
  return String(value).trim();
}

function paymentField(row, apiName) {
  if (!row || !apiName) return '';
  if (Object.prototype.hasOwnProperty.call(row, apiName)) return row[apiName];
  const wanted = String(apiName).toLowerCase();
  const found = Object.keys(row).find(key => String(key).toLowerCase() === wanted);
  return found ? row[found] : '';
}

function paymentTimestamp(row) {
  const value = paymentStr(paymentField(row, 'Transaction_Date'));
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function isApprovedPayment(row) {
  const response = paymentStr(paymentField(row, 'Response_Text')).trim().toLowerCase();
  return response === 'approved' || response === 'accepted';
}

function transactionMatchesClient(row, clientId) {
  return String(paymentLookupId(paymentField(row, 'Client'))) === String(clientId);
}

function formatPaymentDate(value) {
  const raw = paymentStr(value);
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatPaymentAmount(value) {
  const raw = paymentStr(value).trim();
  if (!raw) return '+$0.00';
  const normalized = raw.replace(/[$,]/g, '');
  const number = Number(normalized);
  if (!Number.isFinite(number)) return raw.startsWith('+') ? raw : `+${raw}`;
  return `${number < 0 ? '-' : '+'}$${Math.abs(number).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function maskCardNumber(value) {
  const digits = paymentStr(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 1)}${'*'.repeat(digits.length - 5)}${digits.slice(-4)}`;
}

function toPaymentView(row) {
  const status = isApprovedPayment(row) ? 'success' : 'decline';
  return {
    id: row.id || row.ID || `${status}-${paymentTimestamp(row)}`,
    type: status === 'success' ? 'Success Payment' : 'Decline Payment',
    date: formatPaymentDate(paymentField(row, 'Transaction_Date')),
    cardLast4: maskCardNumber(paymentField(row, 'CC_Number')),
    amount: formatPaymentAmount(paymentField(row, 'Amount')),
    status,
  };
}

async function fetchTransactionDataByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];

  const all = [];
  const perPage = 200;

  if (ZOHO.CRM.API.searchRecord) {
    try {
      const query = `(Client:equals:${clientId})`;
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Transaction_Data',
          Type: 'criteria',
          Query: query,
        }, page, perPage);

        const data = (resp && resp.data) || [];
        all.push(...data);

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }
    } catch (error) {
      all.length = 0;
    }
  }

  if (all.length === 0 && ZOHO.CRM.API.getAllRecords) {
    for (let page = 1; page <= 10; page++) {
      const resp = await ZOHO.CRM.API.getAllRecords({
        Entity: 'Transaction_Data',
        page,
        per_page: perPage,
      });

      const data = (resp && resp.data) || [];
      all.push(...data);

      const more = resp && resp.info && resp.info.more_records;
      if (!more || data.length < perPage) break;
    }
  }

  return all
    .filter(row => transactionMatchesClient(row, clientId))
    .sort((a, b) => paymentTimestamp(b) - paymentTimestamp(a));
}

function latestSuccessAndDecline(records) {
  const success = records.find(isApprovedPayment);
  const decline = records.find(row => !isApprovedPayment(row));
  return [success, decline].filter(Boolean).map(toPaymentView);
}

/* ═══════════════════════════════════════════
   Payment Details Card
═══════════════════════════════════════════ */
function PaymentDetailsCard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextChargeDate, setNextChargeDate] = useState('2026-04-15');

  useEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const clientId = paymentLookupId(data && data.EntityId);
      setLoading(true);
      setError('');

      fetchTransactionDataByClientId(clientId)
        .then(records => {
          setPayments(latestSuccessAndDecline(records));
        })
        .catch(() => {
          setError('Failed to load payments.');
          setPayments([]);
        })
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  const handleDateChange = (e) => {
    setNextChargeDate(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 h-[480px] flex flex-col">
      <h2 className="text-base font-bold text-gray-900 mb-4">Payment Details</h2>
      
      <div className="space-y-4">
        {loading && (
          <p className="py-6 text-center text-sm text-gray-400">Loading payments...</p>
        )}
        {!loading && error && (
          <p className="py-6 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && payments.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No payment records found.</p>
        )}
        {!loading && !error && payments.map(payment => (
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
                {payment.date}{payment.cardLast4 ? ` ${payment.cardLast4}` : ''}
              </p>
            </div>
            
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">{payment.amount}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 my-4" />

      <h2 className="text-base font-bold text-gray-900 mb-4">Payment Actions</h2>

      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <button className="flex-1 h-10 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors">
            Send Payment Link
          </button>
          <button className="flex-1 h-10 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
            <span>+</span> Add New Card
          </button>
        </div>

        <button className="w-full h-10 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2">
          <span>↻</span> Re-run payment
        </button>
      </div>

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

/* ═══════════════════════════════════════════
   Payment Actions Card
═══════════════════════════════════════════ */
function PaymentActionsCard() {
  return null;
}

window.PaymentDetailsCard = PaymentDetailsCard;
window.PaymentActionsCard = PaymentActionsCard;
