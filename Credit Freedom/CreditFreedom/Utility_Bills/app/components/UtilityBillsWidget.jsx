const { useMemo } = React;

function UtilityBillsWidget({ formDefaults, billTypes, rows }) {
  const options = useMemo(() => billTypes || [], [billTypes]);

  return (
    <div className="space-y-6" id="utility-bills">
      <section className="cf-card">
        <div className="cf-card-header">
          <h2 className="cf-card-title">Generate Utility Bill</h2>
        </div>
        <div className="cf-card-body">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <label className="cf-label" htmlFor="account-number">Account Number*</label>
              <input
                id="account-number"
                className="cf-input"
                type="text"
                placeholder={formDefaults.accountNumberPlaceholder}
                defaultValue={formDefaults.accountNumber}
              />
            </div>
            <div className="md:col-span-4">
              <label className="cf-label" htmlFor="billing-date">Billing Date*</label>
              <div className="relative">
                <input
                  id="billing-date"
                  className="cf-input pr-10"
                  type="text"
                  placeholder={formDefaults.billingDatePlaceholder}
                  defaultValue={formDefaults.billingDate}
                />
                <span className="cf-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M8 3v4M16 3v4" />
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="cf-label" htmlFor="bill-type">Bill Type*</label>
              <div className="relative">
                <select id="bill-type" className="cf-select" defaultValue={formDefaults.billType}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="cf-select-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="md:col-span-1 md:flex md:justify-end">
              <button type="button" className="cf-primary-button">
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="cf-card">
        <div className="cf-card-header cf-card-header--tight">
          <h3 className="cf-card-title">Utility Bill</h3>
        </div>
        <div className="cf-card-body cf-table-body">
          <div className="cf-table-scroll">
            <table className="cf-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Bill Type</th>
                  <th>Account Number</th>
                  <th>Bill Date</th>
                  <th>Address</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={`${row.clientName}-${idx}`}>
                    <td>{row.clientName}</td>
                    <td className="cf-pill">{row.billType}</td>
                    <td>{row.accountNumber}</td>
                    <td>{row.billDate}</td>
                    <td>{row.address}</td>
                    <td>
                      <div className="cf-action">
                        <button type="button" className="cf-icon-button" aria-label="Download PDF">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                            <path d="M14 3v5h5" />
                            <path d="M9 13h6" />
                            <path d="M9 16h4" />
                          </svg>
                          <span>PDF</span>
                        </button>
                        <button type="button" className="cf-icon-button" aria-label="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button type="button" className="cf-icon-button" aria-label="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M6 6l1 14h10l1-14" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

window.UtilityBillsWidget = UtilityBillsWidget;
