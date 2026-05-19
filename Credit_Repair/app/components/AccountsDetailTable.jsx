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

const COLLECTION_SECTIONS = [
  { key: 'started', label: 'Started Collections', matchTagStarted: true },
  { key: 'new', label: 'New Collections' },
  { key: 'closed', label: 'Closed Collections' },
  { key: 'collection', label: 'Collections' },
];

const COLLECTION_MOVE_OPTIONS = [
  { key: 'new', label: 'New' },
  { key: 'closed', label: 'Closed' },
  { key: 'collection', label: 'Collection' },
];

/* Field API name map — single place to update */
const F = {
  blockType: 'Block_Type',
  tagValue: 'Tag_Value',
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
  inquiryName: 'Name',
  inquiryDate: 'Inquiry_Date',
  inquiryExpiryDate: 'Inquiry_Expiry_Date',
  providedBy: 'Provided_By',
  personalName: 'Name',
  personalFieldValue: 'Field_Value',
  personalUpdatedDate: 'Modified_Time',
  personalIsDeleted: 'Is_Deleted',
  personalClient: 'Client',
  collectionName: 'Name',
  collectionAgencyStatus: 'Agency_Status',
  collectionAgencyBalance: 'Agency_Balance',
  collectionRentalReason: 'Rental_Reason',
  collectionRentalInstruction: 'Rental_Instruction',
  collectionOriginalCreditor: 'Original_Creditor',
  collectionOpenedDate: 'Opened_Date',
  collectionClient: 'Client',
  collectionBlockType: 'Bock_Type',
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

function getRowValue(row, apiName) {
  if (!row || !apiName) return undefined;
  if (Object.prototype.hasOwnProperty.call(row, apiName)) return row[apiName];
  const wanted = String(apiName).toLowerCase();
  const key = Object.keys(row).find(k => String(k).toLowerCase() === wanted);
  return key ? row[key] : undefined;
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

function normalizeInquiryClientId(value) {
  if (!value) return '';
  if (Array.isArray(value)) return normalizeInquiryClientId(value[0]);
  if (typeof value === 'object') {
    return String(value.id || value.ID || value.record_id || value.RecordID || '').trim();
  }
  return String(value).trim();
}

function isInquiryRowDeleted(row) {
  return isDeletedFlag(row && row.Delete_flag) || isDisplayDeleted(row);
}

function isStartedInquiryRow(row) {
  return dtStr(row && getRowValue(row, F.tagValue)).trim().toLowerCase() === 'started';
}

function uniqueInquiryRows(rows) {
  const seen = new Set();
  return (rows || []).filter(row => {
    const key = String(row.id || row.ID || JSON.stringify(row));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isPicklistYes(val) {
  return dtStr(val).trim().toLowerCase() === 'yes';
}

function uniqueRowsByRecordId(rows) {
  const seen = new Set();
  return (rows || []).filter(row => {
    const key = String(row.id || row.ID || JSON.stringify(row));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizePersonalNameKey(value) {
  const normalized = dtStr(value).trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized || 'unknown';
}

function displayPersonalName(value) {
  const normalized = dtStr(value).trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Unknown';
  return normalized
    .split(' ')
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part)
    .join(' ');
}

function groupPersonalRowsByName(rows) {
  const groups = {};
  uniqueRowsByRecordId(rows).forEach(row => {
    const rawName = getRowValue(row, F.personalName);
    const key = normalizePersonalNameKey(rawName);
    if (!groups[key]) groups[key] = { name: displayPersonalName(rawName), rows: [] };
    groups[key].rows.push(row);
  });
  return Object.keys(groups)
    .sort((a, b) => groups[a].name.localeCompare(groups[b].name))
    .map(key => groups[key]);
}

function collectionRowSectionKey(row) {
  if (isStartedInquiryRow(row)) return 'started';
  const rawKey = getRowValue(row, F.collectionBlockType) || getRowValue(row, F.blockType) || row.block_type || row.Block_Type || row.BlockType;
  return dtStr(rawKey).trim().toLowerCase();
}

function groupCollectionRows(rows) {
  const grouped = Object.fromEntries(COLLECTION_SECTIONS.map(s => [s.key, []]));
  uniqueRowsByRecordId(rows).forEach(row => {
    const key = collectionRowSectionKey(row);
    if (grouped[key]) grouped[key].push(row);
  });
  return grouped;
}

async function searchInquiryRowsByField(contactId, field, value) {
  if (!contactId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) {
    return [];
  }

  const all = [];
  const perPage = 200;
  const clientFields = ['Client', F.clientId];

  for (const clientField of clientFields) {
    all.length = 0;
    const query = `(((${clientField}:equals:${contactId})and(${field}:equals:${value}))and(Delete_flag:equals:false))`;
    console.log('[CF] Inquiry search query:', { clientField, field, value, query });

    try {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Inquiries',
          Type: 'criteria',
          Query: query,
        }, page, perPage);

        const data = (resp && resp.data) || [];
        console.log('[CF] Inquiry search response:', { clientField, field, value, page, resp, data });
        all.push(...data);

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }

      if (all.length) {
        const filtered = all.filter(row => !isInquiryRowDeleted(row));
        console.log('[CF] Inquiry filtered rows:', { clientField, field, value, rows: filtered });
        return filtered;
      }
    } catch (error) {
      console.warn('[CF] Inquiry search failed:', query, error);
    }
  }

  const filtered = all.filter(row => !isInquiryRowDeleted(row));
  console.log('[CF] Inquiry filtered rows:', { field, value, rows: filtered });
  return filtered;
}

async function fetchInquiryTables(contactId) {
  const clientId = normalizeInquiryClientId(contactId);
  if (!clientId) {
    return { new: [], inquiry: [], started: [] };
  }

  const [newRows, inquiryRows, startedRows] = await Promise.all([
    searchInquiryRowsByField(clientId, F.blockType, 'new'),
    searchInquiryRowsByField(clientId, F.blockType, 'inquiry'),
    searchInquiryRowsByField(clientId, F.tagValue, 'started'),
  ]);

  const tables = {
    new: uniqueInquiryRows(newRows).filter(row => !isStartedInquiryRow(row)),
    inquiry: uniqueInquiryRows(inquiryRows).filter(row => !isStartedInquiryRow(row)),
    started: uniqueInquiryRows(startedRows),
  };

  console.log('[CF] Inquiry tables loaded:', tables);
  return tables;
}

async function fetchPersonalDataRows(contactId) {
  const clientId = normalizeInquiryClientId(contactId);
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];

  const perPage = 200;
  const all = [];
  const query = `((${F.personalClient}:equals:${clientId})and(Delete_flag:equals:false))`;

  if (ZOHO.CRM.API.searchRecord) {
    try {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Personal_Data',
          Type: 'criteria',
          Query: query,
        }, page, perPage);

        const data = (resp && resp.data) || [];
        console.log('[CF] Personal_Data search response:', { query, page, resp, data });
        data.forEach(row => {
          console.log('[CF] Personal_Data Modified_Time raw:', {
            id: row.id || row.ID,
            name: getRowValue(row, F.personalName),
            modifiedTime: getRowValue(row, F.personalUpdatedDate),
            row,
          });
        });
        all.push(...data);

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }
      return uniqueRowsByRecordId(all).filter(row => !isDeletedFlag(row.Delete_flag));
    } catch (error) {
      console.warn('[CF] Personal_Data search failed:', query, error);
    }
  }

  if (ZOHO.CRM.API.getAllRecords) {
    try {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.getAllRecords({
          Entity: 'Personal_Data',
          page,
          per_page: perPage,
        });
        const data = (resp && resp.data) || [];
        data.forEach(row => {
          console.log('[CF] Personal_Data Modified_Time raw:', {
            id: row.id || row.ID,
            name: getRowValue(row, F.personalName),
            modifiedTime: getRowValue(row, F.personalUpdatedDate),
            row,
          });
        });
        data.forEach(row => {
          const rowClient = getRowValue(row, F.personalClient) || row.Client_ID || row.Contact;
          if (String(lookupId(rowClient)) === String(clientId) && !isDeletedFlag(row.Delete_flag)) {
            all.push(row);
          }
        });

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }
    } catch (error) {
      console.warn('[CF] Personal_Data getAllRecords failed:', error);
    }
  }

  return uniqueRowsByRecordId(all);
}

async function fetchCollectionRows(contactId) {
  const clientId = normalizeInquiryClientId(contactId);
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];

  const perPage = 200;
  const all = [];
  const query = `((${F.collectionClient}:equals:${clientId})and(Delete_flag:equals:false))`;

  if (ZOHO.CRM.API.searchRecord) {
    try {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.searchRecord({
          Entity: 'Collection',
          Type: 'criteria',
          Query: query,
        }, page, perPage);

        const data = (resp && resp.data) || [];
        console.log('[CF] Collection search response:', { query, page, resp, data });
        all.push(...data);

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }
      return uniqueRowsByRecordId(all).filter(row => !isDeletedFlag(row.Delete_flag));
    } catch (error) {
      console.warn('[CF] Collection search failed:', query, error);
    }
  }

  if (ZOHO.CRM.API.getAllRecords) {
    try {
      for (let page = 1; page <= 10; page++) {
        const resp = await ZOHO.CRM.API.getAllRecords({
          Entity: 'Collection',
          page,
          per_page: perPage,
        });
        const data = (resp && resp.data) || [];
        data.forEach(row => {
          const rowClient = getRowValue(row, F.collectionClient) || row.Client_ID || row.Contact;
          if (String(lookupId(rowClient)) === String(clientId) && !isDeletedFlag(row.Delete_flag)) {
            all.push(row);
          }
        });

        const more = resp && resp.info && resp.info.more_records;
        if (!more || data.length < perPage) break;
      }
    } catch (error) {
      console.warn('[CF] Collection getAllRecords failed:', error);
    }
  }

  return uniqueRowsByRecordId(all);
}

function optionLabel(options, id) {
  const match = (options || []).find(opt => String(opt.id) === String(id));
  return match ? match.label : '';
}

function masterInfoTypeValue(row) {
  return dtStr(
    getRowValue(row, 'Type_of_information') ||
    getRowValue(row, 'Type_of_Information') ||
    getRowValue(row, 'type_of_information')
  ).trim();
}

async function fetchMasterOptions(typeName = 'Account') {
  if (!window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API) return [];
  const perPage = 200;
  const reasons = [];
  const instructions = [];
  const seenReasons = new Set();
  const seenInstructions = new Set();
  const infoType = String(typeName);
  const infoTypeLower = infoType.toLowerCase();
  const infoTypeCapitalized = infoTypeLower.charAt(0).toUpperCase() + infoTypeLower.slice(1);
  const typeCandidates = typeName === 'Collection' ? ['Collections'] : ['Account'];
  console.log(`[CF] Master_Reason_Instruction ${infoTypeCapitalized} type candidates:`, typeCandidates);

  function pushOption(list, seen, id, label) {
    if (!id) return;
    const key = String(id);
    if (seen.has(key)) return;
    seen.add(key);
    list.push({ id, label: label || '—' });
  }

  function rowMatchesInfoType(row) {
    const typeVal = masterInfoTypeValue(row).toLowerCase();
    return typeCandidates.map(v => String(v).toLowerCase()).includes(typeVal);
  }

  function classifyRow(row) {
    const nameVal = dtStr(getRowValue(row, 'Name')).trim().toLowerCase();
    const typeVal = dtStr(
      getRowValue(row, 'Type') ||
      getRowValue(row, 'Category') ||
      getRowValue(row, 'Field_Type')
    ).trim().toLowerCase();
    const collectionNameClassifier = /\breason\b|\binstruction\b/.test(nameVal) ? nameVal : '';
    const classifier = typeName === 'Collection' ? (collectionNameClassifier || typeVal) : typeVal;
    const reasonLabel = dtStr(
      getRowValue(row, 'Reason') ||
      getRowValue(row, 'Display_Name') ||
      getRowValue(row, 'Value') ||
      getRowValue(row, 'Name') ||
      row.display_value
    );
    const instructionLabel = dtStr(
      getRowValue(row, 'Instruction') ||
      getRowValue(row, 'Display_Name') ||
      getRowValue(row, 'Value') ||
      getRowValue(row, 'Name') ||
      row.display_value
    );

    if (classifier === 'reason' || classifier === 'reasons' || /\breason\b/.test(classifier)) {
      pushOption(reasons, seenReasons, row.id, reasonLabel);
      return;
    }

    if (classifier === 'instruction' || classifier === 'instructions' || /\binstruction\b/.test(classifier)) {
      pushOption(instructions, seenInstructions, row.id, instructionLabel);
      return;
    }

    if (getRowValue(row, 'Reason')) pushOption(reasons, seenReasons, row.id, reasonLabel);
    if (getRowValue(row, 'Instruction')) pushOption(instructions, seenInstructions, row.id, instructionLabel);
  }

  if (ZOHO.CRM.API.searchRecord) {
    try {
      for (const typeCandidate of typeCandidates) {
        const query = `(Type_of_information:equals:${typeCandidate})`;
        for (let page = 1; page <= 5; page++) {
          const resp = await ZOHO.CRM.API.searchRecord({
            Entity: 'Master_Reason_Instruction',
            Type: 'criteria',
            Query: query,
          }, page, perPage);

          const data = (resp && resp.data) || [];
          console.log(`[CF] Master_Reason_Instruction ${infoTypeCapitalized} search:`, { query, page, resp, data });
          data.forEach(row => {
            console.log(`[CF] Master_Reason_Instruction ${infoTypeCapitalized} row:`, row);
            classifyRow(row);
          });

          const more = resp && resp.info && resp.info.more_records;
          if (!more || data.length < perPage) break;
        }
        if (reasons.length || instructions.length) break;
      }
    } catch (e) {
      console.warn(`[CF] Master_Reason_Instruction ${infoTypeCapitalized} search failed. Falling back to getAllRecords.`, e);
    }
  }

  if (reasons.length === 0 && instructions.length === 0 && ZOHO.CRM.API.getAllRecords) {
    const seenInfoTypes = new Set();
    for (let page = 1; page <= 5; page++) {
      const resp = await ZOHO.CRM.API.getAllRecords({
        Entity: 'Master_Reason_Instruction',
        page,
        per_page: perPage,
      });
      const data = (resp && resp.data) || [];
      data.forEach(row => {
        const infoTypeValue = masterInfoTypeValue(row);
        if (infoTypeValue) seenInfoTypes.add(infoTypeValue);
        console.log(`[CF] Master_Reason_Instruction ${infoTypeCapitalized} row:`, row);
        if (rowMatchesInfoType(row)) classifyRow(row);
      });

      const more = resp && resp.info && resp.info.more_records;
      if (!more && data.length < perPage) break;
      if (data.length < perPage) break;
    }
    console.log('[CF] Master_Reason_Instruction distinct Type_of_information values:', Array.from(seenInfoTypes));
  }

  console.log(`[CF] Master_Reason_Instruction ${infoTypeCapitalized} options:`, {
    reasons,
    instructions,
  });
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
    if (!bulkMoveOpen || bulkMoveMenuStyle || !bulkMoveButtonRef.current) return;
    setBulkMoveMenuStyle(buildBulkMoveMenuStyle(bulkMoveButtonRef.current));
  }, [bulkMoveOpen, bulkMoveMenuStyle, sel.size]);

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
    const menuWidth = 180;
    const menuMaxHeight = 190;
    const pad = 8;
    let left = rect.left;
    if (left < pad) left = pad;
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
      zIndex: 2147483647,
    };
  }

  function buildBulkMoveMenuStyle(triggerEl) {
    return buildMoveMenuStyle(triggerEl);
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
            border-bottom: 1px solid #d1d5db;
          }

          .cf-account-section {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            --cf-head-h: 44px;
            --cf-row-h: 52px;
          }

          .cf-account-section thead th {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px;
            font-weight: 700 !important;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-bottom: 1px solid #e6edf5 !important;
            border-top: none !important;
            position: sticky;
            top: 0;
            z-index: 5;
          }

          .cf-account-section thead {
            border-top: none !important;
          }

          .cf-account-section th,
          .cf-account-section td {
            border-right: 1px solid #d1d5db;
            border-color: #d1d5db !important;
            text-align: center;
          }

          .cf-account-section th:last-child,
          .cf-account-section td:last-child {
            border-right: none;
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
          background: '#ffffff',
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
            background: '#ffffff',
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
                <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 600, width: '14ch', minWidth: '14ch', maxWidth: '14ch', boxSizing: 'border-box', overflow: 'hidden', paddingRight: '2rem' }}>
                  {(() => {
                    const balanceText = dtFmtBalance(row[F.balance]);
                    const balanceDigits = String(row[F.balance] ?? '').replace(/[^\d]/g, '').slice(0, 10);
                    const visibleBalance = balanceDigits ? '$' + balanceDigits : balanceText;
                    return (
                      <div
                        title={balanceText}
                        style={{
                          display: 'inline-block',
                          maxWidth: '12ch',
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

function InquiryTableSection({ title, rows, loading }) {
  const headers = ['Inquiry Name', 'Inquiry Date', 'Inquiry Expiry Date', 'Provided By'];

  return (
    <div
      className="cf-glass cf-account-section rounded-xl border overflow-hidden relative bg-white"
      style={{
        borderColor: 'rgba(226, 232, 240, 0.9)',
        boxShadow: '0 12px 34px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between rounded-t-xl"
        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 tracking-normal">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500 shadow-sm" />
          {title}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {loading ? 'Loading...' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="rounded-b-xl overflow-hidden bg-white">
        <div
          className="cf-glass-scroll overview-started-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            background: '#ffffff',
            maxHeight: 'calc(44px + (52px * 5))',
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
              minWidth: 760,
              color: '#0f172a',
            }}
          >
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-5 text-center text-xs text-gray-400 italic">
                    No records
                  </td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={row.id || row.ID || `${title}-${index}`}>
                  <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 500 }}>
                    {dtStr(row[F.inquiryName]) || '-'}
                  </td>
                  <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 400 }}>
                    {dtFormatDateParts(row[F.inquiryDate]).date}
                  </td>
                  <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 400 }}>
                    {dtFormatDateParts(row[F.inquiryExpiryDate]).date}
                  </td>
                  <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 500 }}>
                    {dtStr(row[F.providedBy]) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Main exported component ─── */
function PersonalDataTableSection({ title, fieldName, rows, loading, onDelete, readOnly = false }) {
  const [busyId, setBusyId] = useDtState(null);
  const headers = ['Reason', 'Instruction', fieldName, 'Creditor', 'Updated Date'].concat(readOnly ? [] : ['Action']);
  const columnStyles = (readOnly ? [
    { width: '20%' },
    { width: '20%' },
    { width: '30%' },
    { width: '16%' },
    { width: '14%' },
  ] : [
    { width: '18%' },
    { width: '18%' },
    { width: '26%' },
    { width: '16%' },
    { width: '14%' },
    { width: '8%' },
  ]);

  async function handleDelete(row) {
    const id = row && (row.id || row.ID);
    if (!id) return;
    setBusyId(id);
    await onDelete(id);
    setBusyId(null);
  }

  return (
    <div
      className="cf-glass cf-account-section rounded-xl border overflow-hidden relative bg-white"
      style={{
        borderColor: 'rgba(226, 232, 240, 0.9)',
        boxShadow: '0 12px 34px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between rounded-t-xl"
        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 tracking-normal">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500 shadow-sm" />
          {title}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {loading ? 'Loading...' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="rounded-b-xl overflow-hidden bg-white">
        <div
          style={{
            overflow: 'visible',
            background: '#ffffff',
            borderBottomLeftRadius: '0.75rem',
            borderBottomRightRadius: '0.75rem',
          }}
        >
          <table
            className="w-full"
            style={{
              fontSize: 13,
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
              background: 'rgba(255, 255, 255, 0.72)',
              width: '100%',
              color: '#0f172a',
            }}
          >
            <colgroup>
              {columnStyles.map((style, index) => (
                <col key={index} style={style} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {headers.map(header => (
                  <th
                    key={header}
                    className="px-3 py-3 text-left"
                    style={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={header}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-5 text-center text-xs text-gray-400 italic">
                    No records
                  </td>
                </tr>
              )}
              {rows.map((row, index) => {
                const rowId = row.id || row.ID || `${title}-${index}`;
                return (
                  <tr key={rowId}>
                    <td className="px-3 py-3 text-left" style={{ color: '#111827', fontWeight: 500, maxWidth: 0, overflowWrap: 'anywhere' }}>
                      {dtStr(getRowValue(row, F.reason)) || '-'}
                    </td>
                    <td className="px-3 py-3 text-left" style={{ color: '#111827', fontWeight: 500, maxWidth: 0, overflowWrap: 'anywhere' }}>
                      {dtStr(getRowValue(row, F.instruction)) || '-'}
                    </td>
                    <td className="px-3 py-3 text-left" style={{ color: '#111827', fontWeight: 500, maxWidth: 0, overflowWrap: 'anywhere' }}>
                      {dtStr(getRowValue(row, F.personalFieldValue)) || '-'}
                    </td>
                    <td className="px-3 py-3 text-left">
                      {(() => {
                        const creditor = getRowValue(row, F.Creditor) || '-';
                        const badge = creditorBadgeStyle(creditor);
                        return (
                          <span
                            className="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm"
                            title={dtStr(creditor)}
                            style={{
                              color: badge.color,
                              background: badge.background,
                              borderColor: badge.borderColor,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {creditor}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-left" style={{ color: '#111827', fontWeight: 400, maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dtFormatDateParts(getRowValue(row, F.personalUpdatedDate)).date}
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          disabled={busyId === rowId}
                          onClick={() => handleDelete(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                          <IcTrash />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CollectionTableSection({
  section,
  rows,
  loading,
  onDelete,
  onMove,
  onSaveRow,
  reasonOptions,
  instructionOptions,
  dropdownOpen,
  setDropdownOpen,
}) {
  const open = dropdownOpen || { sectionKey: null, id: null, field: null, style: null };
  const [sel, setSel] = useDtState(new Set());
  const [busy, setBusy] = useDtState(false);
  const [moveRowId, setMoveRowId] = useDtState(null);
  const [moveMenuOpen, setMoveMenuOpen] = useDtState(false);
  const [moveMenuStyle, setMoveMenuStyle] = useDtState(null);
  const moveMenuRef = React.useRef(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useDtState(false);
  const bulkMoveRef = React.useRef(null);
  const bulkMoveButtonRef = React.useRef(null);
  const [bulkMoveMenuStyle, setBulkMoveMenuStyle] = useDtState(null);
  const moveOptions = COLLECTION_MOVE_OPTIONS.filter(opt => opt.key !== section.key);
  const headers = [
    'Reason', 'Instruction', 'Rental Reason', 'Rental Instruction','Collection Agency', 'Balance',
    'Status', 'Creditor', 'Original Creditor',
    'Opened Date', 'Action',
  ];
  const allChecked = rows.length > 0 && rows.every(r => sel.has(r.id || r.ID));

  useDtEffect(() => {
    setSel(new Set());
    setMoveRowId(null);
    setMoveMenuOpen(false);
    setMoveMenuStyle(null);
    setBulkMoveOpen(false);
    setBulkMoveMenuStyle(null);
  }, [rows]);

  function toggleAll() {
    const next = allChecked ? new Set() : new Set(rows.map(r => r.id || r.ID).filter(Boolean));
    setSel(next);
    setBulkMoveOpen(false);
    setBulkMoveMenuStyle(null);
  }

  function toggleRow(id) {
    if (!id) return;
    setSel(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      setBulkMoveOpen(false);
      setBulkMoveMenuStyle(null);
      return next;
    });
  }

  useDtEffect(() => {
    if (!open.id || open.sectionKey !== section.key) return;
    function handle(e) {
      const target = e.target && e.target.closest ? e.target : e.target && e.target.parentElement;
      if (!target || !target.closest('[data-dropdown]')) {
        setDropdownOpen({ sectionKey: null, id: null, field: null, style: null });
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
      if (e.key === 'Escape') setBulkMoveOpen(false);
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

  function rowKey(row) {
    return row.id || row.ID || [
      section.key,
      getRowValue(row, F.collectionName),
      getRowValue(row, F.Creditor),
      getRowValue(row, F.collectionOriginalCreditor),
    ].map(dtStr).join('|');
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
    const menuWidth = 215;
    const menuMaxHeight = 245;
    const pad = 8;
    let left = rect.left;
    if (left < pad) left = pad;
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
      zIndex: 2147483647,
    };
  }

  function toggleDropdown(e, key, field) {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(prev => (prev.sectionKey === section.key && prev.id === key && prev.field === field)
      ? { sectionKey: null, id: null, field: null, style: null }
      : { sectionKey: section.key, id: key, field, style: buildMenuStyle(e.currentTarget) }
    );
  }

  async function selectOption(row, field, optionId) {
    const id = row.id || row.ID;
    const currentId = lookupId(getRowValue(row, field));
    setDropdownOpen({ sectionKey: null, id: null, field: null, style: null });
    if (!id || !optionId || String(optionId) === String(currentId)) return;
    setBusy(true);
    await onSaveRow(id, field, optionId);
    setBusy(false);
  }

  function renderDropdown(row, field, options) {
    const selectedId = lookupId(getRowValue(row, field));
    const selectedLabel = optionLabel(options, selectedId) || dtStr(getRowValue(row, field)) || 'Select';
    const key = rowKey(row);
    const isOpen = open.sectionKey === section.key && open.id === key && open.field === field;

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
          onClick={(e) => toggleDropdown(e, key, field)}
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

  function openMoveForRow(id, triggerEl) {
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

  async function handleMoveRow(id, targetKey) {
    setBusy(true);
    await onMove(id, targetKey);
    setMoveMenuOpen(false);
    setMoveRowId(null);
    setMoveMenuStyle(null);
    setBusy(false);
  }

  async function handleBulkMove(targetKey) {
    const ids = Array.from(sel);
    if (!ids.length) return;
    setBusy(true);
    await Promise.all(ids.map(id => onMove(id, targetKey)));
    setSel(new Set());
    setBulkMoveOpen(false);
    setBulkMoveMenuStyle(null);
    setBusy(false);
  }

  async function handleDeleteRow(id) {
    setBusy(true);
    await onDelete(id);
    setBusy(false);
  }

  async function handleBulkDelete() {
    const ids = Array.from(sel);
    if (!ids.length) return;
    setBusy(true);
    await Promise.all(ids.map(id => onDelete(id)));
    setSel(new Set());
    setBusy(false);
  }

  return (
    <div
      className="cf-glass cf-account-section rounded-xl border overflow-visible relative bg-white"
      style={{
        zIndex: sel.size > 0 || moveMenuOpen ? 2147483640 : 1,
        borderColor: 'rgba(226, 232, 240, 0.9)',
        boxShadow: '0 12px 34px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between rounded-t-xl"
        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 tracking-normal">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500 shadow-sm" />
          {section.label}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {loading ? 'Loading...' : `${rows.length} record${rows.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {sel.size > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-5 relative" style={{ zIndex: 2147483645, overflow: 'visible' }}>
          {!bulkMoveOpen ? (
            <button
              ref={bulkMoveButtonRef}
              disabled={busy}
              onClick={() => setBulkMoveOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40"
            >
              <IcArrow /> Move
            </button>
          ) : (
            <div ref={bulkMoveRef} className="relative" style={{ zIndex: 2147483646 }}>
              <button
                ref={bulkMoveButtonRef}
                type="button"
                disabled={busy}
                onClick={() => setBulkMoveOpen(prev => !prev)}
                className="w-72 border border-slate-200 rounded-lg px-3 py-2 text-xs text-left bg-white hover:bg-slate-50 flex items-center justify-between shadow-sm"
              >
                <span className="text-slate-600">Choose Type</span>
                <span className="ml-2 text-gray-400 rotate-180">▾</span>
              </button>
              <div
                className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xl"
                style={{ zIndex: 2147483647 }}
              >
                <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                  {COLLECTION_MOVE_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleBulkMove(opt.key)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors rounded-md"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <button
            disabled={busy}
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            <IcTrash /> Delete
          </button>
          <span className="ml-auto text-xs text-gray-500">{sel.size} selected</span>
        </div>
      )}

      <div className="rounded-b-xl overflow-hidden bg-white">
        <div
          className="cf-glass-scroll overview-started-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            background: '#ffffff',
            maxHeight: 'calc(44px + (52px * 5))',
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
              minWidth: 1700,
              color: '#0f172a',
            }}
          >
            <thead>
              <tr>
                <th className="px-4 py-3 w-8 text-left">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length + 1} className="px-4 py-5 text-center text-xs text-gray-400 italic">
                    No records
                  </td>
                </tr>
              )}
              {rows.map((row, index) => {
                const id = row.id || row.ID;
                const key = id || `${section.key}-${index}`;
                const isRowMoveOpen = moveRowId === id && moveMenuOpen;
                return (
                  <tr
                    key={key}
                    style={{
                      background: id && sel.has(id)
                        ? 'rgba(224,242,254,0.78)'
                        : 'transparent',
                    }}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!id && sel.has(id)}
                        onChange={() => toggleRow(id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-left">{renderDropdown(row, F.reason, reasonOptions)}</td>
                    <td className="px-4 py-3 text-left">{renderDropdown(row, F.instruction, instructionOptions)}</td>
                     <td className="px-4 py-3 text-left" style={{ minWidth: 180 }}>
                      {dtStr(getRowValue(row, F.collectionRentalReason)) || '-'}
                    </td>
                    <td className="px-4 py-3 text-left" style={{ minWidth: 220 }}>
                      {dtStr(getRowValue(row, F.collectionRentalInstruction)) || '-'}
                    </td>
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      {dtStr(getRowValue(row, F.collectionAgencyStatus)) || '-'}
                    </td>
                    <td className="px-4 py-3 text-left whitespace-nowrap" style={{ fontWeight: 600 }}>
                      {dtFmtBalance(getRowValue(row, F.collectionAgencyBalance))}
                    </td>
                    <td className="px-4 py-3 text-left whitespace-nowrap" style={{ color: '#111827', fontWeight: 500 }}>
                      {dtStr(getRowValue(row, F.collectionName)) || '-'}
                    </td>
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      {(() => {
                        const creditor = getRowValue(row, F.Creditor) || '-';
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
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      {dtStr(getRowValue(row, F.collectionOriginalCreditor)) || '-'}
                    </td>
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      {dtFormatDateParts(getRowValue(row, F.collectionOpenedDate)).date}
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      {sel.size === 0 && (
                        isRowMoveOpen ? (
                          <div ref={moveMenuRef} className="relative inline-block w-44 text-left" style={{ zIndex: 20000 }}>
                            <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  setMoveMenuOpen(false);
                                  setMoveRowId(null);
                                  setMoveMenuStyle(null);
                                }}
                                className="w-full border-b border-slate-200 px-3 py-2 text-xs text-left bg-white hover:bg-slate-50 flex items-center justify-between"
                              >
                                <span className="text-slate-600">Choose Type</span>
                                <span className="ml-2 text-gray-400 rotate-180">▾</span>
                              </button>
                              <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                                {moveOptions.length === 0 ? (
                                  <div className="px-3 py-2 text-xs text-gray-400">No options</div>
                                ) : (
                                  moveOptions.map(opt => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => handleMoveRow(id, opt.key)}
                                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-md"
                                    >
                                      {opt.label}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2" style={{ zIndex: 20000 }}>
                            <button
                              type="button"
                              disabled={busy || !id}
                              onClick={(e) => openMoveForRow(id, e.currentTarget)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                            >
                              <IcMove />
                            </button>
                            <button
                              type="button"
                              disabled={busy || !id}
                              onClick={() => handleDeleteRow(id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                            >
                              <IcTrash />
                            </button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountsDetailTable({ contactId, accounts: propAccounts, entityName }) {
  const [accounts, setAccounts] = useDtState(propAccounts || []);
  const [deletedAccounts, setDeletedAccounts] = useDtState([]);
  const [inquiryTables, setInquiryTables] = useDtState({ new: [], inquiry: [], started: [] });
  const [inquiriesLoading, setInquiriesLoading] = useDtState(false);
  const [personalDataRows, setPersonalDataRows] = useDtState([]);
  const [personalDataLoading, setPersonalDataLoading] = useDtState(false);
  const [collectionRows, setCollectionRows] = useDtState([]);
  const [collectionLoading, setCollectionLoading] = useDtState(false);
  const [reasonOptions, setReasonOptions] = useDtState([]);
  const [instructionOptions, setInstructionOptions] = useDtState([]);
  const [collectionReasonOptions, setCollectionReasonOptions] = useDtState([]);
  const [collectionInstructionOptions, setCollectionInstructionOptions] = useDtState([]);
  const [dropdownOpen, setDropdownOpen] = useDtState({ sectionKey: null, id: null, field: null, style: null });
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useDtState({ sectionKey: null, id: null, field: null, style: null });

  useDtEffect(() => {
    const active = (propAccounts || []).filter(r => !isDisplayDeleted(r));
    const deleted = (propAccounts || []).filter(isDisplayDeleted);
    setAccounts(active);
    setDeletedAccounts(deleted);
    console.log('[CF] Client_Account propAccounts:', propAccounts);
  }, [propAccounts]);

  useDtEffect(() => {
    let alive = true;
    const clientId = normalizeInquiryClientId(contactId);

    if (!clientId) {
      setInquiryTables({ new: [], inquiry: [], started: [] });
      setInquiriesLoading(false);
      setPersonalDataRows([]);
      setPersonalDataLoading(false);
      setCollectionRows([]);
      setCollectionLoading(false);
      return () => { alive = false; };
    }

    setInquiriesLoading(true);
    setPersonalDataLoading(true);
    setCollectionLoading(true);

    fetchInquiryTables(clientId)
      .then((tables) => {
        if (!alive) return;
        setInquiryTables(tables);
      })
      .catch((error) => {
        if (!alive) return;
        console.warn('[CF] Inquiry tables load failed:', error);
        setInquiryTables({ new: [], inquiry: [], started: [] });
      })
      .finally(() => {
        if (alive) setInquiriesLoading(false);
      });

    fetchPersonalDataRows(clientId)
      .then((rows) => {
        if (!alive) return;
        setPersonalDataRows(rows);
      })
      .catch((error) => {
        if (!alive) return;
        console.warn('[CF] Personal_Data load failed:', error);
        setPersonalDataRows([]);
      })
      .finally(() => {
        if (alive) setPersonalDataLoading(false);
      });

    fetchCollectionRows(clientId)
      .then((rows) => {
        if (!alive) return;
        setCollectionRows(rows);
      })
      .catch((error) => {
        if (!alive) return;
        console.warn('[CF] Collection load failed:', error);
        setCollectionRows([]);
      })
      .finally(() => {
        if (alive) setCollectionLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [contactId]);

  useDtEffect(() => {
    let alive = true;
    async function loadOptions() {
      const [
        { reasons, instructions },
        { reasons: collectionReasons, instructions: collectionInstructions },
      ] = await Promise.all([
        fetchMasterOptions('Account'),
        fetchMasterOptions('Collection'),
      ]);
      if (!alive) return;
      setReasonOptions(reasons);
      setInstructionOptions(instructions);
      setCollectionReasonOptions(collectionReasons);
      setCollectionInstructionOptions(collectionInstructions);
      console.log('[CF] Reason options:', reasons);
      console.log('[CF] Reason option labels:', reasons.map(r => r.label));
      console.log('[CF] Instruction options:', instructions);
      console.log('[CF] Instruction option labels:', instructions.map(r => r.label));
      console.log('[CF] Collection reason options:', collectionReasons);
      console.log('[CF] Collection instruction options:', collectionInstructions);
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
      setDeletedAccounts(prev => prev.filter(r => !ids.includes(r.id)));
    } catch (e) { console.warn('delete error', e); }
  }

  async function handlePersonalDataDelete(id) {
    if (!id) return;
    try {
      await ZOHO.CRM.API.updateRecord({
        Entity: 'Personal_Data',
        RecordID: id,
        APIData: { id, Delete_flag: 'true' },
      });
      setPersonalDataRows(prev => prev.filter(row => String(row.id || row.ID) !== String(id)));
    } catch (e) {
      console.warn('personal data delete error', e);
    }
  }

  async function refreshCollections() {
    const clientId = normalizeInquiryClientId(contactId);
    if (!clientId) {
      setCollectionRows([]);
      return;
    }
    setCollectionLoading(true);
    try {
      const rows = await fetchCollectionRows(clientId);
      setCollectionRows(rows);
    } catch (e) {
      console.warn('collection refresh error', e);
      setCollectionRows([]);
    } finally {
      setCollectionLoading(false);
    }
  }

  async function handleCollectionDelete(id) {
    if (!id) return;
    try {
      await ZOHO.CRM.API.updateRecord({
        Entity: 'Collection',
        RecordID: id,
        APIData: { id, Delete_flag: 'true' },
      });
      await refreshCollections();
    } catch (e) {
      console.warn('collection delete error', e);
    }
  }

  async function handleCollectionMove(id, targetType) {
    if (!id || !targetType) return;
    try {
      await ZOHO.CRM.API.updateRecord({
        Entity: 'Collection',
        RecordID: id,
        APIData: { id, [F.collectionBlockType]: targetType, [F.tagValue]: '' },
      });
      await refreshCollections();
    } catch (e) {
      console.warn('collection move error', e);
    }
  }

  async function handleCollectionSaveRow(id, field, optionId) {
    try {
      const apiData = { id, [field]: { id: optionId } };
      await ZOHO.CRM.API.updateRecord({
        Entity: 'Collection',
        RecordID: id,
        APIData: apiData,
      });
      await refreshCollections();
    } catch (e) {
      console.warn('collection save error', e);
    }
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

  const activePersonalDataGroups = groupPersonalRowsByName(
    personalDataRows.filter(row => !isPicklistYes(getRowValue(row, F.personalIsDeleted)))
  );
  const deletedPersonalDataGroups = groupPersonalRowsByName(
    personalDataRows.filter(row => isPicklistYes(getRowValue(row, F.personalIsDeleted)))
  );
  const groupedCollections = groupCollectionRows(collectionRows);
  const visibleCollectionSections = COLLECTION_SECTIONS.filter(section => (groupedCollections[section.key] || []).length > 0);

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
      <InquiryTableSection
        title="New Inquiries"
        rows={inquiryTables.new}
        loading={inquiriesLoading}
      />
      <InquiryTableSection
        title="Inquiries"
        rows={inquiryTables.inquiry}
        loading={inquiriesLoading}
      />
      <InquiryTableSection
        title="Started Inquiries"
        rows={inquiryTables.started}
        loading={inquiriesLoading}
      />
      {activePersonalDataGroups.map(group => (
        <PersonalDataTableSection
          key={`personal-${group.name}`}
          title={`Personal Data(${group.name})`}
          fieldName={group.name}
          rows={group.rows}
          loading={personalDataLoading}
          onDelete={handlePersonalDataDelete}
        />
      ))}
      {deletedPersonalDataGroups.map(group => (
        <PersonalDataTableSection
          key={`deleted-personal-${group.name}`}
          title={`Deleted Personal Data(${group.name})`}
          fieldName={group.name}
          rows={group.rows}
          loading={personalDataLoading}
          onDelete={handlePersonalDataDelete}
          readOnly={true}
        />
      ))}
      {visibleCollectionSections.map(section => (
        <CollectionTableSection
          key={section.key}
          section={section}
          rows={groupedCollections[section.key]}
          loading={collectionLoading}
          onDelete={handleCollectionDelete}
          onMove={handleCollectionMove}
          onSaveRow={handleCollectionSaveRow}
          reasonOptions={collectionReasonOptions}
          instructionOptions={collectionInstructionOptions}
          dropdownOpen={collectionDropdownOpen}
          setDropdownOpen={setCollectionDropdownOpen}
        />
      ))}
    </div>
  );
}

window.AccountsDetailTable = AccountsDetailTable;
