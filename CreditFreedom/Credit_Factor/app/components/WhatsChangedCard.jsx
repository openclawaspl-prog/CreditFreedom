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
  const hasActiveRecords = activeRecords.length > 0;
  const [tooltipState, setTooltipState] = React.useState({ visible: false, x: 0, y: 0 });
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
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <CreditFactorIcon name="changes" size={16} className="text-indigo-600" />
        What's Changed
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <CreditFactorDropdown
          value={changeType}
          icon="filter"
          onChange={onChangeTypeChange}
          options={changeTypeOptions}
        />
        <CreditFactorDropdown
          value={changeBureau}
          icon="bureau"
          onChange={onChangeBureauChange}
          options={bureauOptions}
          placeholder="Select Creditor"
        />
        <CreditFactorDropdown
          value={changeDate}
          icon="calendar"
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
          <span className="inline-flex items-center gap-1.5">
            <CreditFactorIcon name="send" size={14} />
          Submit
          </span>
        </button>
      </div>

      {!!activeGroup && (
        <div
          className={`group relative mt-5 rounded-2xl border px-6 py-6 shadow-sm transition-all duration-200 ${
            hasActiveRecords
              ? 'border-gray-200 bg-gradient-to-br from-white via-white to-slate-50/70'
              : 'border-gray-200 bg-white/80'
          }`}
        >
          <div
            role={hasActiveRecords ? 'button' : undefined}
            tabIndex={hasActiveRecords ? 0 : undefined}
            aria-expanded={hasActiveRecords ? showChangeCards : undefined}
            onClick={hasActiveRecords ? onToggleChangeCards : undefined}
            onMouseMove={(event) => {
              if (!hasActiveRecords) return;
              const rect = event.currentTarget.getBoundingClientRect();
              setTooltipState({
                visible: true,
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }}
            onMouseLeave={() => setTooltipState(prev => ({ ...prev, visible: false }))}
            onFocus={(event) => {
              if (!hasActiveRecords) return;
              const rect = event.currentTarget.getBoundingClientRect();
              setTooltipState({
                visible: true,
                x: rect.width / 2,
                y: 28,
              });
            }}
            onBlur={() => setTooltipState(prev => ({ ...prev, visible: false }))}
            onKeyDown={(event) => {
              if (!hasActiveRecords) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleChangeCards();
              }
            }}
            className={`relative flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 focus:outline-none ${
              hasActiveRecords ? 'cursor-pointer' : ''
            }`}
          >
            {hasActiveRecords && tooltipState.visible && (
              <div
                className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-semibold text-white shadow-xl shadow-gray-900/20"
                style={{ left: tooltipState.x, top: tooltipState.y }}
              >
                Click here to {showChangeCards ? 'collapse' : 'expand'} changes
                <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-gray-950" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CreditFactorIcon name="calendar" size={17} />
              </span>
              <div>
                {!!activeGroup.date && <p className="text-base font-semibold text-gray-900">{formatChangeDateLabel(activeGroup.date)}</p>}
                <p className="mt-1 text-sm text-gray-500">
                {hasActiveRecords ? (
                  <>
                    We found{' '}
                    <span className="font-bold text-emerald-600">
                      {activeRecords.length} {activeRecords.length === 1 ? 'change' : 'changes'}
                    </span>
                    {' '}to your {String(activeGroup.bureau || '').toLowerCase()} credit report
                  </>
                ) : (
                  'No records found'
                )}
                </p>
              </div>
            </div>
          </div>

          {hasActiveRecords && showChangeCards && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {blockTagGroups.map((blockTag) => (
                <div
                  key={blockTag}
                  className={`space-y-3 ${recordsByBlockTag[blockTag].length > 1 ? 'lg:col-span-2' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-gray-900">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {blockTag}
                    </h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                      {recordsByBlockTag[blockTag].length} {recordsByBlockTag[blockTag].length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className={`grid grid-cols-1 gap-4 ${recordsByBlockTag[blockTag].length > 1 ? 'lg:grid-cols-2' : ''}`}>
                    {recordsByBlockTag[blockTag].map((record, index) => (
                      <article
                        key={`${record.id || record.ID || activeGroup.date || blockTag}-${index}`}
                        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50/80 px-5 py-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-blue-700">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <CreditFactorIcon name="account" size={14} />
                            </span>
                            <span className="break-words">{record.Account_Name || '-'}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <CreditFactorIcon name="note" size={14} />
                            </span>
                            <span className="break-words">{record.Update_Comment || '-'}</span>
                          </p>
                        </div>

                        <div className="mt-4 space-y-2 text-sm leading-6 text-gray-700">
                          {record.Detail_Comment_1 && (
                            <p className="rounded-xl bg-white/80 px-3 py-2">{record.Detail_Comment_1}</p>
                          )}
                          {record.Detail_Comment_2 && (
                            <p className="rounded-xl bg-white/80 px-3 py-2 ">{record.Detail_Comment_2}</p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
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
