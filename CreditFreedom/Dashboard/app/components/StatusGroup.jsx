function StatusIcon({ tone }) {
  if (tone === 'success') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 16.2L4.8 11.8l1.4-1.4 3 3 8-8 1.4 1.4-9.4 9.4z" />
    </svg>
  );
  if (tone === 'danger') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6a6 6 0 1 1-4.24 10.24L6 18" />
      <path d="M6 12h6v-4" />
    </svg>
  );
}

function GroupIcon({ name }) {
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
  if (name === 'alert') return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l10 18H2L12 3zm1 6v5h-2V9h2zm0 7v2h-2v-2h2z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function StatusMetricCard({ label, value, percent, tone }) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className={`row-icon ${tone}`} aria-hidden="true">
          <StatusIcon tone={tone} />
        </span>
        <span className="metric-label">{label}</span>
        <span className={`metric-percent ${tone}`}>
          {Number.isFinite(percent) ? percent.toFixed(2) + '%' : '--'}
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className={`metric-bar ${tone}`} style={{ '--value': safePercent }}>
        <span />
      </div>
    </div>
  );
}

function ActionCard({ title, total, icon, subtitle }) {
  return (
    <div className="action-card">
      <div className="action-title">
        <span className="group-icon" aria-hidden="true">
          <GroupIcon name={icon} />
        </span>
        <span>{title}</span>
      </div>
      <div className="action-total">{total}</div>
      <div className="action-sub">{subtitle || 'Updated just now'}</div>
    </div>
  );
}

function StatusGroup({ title, total, rows, icon, subtitle }) {
  const [inprogress, success, failed] = rows;
  return (
    <section className="action-row">
      <ActionCard title={title} total={total} icon={icon} subtitle={subtitle} />
      <StatusMetricCard {...inprogress} />
      <StatusMetricCard {...success} />
      <StatusMetricCard {...failed} />
    </section>
  );
}

window.DashboardUI = window.DashboardUI || {};
window.DashboardUI.StatusGroup = StatusGroup;
