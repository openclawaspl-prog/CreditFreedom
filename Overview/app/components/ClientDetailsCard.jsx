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
const CheckIcon = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>;

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
    Salutation: r.Salutation,
    First_Name:    r.First_Name || null,
    Last_Name:     r.Last_Name || null,
    Social_Security_Number: r.Social_Security_Number || null,
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
  const fullName = r.Salutation +" "+ [r.First_Name, r.Last_Name].filter(Boolean).join(' ').trim();
  console.log(r);
  
  return {
    fullName:     fullName || '—',
    socialSecurityNumber: r.Social_Security_Number || '—',
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 h-[480px]">
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
    <div className="flex items-center gap-4 py-1.5">
      <span className="text-sm text-gray-500 shrink-0 w-28">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(field, e.target.value)}
        className="min-w-0 flex-1 text-sm text-gray-900 bg-white/80 border border-white/70 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"
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
    return window.OverviewWidget.onPageLoad((data) => {
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
          console.log(res.data);
          
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
          window.OverviewWidget.requestResize();
        });
    });
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
    if (!rawRecord) return;

    setEditVals({
      First_Name:    rawRecord.First_Name || '',
      Last_Name:     rawRecord.Last_Name || '',
      Social_Security_Number: rawRecord.Social_Security_Number || '',
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
        First_Name:    vals.First_Name || null,
        Last_Name:     vals.Last_Name || null,
        Social_Security_Number: vals.Social_Security_Number || null,
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-10 text-center h-[480px] flex items-center justify-center">
      <p className="text-sm text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col h-[480px]">

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
          {isEditing ? (
            <button type="button" onClick={() => doSave(editVals)} disabled={saving} title="Save"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-50">
              <CheckIcon size={15} />
            </button>
          ) : (
            <button type="button" onClick={startEdit} title="Edit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-700 transition-colors hover:bg-gray-50">
              <EditIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className={isEditing ? 'mt-2 space-y-1' : 'mt-2 divide-y divide-gray-100'}>
        {isEditing ? (
          <>
            <EditRow label="First Name" field="First_Name" value={editVals.First_Name} autoFocus onChange={handleFieldChange} />
            <EditRow label="Last Name" field="Last_Name" value={editVals.Last_Name} onChange={handleFieldChange} />
            <EditRow label="SSN" field="Social_Security_Number" value={editVals.Social_Security_Number} onChange={handleFieldChange} />
            <EditRow label="Date of Birth" field="Date_of_Birth" value={editVals.Date_of_Birth} type="date" onChange={handleFieldChange} />
            <DisplayRow label="Assigned To"   value={client.assignedTo}  bold />
            <EditRow label="Office Phone"  field="Office_Phone"  value={editVals.Office_Phone}  type="tel"   onChange={handleFieldChange} />
            <EditRow label="Primary Email" field="Email"         value={editVals.Email}          type="email" onChange={handleFieldChange} />
            <DisplayRow label="Created" value={client.created} bold />
            <DisplayRow label="Updated" value={client.updated} bold />
          </>
        ) : (
          <>
            <DisplayRow label="Full Name"      value={client.fullName}      bold />
            <DisplayRow label="SSN"            value={client.socialSecurityNumber} />
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

    </div>
  );
}

window.ClientDetailsCard = ClientDetailsCard;
