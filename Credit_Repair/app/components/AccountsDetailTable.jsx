/*
        {isOpen && (() => {
          const menu = (
            <div
              className="fixed overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
              style={open.style || { position: 'fixed', width: 320, maxHeight: 180, zIndex: 2147483647 }}
              data-dropdown
            >
              {options.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">No options</div>
              ) : (
                options.map(opt => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => selectOption(row, field, opt.id)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${String(opt.id) === String(selectedId) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          );

          if (window.ReactDOM && window.ReactDOM.createPortal) {
            return window.ReactDOM.createPortal(menu, document.body);
          }

          return menu;
        })()}
*/

const { useState: useDtState, useEffect: useDtEffect } = React;

const DT_SECTIONS = [
  { key: 'late', label: 'Late Payment Account' },
  { key: 'new', label: 'New Account' },
  { key: 'start', label: 'Started Negative Account' },
  { key: 'charged', label: 'Charged Off Account' },
  { key: 'closed', label: 'Closed Account' },
  { key: 'account_change', label: 'Account Change' },
  { key: 'removed', label: 'Removed Account' },
];

/* Field API name map — single place to update */
const F = {
  blockType: 'Block_Type',
  Creditor: 'Creditor',
  date: 'Created_Time',
  creditorName: 'Creditor_Name',
  accountNum: 'Account_Number1',
  reason: 'Reason',
  instruction: 'Instruction',
  clientId: 'Client_ID',
  acctReason: 'Remarks',
  latePayment: 'Current_Late_Count',
  remainLate: 'Updated_Late_Count',
  balance: 'Credit_Balance',
  status: 'Dispute_Status',
  acctStatus: 'Display_Status',
};

function dtFormatDate(v) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString(); } catch { return v; }
}

function dtFormatDateParts(v) {
  if (!v) return { date: '—', time: '' };
  try {
    const d = new Date(v);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { date: String(v), time: '' };
  }
}

function dtFmtBalance(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return isNaN(n) ? v : '$' + n.toLocaleString();
}

function maskAccount(val) {
  const s = dtStr(val);
  if (!s) return '—';
  const first4 = s.slice(0, 4);
  const maskLen = Math.max(4, s.length - 4);
  return first4 + 'x'.repeat(maskLen);
}

function dtStr(val) {
  if (!val) return '';
  if (typeof val === 'object') return val.Name || val.display_value || val.name || val.value || '';

  return String(val);
}

function lookupId(val) {
  if (!val) return '';
  if (typeof val === 'object') return val.id || val.ID || val.record_id || val.RecordID || '';
  return String(val);
}

function isDeletedFlag(val) {
  if (val === true) return true;
  if (val === false || val == null) return false;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return false;
}

function isDisplayDeleted(row) {
  return dtStr(row && row[F.acctStatus]).trim().toLowerCase() === 'deleted';
}

function matchesContact(row, contactId) {
  if (!contactId) return true;
  const raw = row[F.clientId] || row.Client_ID || row.Client || row.Contact;
  const matchId = lookupId(raw);
  return String(matchId) === String(contactId);
}

function optionLabel(options, id) {
  const match = (options || []).find(opt => String(opt.id) === String(id));
  return match ? match.label : '';
}

async function fetchMasterOptions() {
  if (!window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];
  const perPage = 200;
  const reasons = [];
  const instructions = [];
  const seenReasons = new Set();
  const seenInstructions = new Set();
  const queryBase = '((Type_of_information:equals:Account)or(Type_of_information:equals:account))';

  function pushOption(list, seen, id, label) {
    if (!id) return;
    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    list.push({ id, label: label || '—' });
  }

  function classifyRow(row) {
    const typeVal = dtStr(row.Type || row.type || row.Type_of_information || row.type_of_information).trim().toLowerCase();
    const reasonLabel = dtStr(row.Reason || row.reason || row.Name || row.name || row.display_value);
    const instructionLabel = dtStr(row.Instruction || row.instruction || row.Name || row.name || row.display_value);

    if (typeVal === 'reason' || typeVal === 'reasons') {
      pushOption(reasons, seenReasons, row.id, reasonLabel);
      return;
    }

    if (typeVal === 'instruction' || typeVal === 'instructions') {
      pushOption(instructions, seenInstructions, row.id, instructionLabel);
      return;
    }

    if (row.Reason) pushOption(reasons, seenReasons, row.id, reasonLabel);
    if (row.Instruction) pushOption(instructions, seenInstructions, row.id, instructionLabel);
  }

  if (ZOHO.CRM.API.searchRecord) {
    try {
      for (let page = 1; page <= 5; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Master_Reason_Instruction',
          Type: 'criteria',
          Query: queryBase,
        }, page, perPage);

        const data = (resp && resp.data) || [];
        data.forEach(row => {
          console.log('[CF] Master_Reason_Instruction row:', row);
          classifyRow(row);
        });

        const more = resp && resp.info && resp.info.more_records;
        if (!more && data.length < perPage) break;
        if (data.length < perPage) break;
      }
    } catch (e) {
      console.warn('[CF] Master_Reason_Instruction search failed. Falling back to getAllRecords.', e);
    }
  }

  if (reasons.length === 0 && instructions.length === 0 && ZOHO.CRM.API.getAllRecords) {
    for (let page = 1; page <= 5; page++) {
      const resp = await ZOHO.CRM.API.getAllRecords({
        Entity: 'Master_Reason_Instruction',
        page,
        per_page: perPage,
      });
      const data = (resp && resp.data) || [];
      data.forEach(row => {
        console.log('[CF] Master_Reason_Instruction row:', row);
        const typeVal = dtStr(row.Type_of_information || row.Type_of_Information || row.type_of_information);
        const typeMatch = /account/i.test(typeVal || '');
        if (typeMatch) classifyRow(row);
      });

      const more = resp && resp.info && resp.info.more_records;
      if (!more && data.length < perPage) break;
      if (data.length < perPage) break;
    }
  }

  return { reasons, instructions };
}

/* Red-X badge for Negative, plain text otherwise */
function AcctStatusBadge({ value }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  const isNeg = /negative/i.test(value);
  const pill = statusPillStyle(value);
  return (
    <div className="flex items-center justify-center gap-1">
      {isNeg && (
        <span
          className="inline-flex items-center justify-center rounded-full text-white font-bold shadow-sm"
          style={{ width: 18, height: 18, fontSize: 11, background: '#ef4444' }}
        >✕</span>
      )}
      <span
        className="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
        style={{ color: pill.color, background: pill.background, borderColor: pill.borderColor }}
      >
        {value}
      </span>
    </div>
  );
}

function creditorBadgeStyle(value) {
  const normalized = dtStr(value).toLowerCase();
  if (normalized.includes('experian')) {
    return { color: '#ffffff', background: '#9b258f', borderColor: '#9b258f' };
  }
  if (normalized.includes('transunion') || normalized.includes('trans union')) {
    return { color: '#ffffff', background: '#08a3bd', borderColor: '#08a3bd' };
  }
  if (normalized.includes('equifax')) {
    return { color: '#ffffff', background: '#b62046', borderColor: '#b62046' };
  }
  return { color: '#374151', background: 'rgba(243, 244, 246, 0.90)', borderColor: 'rgba(209, 213, 219, 0.80)' };
}

function statusPillStyle(value) {
  const normalized = dtStr(value).toLowerCase();
  if (/negative|fail|reject|bad|deni|declin|overdu|default|charg|derog|collec|delinq|closed|negati/i.test(normalized)) {
    return { color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca' };
  }
  if (/warn|pend|review|process|progress|unknown|open|escalated/i.test(normalized)) {
    return { color: '#b45309', background: '#fffbeb', borderColor: '#fde68a' };
  }
  if (/positive|good|ok|approv|current|paid|clear|resolved|removed|success|initial/i.test(normalized)) {
    return { color: '#047857', background: '#ecfdf5', borderColor: '#a7f3d0' };
  }
  if (/deleted/i.test(normalized)) {
    return { color: '#475569', background: '#f1f5f9', borderColor: '#cbd5e1' };
  }
  return { color: '#334155', background: '#f8fafc', borderColor: '#e2e8f0' };
}

/* Minimal SVG icons */
const IcCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IcArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IcMove = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="17" r="1" />
    <circle cx="15" cy="7" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="17" r="1" />
  </svg>
);

/* Move-to-section modal */
function MoveModal({ currentKey, onMove, onClose }) {
  const [target, setTarget] = useDtState('');
  const [dropOpen, setDropOpen] = useDtState(false);
  const [dropPos, setDropPos] = useDtState({ top: 0, left: 0, width: 0 });
  const buttonRef = React.useRef(null);
  const dropRef = React.useRef(null);
  const opts = DT_SECTIONS.filter(s => s.key !== currentKey);

  /* Prevent body scroll when modal is open */
  useDtEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  /* Close dropdown when clicking outside */
  useDtEffect(() => {
    if (!dropOpen) return;
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropOpen]);

  const toggleDropdown = () => {
    if (!dropOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    setDropOpen(!dropOpen);
  };

  const selectedLabel = opts.find(o => o.key === target)?.label || 'Choose section';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{ pointerEvents: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-80" style={{ pointerEvents: 'auto' }}>
        <p className="text-base font-bold text-gray-900 mb-5">Move to…</p>

        {/* Custom Dropdown Button */}
        <div className="mb-5">
          <button
            ref={buttonRef}
            type="button"
            onClick={e => { e.stopPropagation(); toggleDropdown(); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-left bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition-colors"
          >
            <span className={target ? 'text-gray-900 font-medium' : 'text-gray-500'}>{selectedLabel}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 flex-shrink-0 ${dropOpen ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        {/* Dropdown Menu - Rendered via Portal to float freely */}
        {dropOpen && ReactDOM.createPortal(
          <div
            ref={dropRef}
            className="fixed border border-gray-200 rounded-lg bg-white shadow-2xl max-h-64 overflow-y-auto"
            style={{
              top: dropPos.top + 'px',
              left: dropPos.left + 'px',
              width: dropPos.width + 'px',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
          >
            {opts.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
            ) : (
              opts.map(o => (
                <button
                  type="button"
                  key={o.key}
                  onClick={e => {
                    e.stopPropagation();
                    setTarget(o.key);
                    setDropOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 active:bg-blue-100 transition-colors border-b border-gray-100 last:border-b-0 ${target === o.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!target}
            onClick={() => target && onMove(target)}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* One section card */
function SectionCard({ section, rows, onDelete, onMove, onSaveRow, reasonOptions, instructionOptions, dropdownOpen, setDropdownOpen, readOnly = false }) {
  const [sel, setSel] = useDtState(new Set());
  const open = dropdownOpen || { sectionKey: null, id: null, field: null, style: null };
  const setOpen = setDropdownOpen;
  const [moveRowId, setMoveRowId] = useDtState(null);
  const [moveMenuOpen, setMoveMenuOpen] = useDtState(false);
  const [moveMenuStyle, setMoveMenuStyle] = useDtState(null);
  const moveMenuRef = React.useRef(null);
  const [busy, setBusy] = useDtState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useDtState(false);
  const bulkMoveRef = React.useRef(null);
  const bulkMoveButtonRef = React.useRef(null);
  const [bulkMoveMenuStyle, setBulkMoveMenuStyle] = useDtState(null);
  const [expandedRemarks, setExpandedRemarks] = useDtState(new Set());

  /* re-sync selection when rows change (e.g. after refresh) */
  useDtEffect(() => {
    setSel(new Set());
    setBulkMoveOpen(false);
    setMoveMenuOpen(false);
    setMoveRowId(null);
    setMoveMenuStyle(null);
    setExpandedRemarks(new Set());
  }, [rows]);

  useDtEffect(() => {
    if (!open.id || open.sectionKey !== section.key) return;
    function handle(e) {
      const target = e.target && e.target.closest ? e.target : e.target && e.target.parentElement;
      if (!target || !target.closest('[data-dropdown]')) {
        setOpen({ sectionKey: null, id: null, field: null, style: null });
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open.id, open.sectionKey, section.key]);

  useDtEffect(() => {
    if (!moveMenuOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setMoveMenuOpen(false);
        setMoveRowId(null);
        setMoveMenuStyle(null);
      }
    }
    function onClick(e) {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target)) {
        setMoveMenuOpen(false);
        setMoveRowId(null);
        setMoveMenuStyle(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClick);
    };
  }, [moveMenuOpen]);

  useDtEffect(() => {
    if (!bulkMoveOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setBulkMoveOpen(false);
      }
    }
    function onClick(e) {
      if (bulkMoveRef.current && !bulkMoveRef.current.contains(e.target)) {
        setBulkMoveOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClick);
    };
  }, [bulkMoveOpen]);

  useDtEffect(() => {
    if (sel.size === 0) return;
    setMoveMenuOpen(false);
    setMoveRowId(null);
    setMoveMenuStyle(null);
  }, [sel.size]);

  const allChecked = !readOnly && rows.length > 0 && rows.every(r => sel.has(r.id));

  function toggleAll() {
    if (readOnly) return;
    setSel(allChecked ? new Set() : new Set(rows.map(r => r.id)));
  }
  function toggleRow(id) {
    if (readOnly) return;
    setSel(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function openMoveForRow(id, triggerEl) {
    if (readOnly) return;
    if (moveRowId === id && moveMenuOpen) {
      setMoveMenuOpen(false);
      setMoveRowId(null);
      setMoveMenuStyle(null);
      return;
    }
    setMoveRowId(id);
    setMoveMenuStyle(buildMoveMenuStyle(triggerEl));
    setMoveMenuOpen(true);
  }

  function buildMenuStyle(triggerEl) {
    if (!triggerEl || !triggerEl.getBoundingClientRect) return null;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 320;
    const menuMaxHeight = 180;
    const pad = 8;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuWidth - pad);
    }
    let top = rect.bottom + 4;
    if (top + menuMaxHeight > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuMaxHeight - 4);
    }
    return {
      position: 'fixed',
      top,
      left,
      width: menuWidth,
      maxHeight: menuMaxHeight,
      zIndex: 9999,
    };
  }

  function buildMoveMenuStyle(triggerEl) {
    if (!triggerEl || !triggerEl.getBoundingClientRect) return null;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 230;
    const menuMaxHeight = 260;
    const pad = 8;
    let left = rect.right - menuWidth;
    if (left < pad) left = pad;
    if (left + menuWidth > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuWidth - pad);
    }

    let top = rect.bottom + 6;
    if (top + menuMaxHeight > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuMaxHeight - 6);
    }

    return {
      position: 'fixed',
      top,
      left,
      width: menuWidth,
      maxHeight: menuMaxHeight,
      zIndex: 2147483647,
    };
  }

  function buildBulkMoveMenuStyle(triggerEl) {
    if (!triggerEl || !triggerEl.getBoundingClientRect) return null;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 240;
    const menuMaxHeight = 300;
    const pad = 8;
    let left = rect.left;
    let top = rect.bottom + 8;
    
    if (left + menuWidth > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuWidth - pad);
    }
    if (top + menuMaxHeight > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuMaxHeight - 8);
    }
    
    return {
      position: 'fixed',
      top,
      left,
      width: menuWidth,
      maxHeight: menuMaxHeight,
      zIndex: 2147483647,
    };
  }

  function dropdownRowKey(row) {
    return row.id || [section.key, row[F.accountNum], row[F.Creditor], row[F.date], row[F.creditorName]]
      .map(dtStr)
      .join('|');
  }

  function toggleRemark(rowKey) {
    setExpandedRemarks(prev => {
      const next = new Set(prev);
      next.has(rowKey) ? next.delete(rowKey) : next.add(rowKey);
      return next;
    });
  }

  function toggleDropdown(e, rowKey, field) {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(prev => (prev.sectionKey === section.key && prev.id === rowKey && prev.field === field)
      ? { sectionKey: null, id: null, field: null, style: null }
      : { sectionKey: section.key, id: rowKey, field, style: buildMenuStyle(e.currentTarget) }
    );
  }
  async function selectOption(row, field, optionId) {
    if (readOnly) return;
    const currentId = lookupId(row[field]);
    setOpen({ sectionKey: null, id: null, field: null, style: null });
    if (!optionId || String(optionId) === String(currentId)) return;
    setBusy(true);
    await onSaveRow(row.id, field, optionId);
    setBusy(false);
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
    setMoveMenuOpen(false);
    setMoveRowId(null);
    setMoveMenuStyle(null);
    setBusy(false);
  }

  async function handleMoveRow(id, targetKey) {
    setBusy(true);
    await onMove([id], targetKey);
    setMoveMenuOpen(false);
    setMoveRowId(null);
    setMoveMenuStyle(null);
    setBusy(false);
  }

  const hasSelection = !readOnly && sel.size > 0;
  const moveOptions = DT_SECTIONS.filter(s => s.key !== section.key);
  const firstSelectedId = sel.size ? Array.from(sel)[0] : null;


  function renderDropdownUnused(row, field, options) {
    const selectedId = lookupId(row[field]);
    let selectedLabel = optionLabel(options, selectedId) || dtStr(row[field]) || 'Select';
    const isOpen = open.id === row.id && open.field === field;

    if (readOnly) {
      if (section.key === 'deleted' && selectedLabel.trim().toLowerCase() === 'select') {
        selectedLabel = field === F.reason ? 'No reason selected' : 'No instruction selected';
      }
      return <span className="text-[11px] text-gray-600">{selectedLabel || '—'}</span>;
    }

    const hasSelectedOption = !selectedId || options.some(opt => String(opt.id) === String(selectedId));

    return (
      <div
        value={selectedId || ''}
        disabled={busy}
        title={selectedLabel || 'Select'}
        onChange={(e) => selectOption(row, field, e.target.value)}
        className="w-36 text-[11px] border border-gray-200 rounded px-1.5 py-1 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        <div>Select</div>
        {!hasSelectedOption && <div>{selectedLabel}</div>}
        {options.map(opt => (
          <div key={opt.id}>{opt.label}</div>
        ))}
      </div>
    );

    const dropdownMenu = isOpen ? (
      <div
        className="fixed overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...(open.style || { position: 'fixed', width: 320, maxHeight: 180 }),
          zIndex: 2147483647,
          pointerEvents: 'auto',
        }}
        data-dropdown
      >
        {options.length === 0 ? (
          <div className="px-3 py-2 text-xs text-gray-400">No options</div>
        ) : (
          options.map(opt => (
            <button
              type="button"
              key={opt.id}
              onClick={() => selectOption(row, field, opt.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${String(opt.id) === String(selectedId) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
            >
              {opt.label}
            </button>
          ))
        )}
      </div>
    ) : null;

    return (
      <div className="relative" data-dropdown onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onMouseDown={(e) => toggleDropdown(e, row.id, field)}
          className="w-28 text-left text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white hover:border-gray-300 flex items-center justify-between"
        >
          <span className="truncate">{selectedLabel || 'Select'}</span>
          <span className="ml-2 text-gray-400">▾</span>
        </button>
        {dropdownMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal
          ? ReactDOM.createPortal(dropdownMenu, document.body)
          : dropdownMenu}
      </div>
    );
  }

  function renderDropdown(row, field, options) {
    const selectedId = lookupId(row[field]);
    let selectedLabel = optionLabel(options, selectedId) || dtStr(row[field]) || 'Select';
    const rowKey = dropdownRowKey(row);
    const isOpen = open.sectionKey === section.key && open.id === rowKey && open.field === field;

    if (readOnly) {
      if (section.key === 'deleted' && selectedLabel.trim().toLowerCase() === 'select') {
        selectedLabel = field === F.reason ? 'No reason selected' : 'No instruction selected';
      }
      return <span className="text-[11px] text-gray-600">{selectedLabel || '—'}</span>;
    }

    const menu = isOpen ? (
      <div
        className="fixed rounded-xl border bg-white shadow-2xl overflow-hidden"
        data-dropdown
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...(open.style || { position: 'fixed', width: 320, maxHeight: 220 }),
          zIndex: 2147483647,
          borderColor: '#dbe3ee',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.16)',
        }}
      >
        <div className="max-h-56 overflow-y-auto py-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No options</div>
          ) : (
            options.map(opt => (
              <button
                type="button"
                key={opt.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(row, field, opt.id)}
                className={`block w-full text-left px-3 py-2 text-xs transition-colors hover:bg-sky-50 ${
                  String(opt.id) === String(selectedId)
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      </div>
    ) : null;

    return (
      <div className="relative inline-block" data-dropdown onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={busy}
          title={selectedLabel || 'Select'}
          onClick={(e) => toggleDropdown(e, rowKey, field)}
          className="w-36 text-left text-[11px] border rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-100 flex items-center justify-between disabled:opacity-60 shadow-sm transition-all"
          style={{ borderColor: '#dbe3ee', color: '#0f172a' }}
        >
          <span className="truncate">{selectedLabel || 'Select'}</span>
          <span className={`ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {menu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal
          ? ReactDOM.createPortal(menu, document.body)
          : menu}
      </div>
    );
  }

  const headers = [
    'Reason', 'Instruction', 'Date', 'Creditor',
    'Creditor Name', 'Account', 'Remarks',
    'Late Payment', 'Remain Late Payment', 'Balance',
    'Status', 'Account Status',
  ].concat(readOnly ? [] : ['Action']);
  const columnCount = readOnly ? headers.length : headers.length + 1;

  return (
    <div
      className="cf-glass cf-account-section rounded-xl border overflow-visible relative bg-white"
      style={{
        zIndex: open.sectionKey === section.key && open.id ? 9999 : 0,
        borderColor: 'rgba(226, 232, 240, 0.9)',
        boxShadow: '0 12px 34px rgba(15, 23, 42, 0.08)',
      }}
    >
      <style>
        {`
          .cf-account-section table {
            background-color: #ffffff;
            border: 1px solid #e8eef5;
            border-radius: 14px;
          }

          .cf-account-section thead,
          .cf-account-section thead tr,
          .cf-account-section thead th {
            background-color: #f7f9fc;
          }

          .cf-account-section td {
            background-color: inherit;
          }

          .cf-account-section tbody td {
            border-bottom: 1px solid #eef2f7;
          }

          .cf-account-section {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            --cf-head-h: 44px;
            --cf-row-h: 52px;
          }

          .cf-account-section thead th {
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
            color: #5b6472 !important;
            font-size: 11px;
            font-weight: 700 !important;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-bottom: 1px solid #e6edf5 !important;
          }

          .cf-account-section th,
          .cf-account-section td {
            border-color: transparent !important;
          }

          .cf-account-section thead th {
            border-bottom-color: #e6edf5 !important;
          }

          .cf-account-section tbody tr {
            transition: background-color 160ms ease;
          }

          .cf-account-section tbody tr:hover {
            background: rgba(249, 250, 251, 0.8) !important;
          }

          .cf-account-section tbody tr:hover td {
            color: #111827;
          }

          .cf-account-section td {
            vertical-align: middle;
          }

          .cf-account-section input[type="checkbox"] {
            accent-color: #0ea5e9;
          }

          .cf-account-status-cell span {
            font-size: 13px !important;
            font-weight: 400 !important;
          }

          .cf-remark-scroll::-webkit-scrollbar { width: 8px; }
          .cf-remark-scroll::-webkit-scrollbar-track { background: rgba(226, 232, 240, 0.65); border-radius: 999px; }
          .cf-remark-scroll::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.62); border-radius: 999px; }

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

      {/* Section header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between rounded-t-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.90))',
          borderColor: '#e5e7eb',
        }}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 tracking-normal">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500 shadow-sm" />
          {section.label}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {rows.length} record{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bulk action bar — visible only when rows are selected */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-5">
          {!bulkMoveOpen ? (
            <>
              <button
                ref={bulkMoveButtonRef}
                disabled={busy}
                onClick={() => {
                  if (bulkMoveButtonRef.current) {
                    setBulkMoveMenuStyle(buildBulkMoveMenuStyle(bulkMoveButtonRef.current));
                  }
                  setBulkMoveOpen(true);
                }}
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
            </>
          ) : (
            <div ref={bulkMoveRef}>
              <button
                ref={bulkMoveButtonRef}
                type="button"
                onClick={() => {
                  if (!bulkMoveMenuStyle && bulkMoveButtonRef.current) {
                    setBulkMoveMenuStyle(buildBulkMoveMenuStyle(bulkMoveButtonRef.current));
                  }
                }}
                className="w-60 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-left bg-white hover:bg-slate-50 flex items-center justify-between shadow-sm"
              >
                <span className="text-slate-600">Choose Account Type</span>
                <span className="ml-2 text-gray-400">▾</span>
              </button>
              {bulkMoveMenuStyle && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
                <div
                  className="fixed rounded-xl border border-slate-200 bg-white overflow-hidden"
                  style={{
                    ...bulkMoveMenuStyle,
                    pointerEvents: 'auto',
                    marginTop: 10,
                    boxShadow: '0 14px 28px rgba(15, 23, 42, 0.12)',
                  }}
                >
                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                    {moveOptions.map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          handleMove(opt.key);
                          setBulkMoveOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors rounded-md"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              ) : null}
            </div>
          )}
          <span className="ml-auto text-xs text-gray-500">{sel.size} selected</span>
        </div>
      )}

      <div className="rounded-b-xl overflow-hidden bg-white">
        <div
          className="cf-glass-scroll overview-started-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.76))',
            maxHeight: 'calc(var(--cf-head-h) + (var(--cf-row-h) * 5))',
            borderBottomLeftRadius: '0.75rem',
            borderBottomRightRadius: '0.75rem',
            scrollbarGutter: 'stable',
          }}
        >
          <table
            className="w-full"
          style={{
            fontSize: 13,
            borderCollapse: 'separate',
            borderSpacing: 0,
            background: 'rgba(255, 255, 255, 0.72)',
            minWidth: readOnly ? 1420 : 1540,
            color: '#0f172a',
          }}
        >
          <thead>
            <tr>
              {!readOnly && (
                <th
                  className="px-4 py-3 w-8 text-left"
                >
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                </th>
              )}
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left whitespace-nowrap"
                  style={{
                    ...(h === 'Remarks' ? { width: 260, minWidth: 240, maxWidth: 300 } : {}),
                    ...(h === 'Balance' ? { width: '13ch', minWidth: '13ch', maxWidth: '13ch' } : {}),
                  }}
                >
                  {h === 'Remain Late Payment' ? 'Remain Late' : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-5 text-center text-xs text-gray-400 italic">
                  No records
                </td>
              </tr>
            )}
            {rows.map(row => (
              (() => {
                const rowKey = dropdownRowKey(row);
                return (
              <tr
                key={rowKey}
                style={{
                  background: !readOnly && sel.has(row.id)
                    ? 'rgba(224,242,254,0.78)'
                    : 'transparent',
                }}
              >
                {/* Checkbox */}
                {!readOnly && (
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={sel.has(row.id)} onChange={() => toggleRow(row.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                  </td>
                )}

                {/* Reason (editable) */}
                <td className="px-4 py-3 text-left" style={{ color: '#111827', fontWeight: 500 }}>
                  {renderDropdown(row, F.reason, reasonOptions)}
                </td>

                {/* Instruction (editable) */}
                <td className="px-4 py-3 text-left" style={{ color: '#111827', fontWeight: 500 }}>
                  {renderDropdown(row, F.instruction, instructionOptions)}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 400 }}>
                  {(() => {
                    const parts = dtFormatDateParts(row[F.date]);
                    return (
                      <div className="leading-tight">
                        <div style={{ fontSize: 13 }}>{parts.date}</div>
                        {parts.time && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{parts.time}</div>}
                      </div>
                    );
                  })()}
                </td>

                {/* Creditor/Furnisher (Bureau) */}
                <td className="px-4 py-3 text-left whitespace-nowrap">
                  {(() => {
                    const creditor = row[F.Creditor] || '—';
                    const badge = creditorBadgeStyle(creditor);
                    return (
                      <span
                        className="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm"
                        style={{
                          color: badge.color,
                          background: badge.background,
                          borderColor: badge.borderColor,
                          minWidth: 86,
                        }}
                      >
                        {creditor}
                      </span>
                    );
                  })()}
                </td>

                {/* Creditor Name */}
                <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 500 }}>
                  {row[F.creditorName] || '—'}
                </td>

                {/* Account# */}
                <td className="px-4 py-3 text-left whitespace-nowrap font-mono" style={{ color: '#111827', fontSize: 13 }}>
                  {maskAccount(row[F.accountNum])}
                </td>

                {/* Remarks - show more opens inline scroll for long text */}
                <td className="px-4 py-3 text-left align-top" style={{ width: 260, minWidth: 240, maxWidth: 300 }}>
                  {(() => {
                    const remarkText = dtStr(row[F.acctReason]) || '—';
                    const compactRemark = remarkText.trim().replace(/\s+/g, ' ');
                    const isLongRemark = compactRemark.length > 100;
                    const isExpanded = expandedRemarks.has(rowKey);
                    return (
                      <div className="text-left">
                        <div
                          className={isExpanded ? 'cf-remark-scroll' : ''}
                          style={{
                            color: '#374151',
                            fontWeight: 400,
                            maxHeight: isLongRemark ? (isExpanded ? '6.75rem' : '3.1rem') : 'none',
                            overflowY: isLongRemark && isExpanded && compactRemark.length > 130 ? 'auto' : 'hidden',
                            overflowX: 'hidden',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            lineHeight: '1.35em',
                            scrollbarWidth: isLongRemark && isExpanded ? 'thin' : 'auto',
                          }}
                        >
                          {remarkText}
                        </div>
                        {isLongRemark && (
                          <button
                            type="button"
                            onClick={() => toggleRemark(rowKey)}
                            className="mt-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </td>

                {/* Late Payment */}
                <td className="px-4 py-3 text-left" style={{ color: '#111827', fontWeight: 400 }}>
                  {row[F.latePayment] ?? '—'}
                </td>

                {/* Remain Late Payment */}
                <td className="px-4 py-3 text-left" style={{ color: '#111827', fontWeight: 400 }}>
                  {row[F.remainLate] ?? '—'}
                </td>

                {/* Balance */}
                <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 600, width: '13ch', minWidth: '13ch', maxWidth: '13ch', boxSizing: 'border-box', overflow: 'hidden' }}>
                  {(() => {
                    const balanceText = dtFmtBalance(row[F.balance]);
                    const balanceDigits = String(row[F.balance] ?? '').replace(/[^\d]/g, '').slice(0, 10);
                    const visibleBalance = balanceDigits ? '$' + balanceDigits : balanceText;
                    return (
                      <div
                        title={balanceText}
                        style={{
                          display: 'inline-block',
                          maxWidth: '11ch',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                      >
                        {visibleBalance || '—'}
                      </div>
                    );
                  })()}
                </td>

                {/* Status — color-coded */}
                <td className="px-4 py-3 text-left whitespace-nowrap">
                  {(() => {
                    const val = row[F.status] || '';
                    const lv = val.toLowerCase();
                    let color = '#059669';
                    if (/negative|fail|reject|bad|deni|declin|overdu|default|charg|derog|collec|delinq|closed|negati/i.test(lv)) color = '#dc2626';
                    else if (/warn|pend|review|process|progress|unknown|open/i.test(lv)) color = '#d97706';
                    else if (/positive|good|ok|approv|current|paid|clear|resolved|removed|success/i.test(lv)) color = '#059669';
                    const pill = statusPillStyle(val);
                    return (
                      <span
                        className="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold"
                        style={{ color: pill.color || color, background: pill.background, borderColor: pill.borderColor }}
                      >
                        {val || '—'}
                      </span>
                    );
                  })()}
                </td>

                {/* Account Status */}
                <td className="cf-account-status-cell px-4 py-3 text-left" style={{ fontSize: 13 }}>
                  <AcctStatusBadge value={row[F.acctStatus]} />
                </td>

                {/* Action */}
                {!readOnly && (
                  <td className="px-4 py-3 text-center relative">
                    {(() => {
                      const isRowMoveOpen = moveRowId === row.id && moveMenuOpen;
                      const isMenuOpen = isRowMoveOpen;
                      return (
                        <div className="relative" style={{ zIndex: 20000 }}>
                          {!hasSelection && !isRowMoveOpen && (
                            <div className="flex items-center gap-1 transition-all duration-200">
                              <button
                                type="button"
                                title="Move to another account type"
                                onClick={(e) => openMoveForRow(row.id, e.currentTarget)}
                                className="p-1.5 rounded-full border bg-white text-sky-700 shadow-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer"
                                style={{ borderColor: '#bae6fd' }}
                              >
                                <IcMove />
                              </button>
                              <button
                                title="Delete record"
                                onClick={() => handleDelete([row.id])}
                                className="p-1.5 rounded-full border bg-white hover:bg-red-50 hover:border-red-200 transition-all shadow-sm hover:shadow-md"
                                style={{ color: '#eb2525' }}
                              >
                                <IcTrash />
                              </button>
                            </div>
                          )}
                          {isRowMoveOpen && ReactDOM.createPortal(
                            <div
                              ref={moveMenuRef}
                              className="fixed transition-all duration-200"
                              style={moveMenuStyle || { position: 'fixed', width: 230, maxHeight: 260, zIndex: 2147483647 }}
                            >
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (moveMenuOpen) {
                                      setMoveMenuOpen(false);
                                      setMoveRowId(null);
                                    } else {
                                      setMoveMenuOpen(true);
                                    }
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-left bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition-colors"
                                >
                                  <span className="text-gray-500">Choose Account Type</span>
                                  <span className={`ml-2 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                                </button>
                                <div className={`absolute right-0 top-full mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden transition-all duration-200 origin-top-right ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} style={{ zIndex: 9999 }}>
                                  {moveOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-gray-400">No options</div>
                                  ) : (
                                    moveOptions.map(opt => (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => handleMoveRow(row.id, opt.key)}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                      >
                                        {opt.label}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>
                      );
                    })()}
                  </td>
                )}
              </tr>
                );
              })()
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Move dropdown is portaled so it is not clipped by the table scroller. */}
    </div>
  );
}

/* ─── Main exported component ─── */
function AccountsDetailTable({ contactId, accounts: propAccounts, entityName }) {
  const [accounts, setAccounts] = useDtState(propAccounts || []);
  const [deletedAccounts, setDeletedAccounts] = useDtState([]);
  const [reasonOptions, setReasonOptions] = useDtState([]);
  const [instructionOptions, setInstructionOptions] = useDtState([]);
  const [dropdownOpen, setDropdownOpen] = useDtState({ sectionKey: null, id: null, field: null, style: null });

  useDtEffect(() => {
    const active = (propAccounts || []).filter(r => !isDisplayDeleted(r));
    const deleted = (propAccounts || []).filter(isDisplayDeleted);
    setAccounts(active);
    setDeletedAccounts(deleted);
    console.log('[CF] Client_Account propAccounts:', propAccounts);
  }, [propAccounts]);

  useDtEffect(() => {
    let alive = true;
    async function loadOptions() {
      const { reasons, instructions } = await fetchMasterOptions();
      if (!alive) return;
      setReasonOptions(reasons);
      setInstructionOptions(instructions);
      console.log('[CF] Reason options:', reasons);
      console.log('[CF] Reason option labels:', reasons.map(r => r.label));
      console.log('[CF] Instruction options:', instructions);
      console.log('[CF] Instruction option labels:', instructions.map(r => r.label));
    }
    loadOptions();
    return () => { alive = false; };
  }, []);

  useDtEffect(() => {
    (propAccounts || []).forEach(acc => {
      console.log('[CF] Reason Name:', dtStr(acc[F.reason]));
      console.log('[CF] Instruction Name:', dtStr(acc[F.instruction]));
      console.log('[CF] Reason Raw:', acc[F.reason]);
      console.log('[CF] Instruction Raw:', acc[F.instruction]);
    });
  }, [propAccounts]);

  async function fetchByStatusDeleted(shouldBeDeleted) {
    if (!ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];
    const perPage = 100;
    const all = [];
    const statusCriteria = shouldBeDeleted
      ? '((Display_Status:equals:Deleted)or(Display_Status:equals:deleted))'
      : '((Display_Status:not_equal:Deleted)and(Display_Status:not_equal:deleted))';
    const contactCriteria = contactId ? '(' + F.clientId + ':equals:' + contactId + ')' : '';
    const deleteCriteria = '((Delete_flag:equals:false)or(Delete_flag:is_empty:))';
    const query = contactCriteria
      ? contactCriteria + 'and' + statusCriteria + 'and' + deleteCriteria
      : statusCriteria + 'and' + deleteCriteria;

    if (ZOHO.CRM.API.searchRecord) {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Client_Account',
          Type: 'criteria',
          Query: query,
        }, page, perPage);
        console.log('[CF] Client_Account status search query:', query);
        console.log('[CF] Client_Account search response:', resp);
        const data = (resp && resp.data) || [];
        all.push(...data);
        const more = resp && resp.info && resp.info.more_records;
        if (!more && data.length < perPage) break;
        if (data.length < perPage) break;
      }
      return all;
    }

    if (ZOHO.CRM.API.getAllRecords) {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.getAllRecords({
          Entity: 'Client_Account',
          page,
          per_page: perPage,
        });
        console.log('[CF] Client_Account getAllRecords response:', resp);
        const data = (resp && resp.data) || [];
        data.forEach(row => {
          if (isDisplayDeleted(row) === shouldBeDeleted && matchesContact(row, contactId)) all.push(row);
        });
        const more = resp && resp.info && resp.info.more_records;
        if (!more && data.length < perPage) break;
        if (data.length < perPage) break;
      }
    }

    return all;
  }

  async function refreshAll() {
    const [active, deleted] = await Promise.all([
      fetchByStatusDeleted(false),
      fetchByStatusDeleted(true),
    ]);
    setAccounts(active);
    setDeletedAccounts(deleted);
  }

  async function handleDelete(ids) {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id =>
        ZOHO.CRM.API.updateRecord({
          Entity: 'Client_Account',
          RecordID: id,
          APIData: { id, Delete_flag: 'true' },
        })
      ));
      setAccounts(prev => prev.filter(r => !ids.includes(r.id)));
      if (moved.length) {
        setDeletedAccounts(prev => {
          const idSet = new Set(ids);
          const kept = prev.filter(r => !idSet.has(r.id));
          const displayDeleted = moved.filter(isDisplayDeleted);
          return [...displayDeleted, ...kept];
        });
      }
    } catch (e) { console.warn('delete error', e); }
  }

  async function handleMove(ids, targetType) {
    if (!ids.length) return;
    try {
      await Promise.all(ids.map(id =>
        ZOHO.CRM.API.updateRecord({
          Entity: 'Client_Account',
          RecordID: id,
          APIData: { id, [F.blockType]: targetType },
        })
      ));
      setAccounts(prev => prev.map(r => ids.includes(r.id) ? { ...r, [F.blockType]: targetType } : r));
    } catch (e) { console.warn('move error', e); }
  }

  async function handleSaveRow(id, field, optionId) {
    try {
      const apiData = { id, [field]: { id: optionId } };
      await ZOHO.CRM.API.updateRecord({
        Entity: 'Client_Account',
        RecordID: id,
        APIData: apiData,
      });
      setAccounts(prev => prev.map(r => {
        if (r.id !== id) return r;
        const next = { ...r };
        if (field === F.reason) {
          const reasonLabel = optionLabel(reasonOptions, optionId);
          next[F.reason] = { id: optionId, name: reasonLabel };
        }
        if (field === F.instruction) {
          const instructionLabel = optionLabel(instructionOptions, optionId);
          next[F.instruction] = { id: optionId, name: instructionLabel };
        }
        return next;
      }));
    } catch (e) { console.warn('save error', e); }
  }

  /* Group by block_type */
  const grouped = Object.fromEntries(DT_SECTIONS.map(s => [s.key, []]));
  accounts.forEach(acc => {
    const rawKey = acc[F.blockType] || acc.block_type || acc.Block_Type || acc.BlockType;
    const key = dtStr(rawKey).trim().toLowerCase();
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
          onSaveRow={handleSaveRow}
          reasonOptions={reasonOptions}
          instructionOptions={instructionOptions}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
      ))}
      <SectionCard
        section={{ key: 'deleted', label: 'Deleted Accounts' }}
        rows={deletedAccounts}
        onDelete={handleDelete}
        onMove={handleMove}
        onSaveRow={handleSaveRow}
        reasonOptions={reasonOptions}
        instructionOptions={instructionOptions}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        readOnly={true}
      />
    </div>
  );
}

window.AccountsDetailTable = AccountsDetailTable;
