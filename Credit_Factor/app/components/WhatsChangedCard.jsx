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
  canSubmit,
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
  const recordsByBlockTag = activeRecords.reduce((groups, record) => {
    const blockTag = record.Block_Tag || 'Change';
    if (!groups[blockTag]) groups[blockTag] = [];
    groups[blockTag].push(record);
    return groups;
  }, {});
  const blockTagGroups = Object.keys(recordsByBlockTag);

  React.useEffect(() => {
    const payload = {
      changeType,
      changeTypeOptions,
      selectedCreditor: changeBureau,
      creditorOptions: bureauOptions,
      selectedDate: changeDate,
      dateOptions: changeDateOptions,
      canSubmit,
      selectedRecordCount: selectedChangeRecords ? selectedChangeRecords.length : 0,
    };

    console.log('[CreditFactor][WhatsChanged] WhatsChangedCard props', payload);
  }, [
    changeType,
    changeBureau,
    changeDate,
    changeDateOptions.length,
    canSubmit,
    selectedChangeRecords ? selectedChangeRecords.length : 0,
  ]);

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
          placeholder="Select Creditor"
        />
        <CreditFactorDropdown
          value={changeDate}
          onChange={onChangeDateChange}
          options={changeDateOptions}
          placeholder="Select Date"
          sortOptions={false}
          emptyText="No records found"
        />
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

      {!!activeGroup && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white/80 px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {activeRecords.length
                  ? `We found ${activeRecords.length} changes to your ${String(activeGroup.bureau || '').toLowerCase()} credit report`
                  : 'No records found'}
              </p>
              {!!activeGroup.date && <p className="text-xs text-gray-500 mt-1">{formatChangeDateLabel(activeGroup.date)}</p>}
            </div>
            {!!activeRecords.length && (
              <button
                type="button"
                onClick={onToggleChangeCards}
                className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {showChangeCards ? 'Hide changes' : 'See changes'}
              </button>
            )}
          </div>

          {!!activeRecords.length && showChangeCards && (
            <div className="mt-4 space-y-5">
              {blockTagGroups.map((blockTag) => (
                <div key={blockTag} className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">{blockTag}</h3>
                  {recordsByBlockTag[blockTag].map((record, index) => (
                    <article
                      key={`${record.id || record.ID || activeGroup.date || blockTag}-${index}`}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm border-l-4 border-l-green-500"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-blue-700">{record.Account_Name || '-'}</p>
                        <p className="text-sm font-semibold text-gray-900">{record.Update_Comment || '-'}</p>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-gray-700 leading-6">
                        {record.Detail_Comment_1 && <p>{record.Detail_Comment_1}</p>}
                        {record.Detail_Comment_2 && <p>{record.Detail_Comment_2}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

window.WhatsChangedCard = WhatsChangedCard;
