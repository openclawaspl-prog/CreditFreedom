function DisputeDetailsCard({
  provider,
  providerOptions,
  disputeDate,
  onProviderChange,
  onDisputeDateChange,
  onSubmit,
}) {
  return (
    <section className="relative z-10 overflow-visible bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Dispute Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div>
          <CreditFactorDropdown
            label="Select Any Provider"
            value={provider}
            onChange={onProviderChange}
            options={providerOptions}
            placeholder="Select"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Select Any Date</label>
          <input
            type="date"
            value={disputeDate}
            onChange={(event) => onDisputeDateChange(event.target.value)}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700"
          />
        </div>
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

window.DisputeDetailsCard = DisputeDetailsCard;
