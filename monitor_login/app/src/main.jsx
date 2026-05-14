import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

// Entry used by index.html and bundled by Vite.
// 6 color palette that repeats
const colors = [
  'rgba(238, 244, 255, 0.68)',
  'rgba(235, 251, 252, 0.68)',
  'rgba(255, 250, 240, 0.68)',
  'rgba(255, 240, 239, 0.68)',
  'rgba(255, 253, 242, 0.68)',
  'rgba(251, 240, 255, 0.68)',
];

const MODULE_NAME = 'Monitoring_Log_In';

const hasZohoApi = () => (
  typeof ZOHO !== 'undefined' &&
  ZOHO.CRM &&
  ZOHO.CRM.API &&
  ZOHO.CRM.API.searchRecord
);

const getPageRecordId = (data) => {
  const entityId = data && data.EntityId;
  if (Array.isArray(entityId)) return entityId[0] || '';
  return entityId || '';
};

const getContactLookupValue = (recordId) => ({ id: recordId });

const MAX_FIELD_LENGTH = 40;
const MIN_USERNAME_LENGTH = 5;
const NAME_REGEX = /^[A-Za-z0-9.@#$ ]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9.@#$]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,40}$/;

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
}

function CredentialCard({ card, index, onEdit, onDelete }) {
  const details = [
    ['URL', card.URL],
    ['Username', card.Name],
    ['Password', card.Password],
    ['Last Import', card.Last_Import],
    ['Import Status', card.Import_Status],
    ['Notes', card.Note],
  ];

  return (
    <article
      className="card group relative"
      style={{ background: colors[index % colors.length] }}
    >
      {/* Edit and Delete buttons - visible on hover */}
      <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(card)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 transition-all duration-150 shadow-sm hover:shadow-md"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          onClick={() => onDelete(card.id)}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-red-100 text-slate-700 hover:text-red-600 transition-all duration-150 shadow-sm hover:shadow-md"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 pr-16">
          <div className="flex-1 min-w-0">
            <h2 className="card-title text-[1.35rem] font-bold text-slate-800 break-all whitespace-normal">
              {card.Name1}
            </h2>
          </div>
        </div>

        <div className="mt-7 space-y-1">
          {details.map(([label, value]) => (
            <DetailRow key={label} label={label} value={value || '-'} />
          ))}
        </div>
      </div>
    </article>
  );
}

function MonitoringModal({ isOpen, onClose, onSave, editingCard }) {
  const [formData, setFormData] = useState({
    Name1: '',
    Name: '',
    Password: '',
    Note: '',
  });
  const [errors, setErrors] = useState({});

  // Update form when editingCard changes
  React.useEffect(() => {
    if (editingCard) {
      setFormData(editingCard);
    } else {
      setFormData({ Name1: '', Name: '', Password: '', Note: '' });
    }
    setErrors({});
  }, [editingCard, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = formData.Name1.trim();
    const trimmedUserName = formData.Name.trim();
    const trimmedPassword = formData.Password.trim();
    const trimmedNote = formData.Note.trim();

    if (!trimmedName) {
      nextErrors.Name1 = 'Name is required.';
    } else if (trimmedName.length > MAX_FIELD_LENGTH) {
      nextErrors.Name1 = `Name must be ${MAX_FIELD_LENGTH} characters or less.`;
    } else if (!NAME_REGEX.test(trimmedName)) {
      nextErrors.Name1 = 'Only letters, numbers, space, ., $, @, # are allowed.';
    }

    if (!trimmedUserName) {
      nextErrors.Name = 'User name is required.';
    } else if (trimmedUserName.length < MIN_USERNAME_LENGTH) {
      nextErrors.Name = `User name must be at least ${MIN_USERNAME_LENGTH} characters.`;
    } else if (trimmedUserName.length > MAX_FIELD_LENGTH) {
      nextErrors.Name = `User name must be ${MAX_FIELD_LENGTH} characters or less.`;
    } else if (!USERNAME_REGEX.test(trimmedUserName)) {
      nextErrors.Name = 'Only letters, numbers, ., @, $, # are allowed.';
    }

    if (!trimmedPassword) {
      nextErrors.Password = 'Password is required.';
    } else if (!PASSWORD_REGEX.test(trimmedPassword)) {
      nextErrors.Password = 'Password must be 8-40 chars with letters and numbers.';
    }

    if (!trimmedNote) {
      nextErrors.Note = 'Note is required.';
    } else if (trimmedNote.length > MAX_FIELD_LENGTH) {
      nextErrors.Note = `Note must be ${MAX_FIELD_LENGTH} characters or less.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        Name1: formData.Name1.trim(),
        Name: formData.Name.trim(),
        Password: formData.Password.trim(),
        Note: formData.Note.trim(),
      });
    }
  };

  if (!isOpen) return null;

  const isEditing = !!editingCard;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Edit Monitoring' : 'Add New Monitoring'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              name="Name1"
              value={formData.Name1}
              onChange={handleChange}
              placeholder="e.g., Credit Monitoring Login"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              maxLength={MAX_FIELD_LENGTH}
              required
            />
            {errors.Name1 && (
              <p className="mt-1 text-xs text-red-600">{errors.Name1}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">User Name</label>
            <input
              type="text"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              placeholder="e.g., john.1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              maxLength={MAX_FIELD_LENGTH}
            />
            {errors.Name && (
              <p className="mt-1 text-xs text-red-600">{errors.Name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              name="Password"
              value={formData.Password}
              onChange={handleChange}
              placeholder="e.g., password123"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              maxLength={MAX_FIELD_LENGTH}
            />
            {errors.Password && (
              <p className="mt-1 text-xs text-red-600">{errors.Password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
            <input
              type="text"
              name="Note"
              value={formData.Note}
              onChange={handleChange}
              placeholder="e.g., Important account"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              maxLength={MAX_FIELD_LENGTH}
            />
            {errors.Note && (
              <p className="mt-1 text-xs text-red-600">{errors.Note}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              {isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function useDynamicHeight() {
  useEffect(() => {
    let timer;

    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const root = document.getElementById('root');
        if (!root) return;

        const bodyStyle = window.getComputedStyle(document.body);
        const paddingTop = parseFloat(bodyStyle.paddingTop || 0);
        const paddingBottom = parseFloat(bodyStyle.paddingBottom || 0);
        const rootRect = root.getBoundingClientRect();
        const measuredRootHeight = Math.max(
          root.scrollHeight,
          root.offsetHeight,
          rootRect.height
        );
        const h = Math.ceil(measuredRootHeight + paddingTop + paddingBottom + 40);

        if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
          window.ZOHO.CRM.UI.Resize({ height: String(h), width: '0' });
        }
      }, 150);
    }

    function burstResize() {
      sendResize();
      requestAnimationFrame(sendResize);
      [300, 800, 1500, 3000].forEach(delay => setTimeout(sendResize, delay));
    }

    const root = document.getElementById('root');
    const observer = window.ResizeObserver ? new ResizeObserver(sendResize) : null;
    if (root && observer) observer.observe(root);

    window.MonitorLoginWidget = window.MonitorLoginWidget || {};
    window.MonitorLoginWidget.requestResize = sendResize;

    burstResize();
    window.addEventListener('resize', sendResize);
    window.addEventListener('load', burstResize);

    return () => {
      if (observer) observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', sendResize);
      window.removeEventListener('load', burstResize);
      if (window.MonitorLoginWidget) {
        window.MonitorLoginWidget.requestResize = function () {};
      }
    };
  }, []);
}

function App() {
  useDynamicHeight();

  const [cards, setCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [contactRecordId, setContactRecordId] = useState(null);

  const fetchRecords = (recordId) => {
    if (!hasZohoApi()) {
      setCards([]);
      setIsLoading(false);
      setLoadError('Zoho CRM API is not available.');
      return;
    }

    if (!recordId) {
      setIsLoading(false);
      setLoadError('No Contact record id available.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    ZOHO.CRM.API.searchRecord({
      Entity: MODULE_NAME,
      Type: 'criteria',
      Query: `(Clients:equals:${recordId})`,
      delay: false,
    }, 1, 200)
      .then((res) => {
        const records = res.data || [];
        const mapped = records.map(record => ({
          id: record.id,
          Name1: record.Name1 || '',
          URL: record.URL || record.Url || record.url || '',
          Name: record.Name || '',
          Password: record.Password || '',
          Last_Import: record.Last_Import || record.Last_import || record.Last_Imported || record.Last_Import_Time || '',
          Import_Status: record.Import_Status || record.Import_status || record.Status || '',
          Note: record.Note || record.Notes || '',
        }));
        setCards(mapped);
      })
      .catch((err) => {
        console.error('Failed to load Monitoring Log In records:', err);
        setLoadError('Failed to load Monitoring Log In records.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!hasZohoApi()) {
      setIsLoading(false);
      return;
    }

    ZOHO.embeddedApp.on('PageLoad', (data) => {
      const recordId = getPageRecordId(data);
      setContactRecordId(recordId);
      fetchRecords(recordId);
    });
    ZOHO.embeddedApp.init();
  }, []);

  const handleSaveCard = (formData) => {
    if (!hasZohoApi()) {
      setLoadError('Zoho CRM API is not available.');
      return;
    }

    if (!contactRecordId) {
      setLoadError('Cannot save without a Contact record id.');
      return;
    }

    if (editingCard) {
      ZOHO.CRM.API.updateRecord({
        Entity: MODULE_NAME,
        APIData: { id: editingCard.id, ...formData, Clients: getContactLookupValue(contactRecordId) },
        Trigger: ['workflow'],
      })
        .then(() => {
          fetchRecords(contactRecordId);
          setIsModalOpen(false);
          setEditingCard(null);
        })
        .catch(() => {
          setLoadError('Failed to update record.');
        });
    } else {
      ZOHO.CRM.API.insertRecord({
        Entity: MODULE_NAME,
        APIData: { ...formData, Clients: getContactLookupValue(contactRecordId) },
        Trigger: ['workflow'],
      })
        .then((res) => {
          if (!res.data?.[0]?.details?.id) {
            setLoadError('Record created, but ID was not returned.');
          }
          fetchRecords(contactRecordId);
          setIsModalOpen(false);
          setEditingCard(null);
        })
        .catch(() => {
          setLoadError('Failed to create record.');
        });
    }
  };

  const handleDeleteCard = (id) => {
    if (!hasZohoApi()) {
      setLoadError('Zoho CRM API is not available.');
      return;
    }

    ZOHO.CRM.API.deleteRecord({ Entity: MODULE_NAME, RecordID: id })
      .then(() => {
        fetchRecords(contactRecordId);
      })
      .catch(() => {
        setLoadError('Failed to delete record.');
      });
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  return (
    <main className="app-shell">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="page-title text-4xl font-bold text-slate-900">
            Log In Credentials
          </h1>
          <button
            onClick={handleOpenAddModal}
            type="button"
            className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-lg leading-none">+</span>
            Add Another Monitoring
          </button>
        </div>

        {loadError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <section className="card-grid">
          {isLoading ? (
            <div className="col-span-full text-sm text-slate-600">Loading records...</div>
          ) : cards.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-600">
              No monitoring logins found.
            </div>
          ) : (
            cards.map((card, index) => (
              <CredentialCard
                key={card.id}
                card={card}
                index={index}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
              />
            ))
          )}
        </section>
      </div>

      <MonitoringModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCard}
        editingCard={editingCard}
      />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
