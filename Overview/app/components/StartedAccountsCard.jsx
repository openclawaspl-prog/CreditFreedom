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
    // limit: formatStartedMoney(row.Credit_Limit || row.Limit || row.High_Credit),
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
  const [confirmDelete, setConfirmDelete] = useAccountsState(null);
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

  function getConfirmPosition(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewport = window.visualViewport || {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetLeft: 0,
      offsetTop: 0,
    };
    const modalWidth = 384;
    const modalHeight = 180;
    const left = viewport.offsetLeft + viewport.width / 2;
    const top = Math.min(
      Math.max(rect.top + rect.height / 2, modalHeight / 2 + 16),
      viewport.offsetTop + viewport.height - modalHeight / 2 - 16
    );
    return {
      left: Math.min(
        Math.max(left, modalWidth / 2 + 16),
        viewport.offsetLeft + viewport.width - modalWidth / 2 - 16
      ),
      top,
    };
  }

  function openDeleteConfirm(account, event) {
    if (!account || deleting[account.id]) return;
    setConfirmDelete({
      account,
      position: getConfirmPosition(event),
    });
  }

  function cancelDeleteConfirm() {
    setConfirmDelete(null);
  }

  function confirmDeleteAccount() {
    if (!confirmDelete) return;
    const id = confirmDelete.account.id;
    setConfirmDelete(null);
    remove(id);
  }

  // const headers = ['Account Name', 'Type', 'Bureau', 'Balance', 'Limit', 'Status', 'Actions'];
  const headers = ['Account Name', 'Type', 'Bureau', 'Balance', 'Status', 'Actions'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full pt-5 pb-4">
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
      <div className="mb-3 flex items-center justify-between gap-3 px-4">
        <h2 className="text-base font-bold text-gray-900">Started Accounts</h2>
        {loading && <span className="text-xs text-gray-400">Loading...</span>}
        {!loading && error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      <div className={`overview-started-scroll overflow-x-hidden rounded-b-xl bg-white${needsScroll ? ' max-h-[236px] overflow-y-auto' : ''}`}>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[31%]" />
            <col className="w-[10%]" />
            <col className="w-[16%]" />
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[7%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-200 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              {headers.map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-black py-2.5 pl-3 pr-2 last:pr-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && accounts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">No accounts</td>
              </tr>
            )}
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-gray-100/80 last:border-0 transition-colors hover:bg-slate-50/70">
                <td className="py-2.5 pl-3 pr-2 text-xs text-gray-800 truncate">{acc.name}</td>
                <td className="py-2.5 pl-3 pr-2 text-xs text-gray-600 truncate">{acc.type}</td>
                <td className="py-2.5 pl-3 pr-2 text-xs text-gray-600 truncate">{acc.bureau}</td>
                <td className="py-2.5 pl-3 pr-2 text-xs text-gray-600 truncate">{acc.balance}</td>
                <td className="py-2.5 pl-3 pr-2 whitespace-nowrap">
                  <span className="inline-flex max-w-full items-center whitespace-nowrap text-[11px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                    {acc.status}
                  </span>
                </td>
                <td className="py-2.5 pl-3 pr-3">
                  <button
                    onClick={(event) => openDeleteConfirm(acc, event)}
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

      {confirmDelete && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[2147483647] bg-slate-900/35">
          <div
            className="absolute w-[min(384px,calc(100vw-32px))] rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
            style={{
              left: `${confirmDelete.position.left}px`,
              top: `${confirmDelete.position.top}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <h3 className="text-base font-bold text-gray-900">Delete account?</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Are you sure you want to delete {confirmDelete.account.name || 'this account'}?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDeleteConfirm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

window.StartedAccountsCard = StartedAccountsCard;
