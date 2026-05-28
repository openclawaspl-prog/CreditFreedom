const { useState, useEffect } = React;

const CARD_DEFS = [
  {
    title: 'Equifax Login',
    fields: [
      { label: 'Equifax Username', api: 'Equifax_Username' },
      { label: 'Equifax Password', api: 'Equifax_Password' },
      { label: 'Equifax Notes', api: 'Equifax_Notes', multiLine: true },
    ],
  },
  {
    title: 'Transunion Login',
    fields: [
      { label: 'Transunion Username', api: 'Transunion_Username' },
      { label: 'Transunion Password', api: 'Transunion_Password' },
      { label: 'Transunion Notes', api: 'Transunion_Notes', multiLine: true },
      { label: 'Otp Email', api: 'Otp_Email' },
    ],
  },
  {
    title: 'Experian Monitoring Login',
    fields: [
      { label: 'Experian Username', api: 'Experian_Username' },
      { label: 'Experian Password', api: 'Experian_Password' },
      { label: 'URL', api: 'URL', type: 'url' },
      { label: 'Security Answer', api: 'Security_Answer' },
      { label: 'Last Import', api: 'Last_Import', type: 'datetime' },
      { label: 'PIN', api: 'PIN' },
      { label: 'Import Status', api: 'Import_status' },
      { label: 'Experian Notes', api: 'Experian_Notes', multiLine: true },
    ],
  },
];

function fmtDateTime(str) {
  if (!str) return '-';
  const d = new Date(str);
  const day = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} ${time}`;
}

function normalizeValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    return value.name || value.display_value || '-';
  }
  return String(value);
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function displayValueForField(field, rawValue) {
  if (field.type === 'datetime') return fmtDateTime(rawValue);
  if (field.type === 'url' && rawValue) {
    const url = normalizeValue(rawValue);
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-indigo-600 hover:text-indigo-700 break-all"
      >
        {url}
      </a>
    );
  }
  return normalizeValue(rawValue);
}

function FieldRow({ label, value, field, editing, onChange }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-start gap-3 py-1.5">
      <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
      {editing ? (
        field.multiLine ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[54px] w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        ) : (
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        )
      ) : (
        <span className={`text-sm text-gray-800 break-words ${field.multiLine ? 'whitespace-pre-line' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function LogginCredentialsCard({ stretch = false, cardTitles = null } = {}) {
  const [record, setRecord] = useState(null);
  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState({});
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});

  const containerClass = 'flex flex-col gap-3 w-full pb-3';
  const cardClass = 'bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-6 pb-8 w-full';
  const visibleCards = Array.isArray(cardTitles) && cardTitles.length
    ? CARD_DEFS.filter((card) => cardTitles.includes(card.title))
    : CARD_DEFS;

  function cardClassFor(card) {
    const matchedHeight = {
      'Transunion Login': ' h-[244px]',
      'Experian Monitoring Login': ' h-[362px]',
    }[card.title] || '';
    return `${cardClass}${matchedHeight}`;
  }

  function startEdit(card) {
    const nextDraft = {};
    card.fields.forEach((field) => {
      const raw = record ? record[field.api] : '';
      nextDraft[field.api] = raw == null ? '' : String(raw);
    });
    setDrafts((prev) => ({ ...prev, [card.title]: nextDraft }));
    setEditing((prev) => ({ ...prev, [card.title]: true }));
  }

  function updateDraft(cardTitle, api, value) {
    setDrafts((prev) => ({
      ...prev,
      [cardTitle]: {
        ...(prev[cardTitle] || {}),
        [api]: value,
      },
    }));
  }

  function saveCard(card) {
    if (!recordId || saving[card.title]) return;
    if (!window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.updateRecord) {
      setError('Unable to update login credentials.');
      return;
    }

    const draft = drafts[card.title] || {};
    const apiData = { id: recordId };
    card.fields.forEach((field) => {
      apiData[field.api] = draft[field.api] || '';
    });

    setSaving((prev) => ({ ...prev, [card.title]: true }));
    setError(null);

    ZOHO.CRM.API.updateRecord({
      Entity: 'Contacts',
      APIData: apiData,
      Trigger: ['workflow'],
    })
      .then(() => {
        setRecord((prev) => ({ ...(prev || {}), ...apiData }));
        setEditing((prev) => ({ ...prev, [card.title]: false }));
      })
      .catch(() => setError(`Failed to save ${card.title}.`))
      .finally(() => {
        setSaving((prev) => ({ ...prev, [card.title]: false }));
        window.OverviewWidget.requestResize();
      });
  }

  useEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const nextRecordId = data.EntityId;
      setRecordId(nextRecordId || '');
      setLoading(true);
      setError(null);
      setEditing({});
      setDrafts({});

      ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: nextRecordId })
        .then((res) => {
          if (res.data?.[0]) {
            setRecord(res.data[0]);
          } else {
            setError('Record not found.');
          }
        })
        .catch(() => setError('Failed to load login credentials.'))
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  if (loading) {
    return (
      <div className={containerClass}>
        {visibleCards.map((card) => (
          <div key={card.title} className={cardClassFor(card)}>
            <h2 className="text-base font-bold text-gray-900 mb-2">{card.title}</h2>
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ))}
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-8 text-center w-full">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {visibleCards.map((card) => (
        <div key={card.title} className={`${cardClassFor(card)} flex flex-col`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900">{card.title}</h2>
            <button
              type="button"
              onClick={() => editing[card.title] ? saveCard(card) : startEdit(card)}
              disabled={!!saving[card.title]}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50"
              title={editing[card.title] ? 'Save' : 'Edit'}
            >
              {editing[card.title] ? <SaveIcon /> : <EditIcon />}
            </button>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto pr-1">
            {card.fields.map((field) => {
              const rawValue = record ? record[field.api] : null;
              const isEditing = !!editing[card.title];
              const draftValue = drafts[card.title]?.[field.api] ?? '';
              const value = isEditing ? draftValue : displayValueForField(field, rawValue);

              return (
                <FieldRow
                  key={field.api}
                  label={field.label}
                  value={value}
                  field={field}
                  editing={isEditing}
                  onChange={(nextValue) => updateDraft(card.title, field.api, nextValue)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

window.LogginCredentialsCard = LogginCredentialsCard;
