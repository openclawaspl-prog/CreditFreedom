function WhatsChangedCard({
  changeType,
  changeTypeOptions,
  changeBureau,
  bureauOptions,
  changeDate,
  changeDateOptions,
  onChangeTypeChange,
  onChangeBureauChange,
  onChangeDateChange,
  onSubmit,
  selectedChangeGroup,
  selectedChangeRecords,
  showChangeCards,
  onToggleChangeCards,
}) {
  function formatChangeDateLabel(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }

  const activeGroup = selectedChangeGroup;
  const activeRecords = activeGroup && Array.isArray(activeGroup.records) ? activeGroup.records : [];

  return (
    <section className="relative z-40 overflow-visible bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">What's Changed</h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <CreditFactorDropdown
          value={changeType}
          onChange={onChangeTypeChange}
          options={changeTypeOptions}
        />
        <CreditFactorDropdown
          value={changeBureau}
          onChange={onChangeBureauChange}
          options={bureauOptions}
        />
        <CreditFactorDropdown
          value={changeDate}
          onChange={onChangeDateChange}
          options={changeDateOptions}
          placeholder="Select Date"
          sortOptions={false}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="h-10 px-5 rounded-lg bg-indigo-900 text-white text-sm font-semibold"
        >
          Submit
        </button>
      </div>

      {!!activeGroup && !!activeRecords.length && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                We found {activeRecords.length} changes to your {String(activeGroup.bureau || '').toLowerCase()} credit report
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatChangeDateLabel(activeGroup.date)}</p>
            </div>
            <button
              type="button"
              onClick={onToggleChangeCards}
              className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {showChangeCards ? 'Hide changes' : 'See changes'}
            </button>
          </div>

          {showChangeCards && (
            <div className="mt-4 space-y-3">
              {activeRecords.map((record, index) => {
                const borderColor = record.Color_Code || '#6366f1';
                const tone = String(record.Color_Code || '').toLowerCase();
                const tag = record.Block_Tag || 'Change';

                return (
                  <article
                    key={`${record.id || record.ID || activeGroup.date || 'change'}-${index}`}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm border-l-4"
                    style={{ borderLeftColor: borderColor }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-700">{record.Account_Name || '-'}</p>
                        <p className="text-xs text-gray-500 mt-1">{tag}</p>
                      </div>
                      <p className={`text-sm font-semibold ${tone.includes('red') ? 'text-green-600' : 'text-gray-900'}`}>
                        {record.Update_Comment || '-'}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-gray-700 leading-6">
                      {record.Detail_Comment_1 && <p>{record.Detail_Comment_1}</p>}
                      {record.Detail_Comment_2 && <p>{record.Detail_Comment_2}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

window.WhatsChangedCard = WhatsChangedCard;
