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
  accountNum: 'Account_Number',
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

  /* re-sync selection when rows change (e.g. after refresh) */
  useDtEffect(() => {
    setSel(new Set());
    setBulkMoveOpen(false);
    setMoveMenuOpen(false);
    setMoveRowId(null);
    setMoveMenuStyle(null);
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
    function onClick(e) {
      if (bulkMoveRef.current && !bulkMoveRef.current.contains(e.target)) {
        setBulkMoveOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
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

  function dropdownRowKey(row) {
    return row.id || [section.key, row[F.accountNum], row[F.Creditor], row[F.date], row[F.creditorName]]
      .map(dtStr)
      .join('|');
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
      <select
        value={selectedId || ''}
        disabled={busy}
        title={selectedLabel || 'Select'}
        onChange={(e) => selectOption(row, field, e.target.value)}
        className="w-36 text-[11px] border border-gray-200 rounded px-1.5 py-1 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        <option value="">Select</option>
        {!hasSelectedOption && <option value={selectedId}>{selectedLabel}</option>}
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
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
        className="fixed rounded-lg border border-gray-200 bg-white shadow-2xl overflow-hidden"
        data-dropdown
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...(open.style || { position: 'fixed', width: 320, maxHeight: 220 }),
          zIndex: 2147483647,
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
                className={`block w-full text-left px-3 py-2 text-xs transition-colors hover:bg-emerald-50 ${
                  String(opt.id) === String(selectedId)
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
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
          className="w-36 text-left text-[11px] border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 flex items-center justify-between disabled:opacity-60"
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
      className="cf-glass cf-account-section rounded-xl border border-gray-200 shadow-sm overflow-visible relative bg-white"
      style={{ zIndex: open.sectionKey === section.key && open.id ? 9999 : 0 }}
    >
      <style>
        {`
          .cf-account-section table,
          .cf-account-section thead,
          .cf-account-section tbody,
          .cf-account-section tr,
          .cf-account-section th {
            background-color: rgba(255, 255, 255, 0.42);
          }

          .cf-account-section td {
            background-color: inherit;
          }

          .cf-account-section tbody td {
            border-bottom: 1px solid #d1d5db;
          }

          .cf-account-status-cell span {
            font-size: 13px !important;
            font-weight: 400 !important;
          }
        `}
      </style>

      {/* Section header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl">
        <span className="text-sm font-bold text-gray-800">{section.label}</span>
        <span className="text-xs text-gray-400">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Bulk action bar — visible only when rows are selected */}
      {hasSelection && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-5">
          {!bulkMoveOpen ? (
            <>
              <button
                disabled={busy}
                onClick={() => setBulkMoveOpen(true)}
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
            <div className="flex items-center gap-2" ref={bulkMoveRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMoveOpen(false)}
                  className="w-48 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-500">Move to Section...</span>
                  <span className="ml-2 text-gray-400">▾</span>
                </button>
                <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden z-[10000]">
                  {moveOptions.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        handleMove(opt.key);
                        setBulkMoveOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setBulkMoveOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2"
              >
                Cancel
              </button>
            </div>
          )}
          <span className="ml-auto text-xs text-gray-500">{sel.size} selected</span>
        </div>
      )}

      <div className="rounded-b-xl overflow-hidden bg-white">
        <div
          className="cf-glass-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.34)',
            maxHeight: 420,
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
            background: 'rgba(255, 255, 255, 0.28)',
            minWidth: readOnly ? 1420 : 1540,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #d1d5db' }}>
              {!readOnly && (
                <th
                  className="px-3 py-2.5 w-8"
                  style={{ borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}
                >
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                </th>
              )}
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 text-center whitespace-nowrap"
                  style={{
                    color: '#111827',
                    fontWeight: 700,
                    borderRight: i < headers.length - 1 ? '1px solid #d1d5db' : 'none',
                    borderBottom: '1px solid #d1d5db',
                    ...(h === 'Remarks' ? { width: 260, minWidth: 240, maxWidth: 300 } : {}),
                    ...(h === 'Balance' ? { width: '13ch', minWidth: '13ch', maxWidth: '13ch' } : {}),
                  }}
                >
                  {h === 'Remain Late Payment' ? (
                    <span className="flex flex-col leading-tight -mx-3 -my-2.5">
                      <span className="px-3 py-1.5">Remain Late</span>
                      <span className="px-3 py-1.5">Payment</span>
                    </span>
                  ) : h}
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
              <tr
                key={dropdownRowKey(row)}
                style={{
                  borderBottom: '1px solid #d1d5db',
                  background: !readOnly && sel.has(row.id) ? 'rgba(219,234,254,0.50)' : 'rgba(255, 255, 255, 0.26)',
                }}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Checkbox */}
                {!readOnly && (
                  <td className="px-3 py-2 text-center" style={{ borderRight: '1px solid #d1d5db' }}>
                    <input type="checkbox" checked={sel.has(row.id)} onChange={() => toggleRow(row.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer" />
                  </td>
                )}

                {/* Reason (editable) */}
                <td className="px-3 py-2 text-center" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {renderDropdown(row, F.reason, reasonOptions)}
                </td>

                {/* Instruction (editable) */}
                <td className="px-3 py-2 text-center" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {renderDropdown(row, F.instruction, instructionOptions)}
                </td>

                {/* Date */}
                <td className="px-3 py-2 text-center whitespace-nowrap" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {(() => {
                    const parts = dtFormatDateParts(row[F.date]);
                    return (
                      <div className="leading-tight">
                        <div style={{ fontSize: 13 }}>{parts.date}</div>
                        {parts.time && <div style={{ color: '#16a34a', fontSize: 13, marginTop: 4 }}>{parts.time}</div>}
                      </div>
                    );
                  })()}
                </td>

                {/* Creditor/Furnisher (Bureau) */}
                <td className="px-3 py-2 text-center whitespace-nowrap" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {row[F.Creditor] || '—'}
                </td>

                {/* Creditor Name */}
                <td className="px-3 py-2 text-center whitespace-nowrap" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {row[F.creditorName] || '—'}
                </td>

                {/* Account# */}
                <td className="px-3 py-2 text-center whitespace-nowrap font-mono" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontSize: 13 }}>
                  {maskAccount(row[F.accountNum])}
                </td>

                {/* Remarks — scrollable if > ~50 chars */}
                <td className="px-3 py-2 text-center align-top" style={{ borderRight: '1px solid #d1d5db', width: 260, minWidth: 240, maxWidth: 300 }}>
                  <div
                    style={{
                      color: '#059669',
                      fontWeight: 400,
                      maxHeight: dtStr(row[F.acctReason]).trim().replace(/\s+/g, ' ').length > 100 ? '5rem' : 'none',
                      overflowY: dtStr(row[F.acctReason]).trim().replace(/\s+/g, ' ').length > 100 ? 'auto' : 'visible',
                      overflowX: dtStr(row[F.acctReason]).trim().replace(/\s+/g, ' ').length > 100 ? 'hidden' : 'visible',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: '1.25em',
                      scrollbarWidth: dtStr(row[F.acctReason]).trim().replace(/\s+/g, ' ').length > 100 ? 'thin' : 'auto',
                    }}
                  >
                    {row[F.acctReason] || '—'}
                  </div>
                </td>

                {/* Late Payment */}
                <td className="px-3 py-2 text-center" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {row[F.latePayment] ?? '—'}
                </td>

                {/* Remain Late Payment */}
                <td className="px-3 py-2 text-center" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400 }}>
                  {row[F.remainLate] ?? '—'}
                </td>

                {/* Balance */}
                <td className="px-2 py-2 text-center whitespace-nowrap" style={{ borderRight: '1px solid #d1d5db', color: '#059669', fontWeight: 400, width: '13ch', minWidth: '13ch', maxWidth: '13ch', boxSizing: 'border-box', overflow: 'hidden' }}>
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
                <td className="px-3 py-2 text-center whitespace-nowrap" style={{ borderRight: '1px solid #d1d5db' }}>
                  {(() => {
                    const val = row[F.status] || '';
                    const lv = val.toLowerCase();
                    let color = '#059669';
                    if (/negative|fail|reject|bad|deni|declin|overdu|default|charg|derog|collec|delinq|closed|negati/i.test(lv)) color = '#dc2626';
                    else if (/warn|pend|review|process|progress|unknown|open/i.test(lv)) color = '#d97706';
                    else if (/positive|good|ok|approv|current|paid|clear|resolved|removed|success/i.test(lv)) color = '#059669';
                    return <span style={{ color, fontWeight: 400 }}>{val || '—'}</span>;
                  })()}
                </td>

                {/* Account Status */}
                <td className="cf-account-status-cell px-3 py-2 text-center" style={{ borderRight: '1px solid #d1d5db', fontSize: 13 }}>
                  <AcctStatusBadge value={row[F.acctStatus]} />
                </td>

                {/* Action */}
                {!readOnly && (
                  <td className="px-3 py-2 text-center relative">
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
                                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                              >
                                <IcMove />
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
                                  <span className="text-gray-500">Choose section</span>
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
    const query = contactCriteria ? contactCriteria + 'and' + statusCriteria : statusCriteria;

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
      const moved = accounts
        .filter(r => ids.includes(r.id))
        .map(r => ({ ...r, Delete_flag: 'true' }));
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
