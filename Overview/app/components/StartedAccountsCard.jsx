const { useEffect: useStartedEffect, useState: useAccountsState } = React;

function startedStr(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    return value.Name || value.display_value || value.name || value.value || '';
  }
  return String(value);
}

function startedLookupId(value) {
  if (!value) return '';
  if (typeof value === 'object') return value.id || value.ID || value.record_id || value.RecordID || '';
  return String(value);
}

function isDeleteFlagTrue(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;
  return String(value).trim().toLowerCase() === 'true';
}

function normalizeStartedValue(value) {
  return startedStr(value).trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function startedMatchesClient(row, clientId) {
  const raw = row.Client_ID || row.Client || row.Contact;
  const id = startedLookupId(raw);
  return !clientId || String(id) === String(clientId);
}

function isStartedAccount(row, clientId) {
  const tag = normalizeStartedValue(row.Tag_Value);
  const blockType = normalizeStartedValue(row.Block_Type);
  return (
    startedMatchesClient(row, clientId) &&
    tag === 'started' &&
    (blockType === 'started' || blockType === 'start') &&
    !isDeleteFlagTrue(row.Delete_flag)
  );
}

function formatStartedMoney(value) {
  if (value == null || value === '') return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return startedStr(value) || '-';
  return '$' + number.toLocaleString();
}

function mapStartedAccount(row) {
  return {
    id: row.id || row.ID,
    name: startedStr(row.Creditor_Name || row.Account_Name || row.Name || row.Creditor) || '-',
    type: startedStr(row.Account_Type || row.Type || row.Block_Type) || '-',
    bureau: startedStr(row.Creditor || row.Bureau || row.Credit_Bureau) || '-',
    balance: formatStartedMoney(row.Credit_Balance || row.Balance),
    limit: formatStartedMoney(row.Credit_Limit || row.Limit || row.High_Credit),
    status: startedStr(row.Display_Status || row.Dispute_Status || row.Status) || '-',
  };
}

async function fetchStartedAccounts(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];

  const all = [];
  const perPage = 200;

  if (ZOHO.CRM.API.searchRecord) {
    try {
      const query = `(((Client_ID:equals:${clientId})and(Tag_Value:equals:started))and(Delete_flag:equals:false))`;
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Client_Account',
          Type: 'criteria',
          Query: query,
        }, page, perPage);

        const data = (resp && resp.data) || [];
        all.push(...data);

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }
    } catch (e) {
      all.length = 0;
    }
  }

  if (all.length === 0 && ZOHO.CRM.API.getAllRecords) {
    for (let page = 1; page <= 10; page++) {
      const resp = await ZOHO.CRM.API.getAllRecords({
        Entity: 'Client_Account',
        page,
        per_page: perPage,
      });

      const data = (resp && resp.data) || [];
      all.push(...data);

      const more = resp && resp.info && resp.info.more_records;
      if (!more || data.length < perPage) break;
    }
  }

  return all.filter(row => isStartedAccount(row, clientId));
}

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
  const [accounts, setAccounts] = useAccountsState([]);
  const [loading, setLoading] = useAccountsState(true);
  const [error, setError] = useAccountsState('');
  const [deleting, setDeleting] = useAccountsState({});
  const MAX_VISIBLE = 4;
  const needsScroll = accounts.length > MAX_VISIBLE;

  useStartedEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const clientId = data.EntityId;
      setLoading(true);
      setError('');

      fetchStartedAccounts(clientId)
        .then(rows => {
          setAccounts(rows.map(mapStartedAccount).filter(row => row.id));
        })
        .catch(() => {
          setAccounts([]);
          setError('Failed to load started accounts.');
        })
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  function remove(id) {
    if (!id || deleting[id]) return;

    setDeleting(prev => ({ ...prev, [id]: true }));
    setError('');

    ZOHO.CRM.API.updateRecord({
      Entity: 'Client_Account',
      APIData: {
        id,
        Delete_flag: 'true',
      },
      Trigger: ['workflow'],
    })
      .then(() => {
        setAccounts(prev => prev.filter(a => String(a.id) !== String(id)));
      })
      .catch(() => {
        setError('Failed to delete account.');
      })
      .finally(() => {
        setDeleting(prev => ({ ...prev, [id]: false }));
        window.OverviewWidget.requestResize();
      });
  }

  const headers = ['Account Name', 'Type', 'Bureau', 'Balance', 'Limit', 'Status', 'Actions'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm pt-5 pb-4">
      <style>
        {`
          .overview-started-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.72) rgba(226, 232, 240, 0.82);
            scrollbar-gutter: stable;
          }
          .overview-started-scroll::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .overview-started-scroll::-webkit-scrollbar-track {
            background: rgba(226, 232, 240, 0.82);
            border-radius: 999px;
          }
          .overview-started-scroll::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.72);
            border-radius: 999px;
            border: 2px solid rgba(226, 232, 240, 0.82);
          }
          .overview-started-scroll::-webkit-scrollbar-button {
            display: none;
            width: 0;
            height: 0;
            background: transparent;
          }
          .overview-started-scroll::-webkit-scrollbar-button:single-button,
          .overview-started-scroll::-webkit-scrollbar-button:start:decrement,
          .overview-started-scroll::-webkit-scrollbar-button:end:increment,
          .overview-started-scroll::-webkit-scrollbar-button:vertical:start:decrement,
          .overview-started-scroll::-webkit-scrollbar-button:vertical:end:increment,
          .overview-started-scroll::-webkit-scrollbar-button:horizontal:start:decrement,
          .overview-started-scroll::-webkit-scrollbar-button:horizontal:end:increment {
            display: none;
            width: 0;
            height: 0;
            background: transparent;
          }
          .overview-started-scroll::-webkit-scrollbar-corner {
            background: rgba(226, 232, 240, 0.82);
            border-radius: 999px;
          }
        `}
      </style>
      <div className="mb-4 flex items-center justify-between gap-3 px-5">
        <h2 className="text-base font-bold text-gray-900">Started Accounts</h2>
        {loading && <span className="text-xs text-gray-400">Loading...</span>}
        {!loading && error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      <div className={`overview-started-scroll overflow-x-auto rounded-b-xl bg-white${needsScroll ? ' max-h-[236px] overflow-y-auto' : ''}`}>
        <table className="w-full text-[15px]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-200 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              {headers.map(h => (
                <th key={h} className="text-left text-[13px] font-bold text-black py-3.5 pl-5 pr-6 last:pr-5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-gray-400">No accounts</td>
              </tr>
            )}
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-gray-100/80 last:border-0 transition-colors hover:bg-slate-50/70">
                <td className="py-3.5 pl-5 pr-6 text-[15px] text-gray-800 whitespace-nowrap">{acc.name}</td>
                <td className="py-3.5 pl-5 pr-6 text-[15px] text-gray-600">{acc.type}</td>
                <td className="py-3.5 pl-5 pr-6 text-[15px] text-gray-600">{acc.bureau}</td>
                <td className="py-3.5 pl-5 pr-6 text-[15px] text-gray-600">{acc.balance}</td>
                <td className="py-3.5 pl-5 pr-6 text-[15px] text-gray-600">{acc.limit}</td>
                <td className="py-3.5 pl-5 pr-6">
                  <span className="text-[13px] font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    {acc.status}
                  </span>
                </td>
                <td className="py-3.5 pl-5 pr-5">
                  <button
                    onClick={() => remove(acc.id)}
                    disabled={!!deleting[acc.id]}
                    className={`text-red-400 transition-colors hover:text-red-600 ${deleting[acc.id] ? 'cursor-wait opacity-50' : ''}`}
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
