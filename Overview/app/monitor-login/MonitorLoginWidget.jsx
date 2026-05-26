{
const { useState, useEffect } = React;

const monitorLoginColors = [
  'rgba(238, 244, 255, 0.68)',
  'rgba(235, 251, 252, 0.68)',
  'rgba(255, 250, 240, 0.68)',
  'rgba(255, 240, 239, 0.68)',
  'rgba(255, 253, 242, 0.68)',
  'rgba(251, 240, 255, 0.68)',
];

const MONITOR_LOGIN_MODULE = 'Monitoring_Log_In';
const MAX_FIELD_LENGTH = 40;
const MAX_NOTE_LENGTH = 1000;
const NOTE_PREVIEW_LENGTH = 90;
const MIN_USERNAME_LENGTH = 5;
const NAME_REGEX = /^[A-Za-z0-9.@#$ ]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9.@#$]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,40}$/;

function hasMonitorZohoApi() {
  return (
    typeof ZOHO !== 'undefined' &&
    ZOHO.CRM &&
    ZOHO.CRM.API &&
    ZOHO.CRM.API.searchRecord
  );
}

function getMonitorPageRecordId(data) {
  const entityId = data && data.EntityId;
  if (Array.isArray(entityId)) return entityId[0] || '';
  return entityId || '';
}

function getMonitorContactLookupValue(recordId) {
  return { id: recordId };
}

function mapMonitorRecord(record) {
  return {
    id: record.id,
    Name1: record.Name1 || '',
    Name: record.Name || '',
    Password: record.Password || '',
    Note: record.Note || record.Notes || '',
  };
}

function MonitorFieldIcon({ label }) {
  const commonProps = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (label === 'Username') {
    return (
      <svg {...commonProps}>
        <path d="M20 21a8 8 0 0 0-16 0"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    );
  }

  if (label === 'Password') {
    return (
      <svg {...commonProps}>
        <rect x="4" y="11" width="16" height="9" rx="2"></rect>
        <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
      </svg>
    );
  }

  if (label === 'Notes') {
    return (
      <svg {...commonProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M8 13h8"></path>
        <path d="M8 17h5"></path>
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 8v8"></path>
      <path d="M8 12h8"></path>
    </svg>
  );
}

function MonitorPasswordValue({ password, show }) {
  const chars = Array.from(password || '');
  if (!chars.length) return '-';

  return (
    <span className="password-value" aria-label={show ? password : 'Password hidden'}>
      {chars.map((char, index) => (
        <span
          key={`${show ? 'shown' : 'hidden'}-${index}-${char}`}
          className="password-char"
          style={{ animationDelay: `${index * 35}ms` }}
        >
          {show ? char : '*'}
        </span>
      ))}
    </span>
  );
}

function MonitorNoteValue({ note }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldClamp = (note || '').length > NOTE_PREVIEW_LENGTH;

  if (!note) return '-';

  return (
    <div className="note-value">
      <span className={`note-text ${shouldClamp && !isExpanded ? 'is-clamped' : ''}`}>
        {note}
      </span>
      {shouldClamp && (
        <button type="button" className="note-toggle" onClick={() => setIsExpanded(prev => !prev)}>
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}

function copyMonitorText(text) {
  if (!text) return Promise.resolve(false);

  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve(copied);
}

function MonitorDetailRow({ label, value, copyValue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyMonitorText(copyValue || '').then((success) => {
      if (!success) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="detail-row">
      <div className="detail-label">
        <span className="detail-icon">
          <MonitorFieldIcon label={label} />
        </span>
        {label}
      </div>
      <div className="detail-value-wrap">
        <div className="detail-value">{value}</div>
        {copyValue && copyValue !== '-' && (
          <button
            type="button"
            className="copy-field-button"
            onClick={handleCopy}
            title={copied ? 'Copied' : `Copy ${label}`}
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
          >
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MonitorCredentialCard({ card, index, onEdit, onDelete, showPasswords }) {
  const [copiedName, setCopiedName] = useState(false);
  const details = [
    { label: 'Username', value: card.Name || '-', copyValue: card.Name || '' },
    { label: 'Password', value: <MonitorPasswordValue password={card.Password} show={showPasswords} />, copyValue: card.Password || '' },
    { label: 'Notes', value: <MonitorNoteValue note={card.Note} />, copyValue: card.Note || '' },
  ];

  const handleCopyName = () => {
    copyMonitorText(card.Name1 || '').then((success) => {
      if (!success) return;
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 1200);
    });
  };

  return (
    <article className="card group relative" style={{ background: monitorLoginColors[index % monitorLoginColors.length] }}>
      <div className="monitor-card-actions absolute top-4 right-4 z-20 flex gap-2 opacity-0 transition-opacity duration-200">
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
          onClick={() => onDelete(card)}
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
            <div className="card-title-row">
              <h2 className="card-title flex items-center gap-3 text-[1.35rem] font-bold text-slate-800 break-all whitespace-normal">
                <span className="title-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="13" width="36" height="27" rx="5"></rect>
                    <path d="M17 13v-2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2"></path>
                    <path d="M15 8h18"></path>
                    <circle cx="18" cy="26" r="5"></circle>
                    <path d="M11 36a7 7 0 0 1 14 0"></path>
                    <path d="M29 23h9"></path>
                    <path d="M29 29h9"></path>
                    <path d="M29 35h6"></path>
                  </svg>
                </span>
                {card.Name1}
              </h2>
              {card.Name1 && (
                <button
                  type="button"
                  className="copy-field-button title-copy-button"
                  onClick={handleCopyName}
                  title={copiedName ? 'Copied' : 'Copy name'}
                  aria-label={copiedName ? 'Name copied' : 'Copy name'}
                >
                  {copiedName ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-7 space-y-1">
          {details.map(({ label, value, copyValue }) => (
            <MonitorDetailRow key={label} label={label} value={value || '-'} copyValue={copyValue} />
          ))}
        </div>
      </div>
    </article>
  );
}

function MonitorDeleteConfirmModal({ card, onCancel, onConfirm }) {
  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="confirm-modal">
        <div className="confirm-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Delete monitoring?</h2>
        <p className="text-sm leading-6 text-slate-600">
          Are you sure you want to delete <strong className="font-semibold text-slate-900">{card.Name1 || 'this login'}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(card.id)}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MonitorLoginModal({ isOpen, onClose, onSave, editingCard }) {
  const [formData, setFormData] = useState({
    Name1: '',
    Name: '',
    Password: '',
    Note: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
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
    } else if (trimmedNote.length > MAX_NOTE_LENGTH) {
      nextErrors.Note = `Note must be ${MAX_NOTE_LENGTH} characters or less.`;
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
            {errors.Name1 && <p className="mt-1 text-xs text-red-600">{errors.Name1}</p>}
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
            {errors.Name && <p className="mt-1 text-xs text-red-600">{errors.Name}</p>}
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
            {errors.Password && <p className="mt-1 text-xs text-red-600">{errors.Password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
            <textarea
              name="Note"
              value={formData.Note}
              onChange={handleChange}
              placeholder="e.g., Important account"
              className="min-h-24 w-full resize-y px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              maxLength={MAX_NOTE_LENGTH}
            ></textarea>
            {errors.Note && <p className="mt-1 text-xs text-red-600">{errors.Note}</p>}
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

function MonitorLoginStyles() {
  return (
    <style>{`
      .overview-monitor-login {
        color: #141821;
      }
      .overview-monitor-login .app-shell {
        position: relative;
        padding: 24px;
        overflow: hidden;
        background:
          linear-gradient(135deg, rgba(238, 244, 251, 0.70), rgba(255, 255, 255, 0.34));
      }
      .overview-monitor-login .page-title {
        font-family: Inter, system-ui, sans-serif;
        letter-spacing: 0;
      }
      .overview-monitor-login .search-box {
        position: relative;
        display: flex;
        align-items: center;
        width: min(100%, 440px);
        min-height: 48px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 16px;
        background:
          linear-gradient(145deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.42));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 12px 28px rgba(15, 23, 42, 0.07);
        backdrop-filter: blur(18px) saturate(150%);
        -webkit-backdrop-filter: blur(18px) saturate(150%);
      }
      .overview-monitor-login .search-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        color: rgba(71, 85, 105, 0.86);
        flex: 0 0 auto;
      }
      .overview-monitor-login .search-input {
        min-width: 0;
        flex: 1;
        border: 0;
        background: transparent;
        padding: 0 44px 0 0;
        color: rgba(15, 23, 42, 0.94);
        font-size: 0.95rem;
        font-weight: 600;
        outline: none;
      }
      .overview-monitor-login .search-input::placeholder {
        color: rgba(100, 116, 139, 0.78);
        font-weight: 500;
      }
      .overview-monitor-login .search-input::-webkit-search-cancel-button,
      .overview-monitor-login .search-input::-webkit-search-decoration {
        display: none;
        -webkit-appearance: none;
      }
      .overview-monitor-login .search-clear {
        position: absolute;
        right: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 9px;
        background: rgba(226, 232, 240, 0.72);
        color: rgba(51, 65, 85, 0.86);
      }
      .overview-monitor-login .search-clear:hover {
        background: rgba(15, 23, 42, 0.92);
        color: #ffffff;
      }
      .overview-monitor-login .card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }
      .overview-monitor-login .card {
        position: relative;
        min-height: 284px;
        border-radius: 12px;
        padding: 28px 28px 26px;
        border: 1px solid rgba(255, 255, 255, 0.70);
        box-shadow: 0 22px 46px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.78);
        backdrop-filter: blur(24px) saturate(175%);
        -webkit-backdrop-filter: blur(24px) saturate(175%);
        overflow: hidden;
        transform: translateY(0) scale(1);
        transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        will-change: transform;
      }
      @media (hover: hover) and (pointer: fine) {
        .overview-monitor-login .card:hover {
          transform: translateY(-6px) scale(1.012);
          border-color: rgba(255, 255, 255, 0.82);
          box-shadow: 0 30px 64px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        .overview-monitor-login .card:hover .monitor-card-actions,
        .overview-monitor-login .monitor-card-actions:focus-within {
          opacity: 1;
        }
      }
      @media (hover: none), (pointer: coarse) {
        .overview-monitor-login .card:hover {
          transform: translateY(0) scale(1);
          border-color: rgba(255, 255, 255, 0.56);
          box-shadow: 0 22px 46px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.78);
        }
      }
      .overview-monitor-login .card::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.62), transparent 44%), linear-gradient(315deg, rgba(255, 255, 255, 0.26), transparent 52%);
        opacity: 0.78;
      }
      .overview-monitor-login .bg-slate-900 {
        border: 1px solid rgba(255, 255, 255, 0.20) !important;
        background:
          linear-gradient(145deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.68)) !important;
        box-shadow:
          0 18px 36px rgba(15, 23, 42, 0.20),
          inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
        backdrop-filter: blur(18px) saturate(170%);
        -webkit-backdrop-filter: blur(18px) saturate(170%);
      }
      .overview-monitor-login .bg-white,
      .overview-monitor-login .bg-white\\/60,
      .overview-monitor-login .bg-white\\/70 {
        border-color: rgba(255, 255, 255, 0.72) !important;
        background:
          linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.52)) !important;
        box-shadow:
          0 18px 42px rgba(15, 23, 42, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
        backdrop-filter: blur(22px) saturate(175%);
        -webkit-backdrop-filter: blur(22px) saturate(175%);
      }
      .overview-monitor-login .card::after {
        content: "";
        position: absolute;
        inset: auto 18px 0;
        height: 1px;
        background: rgba(255, 255, 255, 0.74);
      }
      .overview-monitor-login .card-title {
        font-family: Inter, system-ui, sans-serif;
        letter-spacing: 0;
      }
      .overview-monitor-login .card-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .overview-monitor-login .title-icon,
      .overview-monitor-login .detail-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        color: rgba(15, 23, 42, 0.72);
      }
      .overview-monitor-login .title-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.52);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
      }
      .overview-monitor-login .detail-row {
        display: grid;
        grid-template-columns: 144px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 8px 0;
      }
      .overview-monitor-login .detail-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(20, 24, 33, 0.9);
        font-size: 0.95rem;
        line-height: 1.45;
      }
      .overview-monitor-login .detail-value {
        font-size: 1rem;
        font-weight: 700;
        color: rgba(20, 24, 33, 0.92);
        word-break: break-word;
      }
      .overview-monitor-login .detail-value-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .overview-monitor-login .copy-field-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.62);
        color: rgba(51, 65, 85, 0.82);
        opacity: 0;
        pointer-events: none;
        transform: translateX(-4px) scale(0.94);
        transition: opacity 160ms ease, transform 160ms ease, background 160ms ease, color 160ms ease;
      }
      .overview-monitor-login .detail-row:hover .copy-field-button,
      .overview-monitor-login .card-title-row:hover .copy-field-button,
      .overview-monitor-login .copy-field-button:focus-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(0) scale(1);
      }
      .overview-monitor-login .title-copy-button {
        margin-left: 2px;
      }
      .overview-monitor-login .copy-field-button:hover {
        background: rgba(15, 23, 42, 0.94);
        color: #ffffff;
      }
      .overview-monitor-login .password-value {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0;
        font-variant-numeric: tabular-nums;
      }
      .overview-monitor-login .password-char {
        display: inline-block;
        min-width: 0.62em;
        animation: monitorPasswordFlip 260ms ease both;
        transform-origin: center;
      }
      .overview-monitor-login .note-value {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .overview-monitor-login .note-text {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .overview-monitor-login .note-text.is-clamped {
        display: -webkit-box;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }
      .overview-monitor-login .note-toggle {
        border: 0;
        padding: 0;
        background: transparent;
        color: #4f46e5;
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1.2;
      }
      .overview-monitor-login .note-toggle:hover {
        color: #312e81;
        text-decoration: underline;
      }
      .overview-monitor-login .confirm-modal {
        width: min(100%, 420px);
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.72);
        background:
          linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72));
        padding: 24px;
        box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
        backdrop-filter: blur(22px) saturate(160%);
        -webkit-backdrop-filter: blur(22px) saturate(160%);
        animation: monitorModalPop 180ms ease both;
      }
      .overview-monitor-login .confirm-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        margin-bottom: 14px;
        border-radius: 14px;
        background: rgba(254, 226, 226, 0.95);
        color: #dc2626;
      }
      .overview-monitor-login-scroll {
        height: 720px;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .overview-monitor-login-scroll::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      .overview-monitor-login-scroll::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.26);
        border-radius: 999px;
      }
      .overview-monitor-login-scroll::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.46);
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
      }
      .overview-monitor-login-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(71, 85, 105, 0.58);
      }
      @keyframes monitorPasswordFlip {
        0% {
          opacity: 0;
          transform: translateY(-4px) rotateX(72deg);
        }
        100% {
          opacity: 1;
          transform: translateY(0) rotateX(0deg);
        }
      }
      @keyframes monitorModalPop {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.96);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @media (max-width: 640px) {
        .overview-monitor-login .app-shell {
          padding: 16px;
        }
        .overview-monitor-login .search-box {
          width: 100%;
        }
        .overview-monitor-login .detail-row {
          grid-template-columns: 124px minmax(0, 1fr);
          gap: 10px;
        }
      }
      @media (max-width: 1100px) {
        .overview-monitor-login .card-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .overview-monitor-login .card-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

function OverviewMonitorLoginWidget() {
  const [cards, setCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [contactRecordId, setContactRecordId] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [cardPendingDelete, setCardPendingDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = (recordId, options = {}) => {
    const { showLoading = true, showRefreshing = false } = options;

    if (!hasMonitorZohoApi()) {
      setCards([]);
      if (showLoading) setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
      setLoadError('Zoho CRM API is not available.');
      return Promise.resolve();
    }

    if (!recordId) {
      if (showLoading) setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
      setLoadError('No Contact record id available.');
      return Promise.resolve();
    }

    if (showLoading) setIsLoading(true);
    if (showRefreshing) setIsRefreshing(true);
    setLoadError(null);

    return ZOHO.CRM.API.searchRecord({
      Entity: MONITOR_LOGIN_MODULE,
      Type: 'criteria',
      Query: `(Clients:equals:${recordId})`,
      delay: false,
    }, 1, 200)
      .then((res) => {
        const records = res.data || [];
        const mapped = records.map(mapMonitorRecord);
        setCards(mapped);
      })
      .catch((err) => {
        console.error('Failed to load Monitoring Log In records:', err);
        setLoadError('Failed to load Monitoring Log In records.');
      })
      .finally(() => {
        if (showLoading) setIsLoading(false);
        if (showRefreshing) setIsRefreshing(false);
        window.OverviewWidget && window.OverviewWidget.requestResize();
      });
  };

  useEffect(() => {
    if (!window.OverviewWidget) {
      setIsLoading(false);
      setLoadError('Overview widget context is not available.');
      return undefined;
    }

    return window.OverviewWidget.onPageLoad((data) => {
      const recordId = getMonitorPageRecordId(data);
      setContactRecordId(recordId);
      fetchRecords(recordId);
    });
  }, []);

  useEffect(() => {
    if (window.OverviewWidget) window.OverviewWidget.requestResize();
  }, [cards.length, isLoading, isModalOpen, cardPendingDelete, searchQuery]);

  const handleSaveCard = (formData) => {
    if (!hasMonitorZohoApi()) {
      setLoadError('Zoho CRM API is not available.');
      return;
    }

    if (!contactRecordId) {
      setLoadError('Cannot save without a Contact record id.');
      return;
    }

    if (editingCard) {
      ZOHO.CRM.API.updateRecord({
        Entity: MONITOR_LOGIN_MODULE,
        APIData: { id: editingCard.id, ...formData, Clients: getMonitorContactLookupValue(contactRecordId) },
        Trigger: ['workflow'],
      })
        .then(() => {
          setCards(prev => prev.map(card => (
            String(card.id) === String(editingCard.id)
              ? { ...card, ...formData }
              : card
          )));
          setIsModalOpen(false);
          setEditingCard(null);
        })
        .catch(() => {
          setLoadError('Failed to update record.');
        });
    } else {
      ZOHO.CRM.API.insertRecord({
        Entity: MONITOR_LOGIN_MODULE,
        APIData: { ...formData, Clients: getMonitorContactLookupValue(contactRecordId) },
        Trigger: ['workflow'],
      })
        .then((res) => {
          const createdId = res.data?.[0]?.details?.id;
          if (!createdId) {
            setLoadError('Record created, but ID was not returned.');
          }
          setCards(prev => [
            {
              id: createdId || `pending-${Date.now()}`,
              ...formData,
            },
            ...prev,
          ]);
          setIsModalOpen(false);
          setEditingCard(null);
        })
        .catch(() => {
          setLoadError('Failed to create record.');
        });
    }
  };

  const handleDeleteCard = (id) => {
    if (!hasMonitorZohoApi()) {
      setLoadError('Zoho CRM API is not available.');
      return;
    }

    ZOHO.CRM.API.deleteRecord({ Entity: MONITOR_LOGIN_MODULE, RecordID: id })
      .then(() => {
        setCardPendingDelete(null);
        setCards(prev => prev.filter(card => String(card.id) !== String(id)));
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

  const handleRefreshRecords = () => {
    if (isRefreshing) return;
    fetchRecords(contactRecordId, { showLoading: false, showRefreshing: true });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCards = normalizedSearch
    ? cards.filter(card => [
      card.Name1,
      card.Name,
      card.Password,
      card.Note,
    ].some(value => String(value || '').toLowerCase().includes(normalizedSearch)))
    : cards;

  return (
    <div className="overview-monitor-login">
      <MonitorLoginStyles />
      <main className="app-shell">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          <div className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logins..."
                className="search-input"
                aria-label="Search login credentials"
              />
              {searchQuery && (
                <button type="button" className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              )}
            </label>
            <div className="flex items-center gap-3 lg:ml-auto">
              <button
                onClick={handleOpenAddModal}
                type="button"
                className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30" aria-hidden="true">
                  <span className="absolute h-2.5 w-px rounded-full bg-current"></span>
                  <span className="absolute h-px w-2.5 rounded-full bg-current"></span>
                </span>
                Add Another Monitoring
              </button>
              <button
                onClick={() => setShowPasswords(prev => !prev)}
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
                title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
              >
                {showPasswords ? (
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a18.45 18.45 0 0 1 5.06-6.94"></path>
                    <path d="M9.9 4.24A10.84 10.84 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"></path>
                    <path d="M1 1l22 22"></path>
                  </svg>
                ) : (
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
              <button
                onClick={handleRefreshRecords}
                type="button"
                disabled={isRefreshing || !contactRecordId}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
                title={isRefreshing ? 'Refreshing' : 'Refresh logins'}
                aria-label={isRefreshing ? 'Refreshing logins' : 'Refresh logins'}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isRefreshing ? 'animate-spin' : ''}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
                  <path d="M21 3v6h-6"></path>
                </svg>
              </button>
            </div>
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
            ) : filteredCards.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-600">
                No logins match your search.
              </div>
            ) : (
              filteredCards.map((card, index) => (
                <MonitorCredentialCard
                  key={card.id}
                  card={card}
                  index={index}
                  onEdit={handleEditCard}
                  onDelete={setCardPendingDelete}
                  showPasswords={showPasswords}
                />
              ))
            )}
          </section>
        </div>

        <MonitorLoginModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCard}
          editingCard={editingCard}
        />
        <MonitorDeleteConfirmModal
          card={cardPendingDelete}
          onCancel={() => setCardPendingDelete(null)}
          onConfirm={handleDeleteCard}
        />
      </main>
    </div>
  );
}

window.OverviewMonitorLoginWidget = OverviewMonitorLoginWidget;
}
