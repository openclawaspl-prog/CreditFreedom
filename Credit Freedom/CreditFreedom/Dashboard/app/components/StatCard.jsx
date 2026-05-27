function StatIcon({ name }) {
  if (name === 'bot') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6v2h-6zM7 8h10a3 3 0 0 1 3 3v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5a3 3 0 0 1 3-3zm-1 6v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2H6zm3-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </svg>
  );
  if (name === 'payment') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7zm3-1a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6zm13 6H5v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5z" />
    </svg>
  );
  if (name === 'pick') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l3 5h5l-4 4 1 6-5-3-5 3 1-6-4-4h5l3-5z" />
    </svg>
  );
  if (name === 'import') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h10a4 4 0 0 1 4 4v2h-2V8a2 2 0 0 0-2-2H6v12h8a2 2 0 0 0 2-2v-2h2v2a4 4 0 0 1-4 4H4V4z" />
      <path d="M14 11h6l-2-2 1.4-1.4L24 12l-4.6 4.4L18 15l2-2h-6z" />
    </svg>
  );
  if (name === 'submit') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12l18-9-4 18-4-6-6-3z" />
    </svg>
  );
  if (name === 'print') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v5H6z" />
      <path d="M6 14h12v7H6z" />
      <path d="M5 9h14a3 3 0 0 1 3 3v2h-4v-2H6v2H2v-2a3 3 0 0 1 3-3z" />
    </svg>
  );
  if (name === 'equifax') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v4H4z" />
      <path d="M4 11h10v4H4z" />
      <path d="M4 17h16v2H4z" />
    </svg>
  );
  if (name === 'transunion') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v3H4z" />
      <path d="M6 10h12v4H6z" />
      <path d="M8 16h8v3H8z" />
    </svg>
  );
  if (name === 'experian') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h14v3H5z" />
      <path d="M7 11h10v3H7z" />
      <path d="M9 16h6v3H9z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function StatCard({ title, value, accent, subtitle, icon }) {
  return (
    <div className="stat-card" style={{ '--accent': accent || '#2563eb' }}>
      <div className="stat-left">
        <div className="stat-icon" aria-hidden="true">
          <StatIcon name={icon} />
        </div>
        <div className="stat-body">
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle ? <p className="stat-sub">{subtitle}</p> : null}
        </div>
      </div>
      <div className="stat-badge" />
    </div>
  );
}

window.DashboardUI = window.DashboardUI || {};
window.DashboardUI.StatCard = StatCard;
