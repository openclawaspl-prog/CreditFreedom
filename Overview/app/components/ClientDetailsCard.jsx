const { useState, useEffect, useRef } = React;

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

const EditIcon  = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
const EmailIcon = (p) => <Svg {...p}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></Svg>;
const SmsIcon   = (p) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
const CheckIcon = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>;
const XIcon     = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;

/* ═══════════════════════════════════════════
   CACHE — stale-while-revalidate via localStorage

   Flow:
     1. Cache hit  → render instantly, no skeleton
     2. Background fetch from Zoho API (always)
     3. Delta via Modified_Time
        → same    : skip re-render (no flicker)
        → changed : update UI + write cache
     4. After save → write fresh record into cache

   Storage: localStorage, ~300 bytes/record (pruned fields only)
   TTL: 30 min — expired entries are removed on next read
═══════════════════════════════════════════ */

const CACHE_NS  = 'cf_crm_';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function pickFields(r) {
  return {
    id:            r.id,
    Date_of_Birth: r.Date_of_Birth || null,
    Office_Phone:  r.Office_Phone  || null,
    Email:         r.Email         || null,
    Assigned_To:   r.Assigned_To   || null,
    Created_Time:  r.Created_Time  || null,
    Modified_Time: r.Modified_Time || null,
  };
}

function cacheRead(recordId) {
  try {
    const raw = localStorage.getItem(CACHE_NS + recordId);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_NS + recordId);
      return null;
    }
    return entry.record;
  } catch {
    return null;
  }
}

function cacheWrite(recordId, record) {
  try {
    localStorage.setItem(CACHE_NS + recordId, JSON.stringify({
      record: pickFields(record),
      ts: Date.now(),
    }));
  } catch {
    /* localStorage quota exceeded — skip silently */
  }
}

/* Modified_Time is Zoho's authoritative change signal */
function hasChanged(cached, fresh) {
  if (!cached || !fresh) return true;
  return cached.Modified_Time !== fresh.Modified_Time;
}

/* ─────────────────────────────────────────
   Formatters
───────────────────────────────────────── */
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

function fmtDateTime(str) {
  if (!str) return '—';
  const d   = new Date(str);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const t   = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} at ${t}`;
}

function mapRecord(r) {
  const assigned = r.Assigned_To;
  return {
    dateOfBirth:  fmtDate(r.Date_of_Birth),
    assignedTo:   assigned ? (typeof assigned === 'object' ? assigned.name : assigned) : '—',
    officePhone:  r.Office_Phone || '—',
    primaryEmail: r.Email        || '—',
    created:      fmtDateTime(r.Created_Time),
    updated:      fmtDateTime(r.Modified_Time),
  };
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
function Bone({ w = 'w-full', h = 'h-4' }) {
  return <div className={`${w} ${h} rounded bg-gray-200 animate-pulse`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <Bone w="w-28" h="h-5" />
      <div className="mt-2 divide-y divide-gray-100">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex justify-between items-center py-3">
            <Bone w="w-24" /><Bone w="w-36" />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-4 border-t border-gray-200 flex gap-2">
        {[0, 1, 2].map(i => <div key={i} className="flex-1 h-10 rounded-lg bg-gray-200 animate-pulse" />)}
      </div>
    </div>
  );
}

function DisplayRow({ label, value, bold = false }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <span className="text-sm text-gray-500 shrink-0 w-28">{label}</span>
      <span className={`text-sm text-right break-words max-w-xs ${bold ? 'font-semibold text-gray-900' : 'font-normal text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function EditRow({ label, field, value, type = 'text', autoFocus = false, onChange }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="text-sm text-gray-500 shrink-0 w-28">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(field, e.target.value)}
        className="flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
function ClientDetailsCard() {
  const [client,     setClient]     = useState(null);
  const [rawRecord,  setRawRecord]  = useState(null);
  const [loading,    setLoading]    = useState(true);    // skeleton only when no cache
  const [refreshing, setRefreshing] = useState(false);   // background revalidation spinner
  const [error,      setError]      = useState(null);

  const [isEditing,  setIsEditing]  = useState(false);
  const [editVals,   setEditVals]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(null);

  const editValsRef = useRef({});
  useEffect(() => { editValsRef.current = editVals; }, [editVals]);

  /* ── Fetch with cache ── */
  useEffect(() => {
    ZOHO.embeddedApp.on('PageLoad', (data) => {
      const recordId = data.EntityId;

      /* ① Instant render from cache */
      const cached = cacheRead(recordId);
      if (cached) {
        setRawRecord(cached);
        setClient(mapRecord(cached));
        setLoading(false);
        setRefreshing(true);
      }

      /* ② Background fetch */
      ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: recordId })
        .then(res => {
          if (res.data?.[0]) {
            const fresh = res.data[0];
            /* ③ Delta check */
            if (hasChanged(cached, fresh)) {
              setRawRecord(fresh);
              setClient(mapRecord(fresh));
            }
            /* ④ Refresh cache (also resets TTL) */
            cacheWrite(recordId, fresh);
          } else if (!cached) {
            setError('Record not found.');
          }
        })
        .catch(() => {
          if (!cached) setError('Failed to load client data.');
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    });

    ZOHO.embeddedApp.init();
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e) => {
      if (e.key === 'Escape') doCancel();
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        doSave(editValsRef.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isEditing]);

  /* ── Edit actions ── */
  function startEdit() {
    setEditVals({
      Date_of_Birth: rawRecord.Date_of_Birth || '',
      Office_Phone:  rawRecord.Office_Phone  || '',
      Email:         rawRecord.Email         || '',
    });
    setSaveError(null);
    setIsEditing(true);
  }

  function doCancel() {
    setIsEditing(false);
    setEditVals({});
    setSaveError(null);
  }

  function handleFieldChange(field, value) {
    setEditVals(prev => ({ ...prev, [field]: value }));
  }

  function doSave(vals) {
    setSaving(true);
    setSaveError(null);

    ZOHO.CRM.API.updateRecord({
      Entity: 'Contacts',
      APIData: {
        id:            rawRecord.id,
        Date_of_Birth: vals.Date_of_Birth || null,
        Office_Phone:  vals.Office_Phone  || null,
        Email:         vals.Email         || null,
      },
      Trigger: ['workflow'],
    })
      .then(() => ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: rawRecord.id }))
      .then(res => {
        if (res.data?.[0]) {
          const fresh = res.data[0];
          setRawRecord(fresh);
          setClient(mapRecord(fresh));
          /* ⑤ Write saved record into cache */
          cacheWrite(rawRecord.id, fresh);
        }
        setIsEditing(false);
        setEditVals({});
      })
      .catch(() => setSaveError('Save failed. Please try again.'))
      .finally(() => setSaving(false));
  }

  /* ── Render ── */
  if (loading) return <CardSkeleton />;

  if (error) return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-10 text-center">
      <p className="text-sm text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-gray-900">Client Details</h2>
        <div className="flex items-center gap-2">
          {refreshing && !isEditing && (
            <div title="Refreshing…"
              className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
          )}
          {isEditing && (
            <span className="text-xs text-gray-400">Enter · Esc</span>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="mt-2 divide-y divide-gray-100">
        {isEditing ? (
          <>
            <EditRow label="Date of Birth" field="Date_of_Birth" value={editVals.Date_of_Birth} type="date"  autoFocus onChange={handleFieldChange} />
            <DisplayRow label="Assigned To"   value={client.assignedTo}  bold />
            <EditRow label="Office Phone"  field="Office_Phone"  value={editVals.Office_Phone}  type="tel"   onChange={handleFieldChange} />
            <EditRow label="Primary Email" field="Email"         value={editVals.Email}          type="email" onChange={handleFieldChange} />
            <DisplayRow label="Created" value={client.created} bold />
            <DisplayRow label="Updated" value={client.updated} bold />
          </>
        ) : (
          <>
            <DisplayRow label="Date of Birth"  value={client.dateOfBirth}   />
            <DisplayRow label="Assigned To"    value={client.assignedTo}    bold />
            <DisplayRow label="Office Phone"   value={client.officePhone}   />
            <DisplayRow label="Primary Email"  value={client.primaryEmail}  />
            <DisplayRow label="Created"        value={client.created}       bold />
            <DisplayRow label="Updated"        value={client.updated}       bold />
          </>
        )}
      </div>

      {saveError && <p className="mt-2 text-xs text-red-500 text-center">{saveError}</p>}

      <div className="mt-auto">
        <div className="border-t border-gray-200 mt-3 mb-3" />

        {/* Actions */}
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={() => doSave(editVals)} disabled={saving}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <CheckIcon size={14} />{saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={doCancel} disabled={saving}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <XIcon size={14} />Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={startEdit}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-medium transition-colors">
              <EditIcon size={14} />Edit
            </button>
            <button onClick={() => { /* TODO: Zoho email compose */ }}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-medium transition-colors">
              <EmailIcon size={14} />Send Email
            </button>
            <button onClick={() => { /* TODO: Zoho SMS action */ }}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-medium transition-colors">
              <SmsIcon size={14} />Send SMS
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

window.ClientDetailsCard = ClientDetailsCard;
