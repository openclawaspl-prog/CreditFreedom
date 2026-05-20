function WhatsChangedCard({
  changeType,
  changeTypeOptions,
  changeBureau,
  bureauOptions,
  changeDate,
  onChangeTypeChange,
  onChangeBureauChange,
  onChangeDateChange,
  onSubmit,
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 px-6 py-5">
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
        <input
          type="date"
          value={changeDate}
          onChange={(event) => onChangeDateChange(event.target.value)}
          className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="h-10 px-5 rounded-lg bg-indigo-900 text-white text-sm font-semibold"
        >
          Submit
        </button>
      </div>
    </section>
  );
}

window.WhatsChangedCard = WhatsChangedCard;
