function CreditFactorCard({
  provider,
  providerOptions,
  reportDate,
  reportDateOptions,
  stats,
  loading,
  error,
  recordCount,
  canSubmit,
  onProviderChange,
  onReportDateChange,
  onSubmit,
}) {
  return (
    <div className="space-y-5">
      <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-sm font-semibold text-gray-800">Credit Factor Report</h1>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
          {!loading && error && <span className="text-xs text-red-500">{error}</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-4 items-end">
          <div>
            <CreditFactorDropdown
              label="Select Provider*"
              value={provider}
              onChange={onProviderChange}
              options={providerOptions}
              placeholder="Select Creditor"
            />
          </div>
          <div>
            <CreditFactorDropdown
              label="Select Date*"
              value={reportDate}
              onChange={onReportDateChange}
              options={reportDateOptions}
              placeholder="Select Date"
              sortOptions={false}
              emptyText="No records found"
            />
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`h-10 px-5 rounded-lg text-sm font-semibold ${
              canSubmit
                ? 'bg-indigo-900 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-800">Credit Factor</h2>
          {!loading && <span className="text-xs text-gray-400">{recordCount} record{recordCount === 1 ? '' : 's'}</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((item) => (
            <CreditFactorStatCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}

window.CreditFactorCard = CreditFactorCard;
