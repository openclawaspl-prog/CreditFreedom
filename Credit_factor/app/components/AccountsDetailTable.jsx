/*
  AccountsDetailTable
  Reads Client_Account related records (passed as `accounts` prop from parent).
  Groups by block_type → one section card per group.
  Columns: Checkbox | Reason* | Instruction* | Date | Bureau | Creditor Name |
           Account# | Reason (full) | Late Payment | Remain Late Payment |
           Balance | Status | Account Status | Action
  * inline-editable, saves on blur via ZOHO.CRM.API.updateRecord

  TODO — update these field API names to match your Zoho Client_Account module:
    Bureau            → 'Bureau'              (confirmed)
    block_type        → 'block_type'          (confirmed)
    Date              → 'Created_Time'        (change if a dedicated date field exists)
    Creditor Name     → 'Creditor_Name'
    Account#          → 'Account_Number'
    Reason (editable) → 'Reason'
    Instruction       → 'Instruction'
    Full Reason text  → 'Account_Reason'      (read-only; the reason shown in col 8)
    Late Payment      → 'Late_Payment'
    Remain Late Pmt   → 'Remaining_Late_Payment'
    Balance           → 'Balance'
    Status            → 'Status'
    Account Status    → 'Account_Status'
*/

const { useState: useDtState, useEffect: useDtEffect } = React;

const DT_SECTIONS = [
  { key: 'late',           label: 'Late Payment Account'     },
  { key: 'new',            label: 'New Account'              },
  { key: 'start',          label: 'Started Negative Account' },
  { key: 'charged',        label: 'Charged Off Account'      },
  { key: 'closed',         label: 'Closed Account'           },
  { key: 'account_change', label: 'Account Change'           },
  { key: 'removed',        label: 'Removed Account'          },
];

/* Field API name map — single place to update */
const F = {
  blockType:     'block_type',
  Creditor:        'Creditor',
  date:          'Created_Time',
  creditorName:  'Creditor_Name',
  accountNum:    'Account_Number',
  reason:        'Reason',
  instruction:   'Instruction',
  acctReason:    'Account_Reason',
  latePayment:   'Late_Payment',
  remainLate:    'Remaining_Late_Payment',
  balance:       'Balance',
  status:        'Status',
  acctStatus:    'Account_Status',
};

function dtFormatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString(); } catch { return v; }
}

function dtFmtBalance(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return isNaN(n) ? v : '$' + n.toLocaleString();
}

/* Red-X badge for Negative, plain text otherwise */
function AcctStatusBadge({ value }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  const isNeg = /negative/i.test(value);
  return (
    <div className="flex flex-col items-center gap-0.5">
      {isNeg && (
        <span
          className="inline-flex items-center justify-center rounded-sm text-white font-bold"
          style={{ width: 18, height: 18, fontSize: 11, background: '#ef4444' }}
        >✕</span>
      )}
      <span className={`text-[11px] font-medium ${isNeg ? 'text-red-600' : 'text-gray-600'}`}>
        {value}
      </span>
    </div>
  );
}

/* Minimal SVG icons */
const IcCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);
const IcArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

/* Move-to-section modal */
function MoveModal({ currentKey, onMove, onClose }) {
  const [target, setTarget] = useDtState('');
  const opts = DT_SECTIONS.filter(s => s.key !== currentKey);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-72">
        <p className="text-sm font-bold text-gray-900 mb-4">Move selected to…</p>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={target}
          onChange={e => setTarget(e.target.value)}
        >
          <option value="">Choose section</option>
          {opts.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50"
          >Cancel</button>
          <button
            disabled={!target}
            onClick={() => target && onMove(target)}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >Move</button>
        </div>
      </div>
    </div>
  );
}

/* One section card */
function SectionCard({ section, rows, onDelete, onMove, onSaveField }) {
  const [sel,      setSel]      = useDtState(new Set());
  const [edits,    setEdits]    = useDtState({});
  const [showMove, setShowMove] = useDtState(false);
  const [busy,     setBusy]     = useDtState(false);

  /* re-sync selection when rows change (e.g. after refresh) */
  useDtEffect(() => { setSel(new Set()); }, [rows]);

  const allChecked = rows.length > 0 && rows.every(r => sel.has(r.id));

  function toggleAll()  { setSel(allChecked ? new Set() : new Set(rows.map(r => r.id))); }
  function toggleRow(id) {
    setSel(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  /* inline edit helpers */
  function editVal(id, field, fallback) {
    return (edits[id] && edits[id][field] !== undefined) ? edits[id][field] : (fallback ?? '');
  }
  function onEditChange(id, field, val) {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));
  }
  async function onEditBlur(id, field) {
    const val = editVal(id, field, '');
    await onSaveField(id, field, val);
  }

  async function handleDelete(ids) {
    setBusy(true);
    await onDelete(ids);
    setSel(new Set());
    setBusy(false);
  }
  async function handleMove(targetKey) {
    setBusy(true);
    await onMove([...sel], targetKey);
    setSel(new Set());
    setShowMove(false);
    setBusy(false);
  }

  const hasSelection = sel.size > 0;

  /* Editable text input cell */
  const EditCell = ({ id, field, width = 'w-20' }) => (
    <input
      className={`${width} text-[11px] border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white`}
      value={editVal(id, field, rows.find(r => r.id === id)?.[field] || '')}
      onChange={e => onEditChange(id, field, e.target.value)}
      onBlur={() => onEditBlur(id, field)}
    />
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{section.label}</span>
        <span className="text-xs text-gray-400">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Bulk action bar — visible only when rows are selected */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-5">
          <button
            disabled={busy}
            onClick={() => setShowMove(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40"
          >
            <IcArrow /> Move
          </button>
          <button
            disabled={busy}
            onClick={() => handleDelete([...sel])}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            <IcTrash /> Delete
          </button>
          <span className="ml-auto text-xs text-gray-500">{sel.size} selected</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              <th className="px-3 py-2.5 w-8">
                <input type="checkbox" checked={allChecked} onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
              </th>
              {[
                'Reason','Instruction','Date','Creditor/Furnisher',
                'Creditor Name','Account#','Reason',
                'Late Payment','Remain Late Payment','Balance',
                'Status','Account Status','Action',
              ].map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 text-left font-semibold whitespace-nowrap"
                  style={{ color: '#6b7280' }}
                >{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-5 text-center text-xs text-gray-400 italic">
                  No records
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr
                key={row.id}
                style={{
                  borderBottom: '1px solid #f9fafb',
                  background: sel.has(row.id) ? 'rgba(219,234,254,0.35)' : 'transparent',
                }}
                className="hover:bg-gray-50/50 transition-colors"
              >
                {/* Checkbox */}
                <td className="px-3 py-2">
                  <input type="checkbox" checked={sel.has(row.id)} onChange={() => toggleRow(row.id)}
                    className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                </td>

                {/* Reason (editable) */}
                <td className="px-3 py-2">
                  <EditCell id={row.id} field={F.reason} width="w-24" />
                </td>

                {/* Instruction (editable) */}
                <td className="px-3 py-2">
                  <EditCell id={row.id} field={F.instruction} width="w-24" />
                </td>

                {/* Date */}
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#4b5563' }}>
                  {dtFormatDate(row[F.date])}
                </td>

                {/* Creditor/Furnisher (Bureau) */}
                <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: '#059669' }}>
                  {row[F.Creditor] || '—'}
                </td>

                {/* Creditor Name */}
                <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: '#059669' }}>
                  {row[F.creditorName] || '—'}
                </td>

                {/* Account# */}
                <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: '#374151', fontSize: 10.5 }}>
                  {row[F.accountNum] || '—'}
                </td>

                {/* Reason full text (read-only) */}
                <td className="px-3 py-2" style={{ maxWidth: 200 }}>
                  <span className="block truncate" style={{ color: '#4b5563' }} title={row[F.acctReason] || ''}>
                    {row[F.acctReason] || '—'}
                  </span>
                </td>

                {/* Late Payment */}
                <td className="px-3 py-2 text-right" style={{ color: '#374151' }}>
                  {row[F.latePayment] ?? '—'}
                </td>

                {/* Remain Late Payment */}
                <td className="px-3 py-2 text-right" style={{ color: '#374151' }}>
                  {row[F.remainLate] ?? '—'}
                </td>

                {/* Balance */}
                <td className="px-3 py-2 text-right whitespace-nowrap" style={{ color: '#374151' }}>
                  {dtFmtBalance(row[F.balance])}
                </td>

                {/* Status */}
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#4b5563' }}>
                  {row[F.status] || '—'}
                </td>

                {/* Account Status */}
                <td className="px-3 py-2 text-center">
                  <AcctStatusBadge value={row[F.acctStatus]} />
                </td>

                {/* Action */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      title="Copy reason"
                      onClick={() => navigator.clipboard?.writeText(row[F.reason] || '')}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      style={{ color: '#3b82f6' }}
                    >
                      <IcCopy />
                    </button>
                    <button
                      title="Delete record"
                      onClick={() => handleDelete([row.id])}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      style={{ color: '#3b82f6' }}
                    >
                      <IcTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMove && (
        <MoveModal
          currentKey={section.key}
          onMove={handleMove}
          onClose={() => setShowMove(false)}
        />
      )}
    </div>
  );
}

/* ─── Main exported component ─── */
function AccountsDetailTable({ contactId, accounts: propAccounts }) {
  const [accounts, setAccounts] = useDtState(propAccounts || []);

  useDtEffect(() => {
    setAccounts(propAccounts || []);
  }, [propAccounts]);

  /* Re-fetch after a mutation */
  function refresh() {
    if (!contactId) return;
    ZOHO.CRM.API.searchRecords({
      Entity:   'Client_Account',
      Type:     'criteria',
      Query:    '(Contact_Name:equals:' + contactId + ')',
      page:     1,
      per_page: 200,
    })
      .then(resp => setAccounts((resp && resp.data) || []))
      .catch(() => {});
  }

  async function handleDelete(ids) {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id =>
        ZOHO.CRM.API.deleteRecord({ Entity: 'Client_Account', RecordID: id })
      ));
      refresh();
    } catch(e) { console.warn('delete error', e); }
  }

  async function handleMove(ids, targetType) {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id =>
        ZOHO.CRM.API.updateRecord({
          Entity:   'Client_Account',
          RecordID: id,
          APIData:  { id, [F.blockType]: targetType },
        })
      ));
      refresh();
    } catch(e) { console.warn('move error', e); }
  }

  async function handleSaveField(id, field, value) {
    try {
      await ZOHO.CRM.API.updateRecord({
        Entity:   'Client_Account',
        RecordID: id,
        APIData:  { id, [field]: value },
      });
    } catch(e) { console.warn('save error', e); }
  }

  /* Group by block_type */
  const grouped = Object.fromEntries(DT_SECTIONS.map(s => [s.key, []]));
  accounts.forEach(acc => {
    const key = acc[F.blockType];
    if (grouped[key]) grouped[key].push(acc);
  });

  return (
    <div className="space-y-4">
      {DT_SECTIONS.map(section => (
        <SectionCard
          key={section.key}
          section={section}
          rows={grouped[section.key]}
          onDelete={handleDelete}
          onMove={handleMove}
          onSaveField={handleSaveField}
        />
      ))}
    </div>
  );
}

window.AccountsDetailTable = AccountsDetailTable;
