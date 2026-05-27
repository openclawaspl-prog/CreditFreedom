const { useEffect, useMemo, useState } = React;

function FilterBar({ initialFilters, onSubmit, onReset }) {
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const providerOptions = useMemo(
    () => ['All', 'Equifax', 'TransUnion', 'Experian'],
    []
  );

  const accountOptions = useMemo(
    () => ['All', 'Revolving', 'Installment', 'Mortgage', 'Auto', 'Other'],
    []
  );

  function updateField(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="filters-card">
      <div className="filters-header">
        <div>
          <p className="filters-title">Dispute Submit Filter</p>
          <p className="filters-sub">Tune the analytics using high-level filters.</p>
        </div>
        <div className="filters-actions">
          <button className="btn ghost" onClick={() => onReset()}>Reset</button>
          <button className="btn solid" onClick={() => onSubmit(filters)}>Submit</button>
        </div>
      </div>
      <div className="filters-grid">
        <label className="field">
          <span>Provider</span>
          <select
            value={filters.provider || 'All'}
            onChange={(e) => updateField('provider', e.target.value)}
          >
            {providerOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={filters.date || ''}
            onChange={(e) => updateField('date', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Account Type</span>
          <select
            value={filters.accountType || 'All'}
            onChange={(e) => updateField('accountType', e.target.value)}
          >
            {accountOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

window.DashboardUI = window.DashboardUI || {};
window.DashboardUI.FilterBar = FilterBar;
