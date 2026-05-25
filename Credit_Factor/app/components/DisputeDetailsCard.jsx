function DisputeDetailsCard({
  provider,
  providerOptions,
  disputeDate,
  disputeDateOptions,
  records,
  canSubmit,
  hasSubmitted,
  onProviderChange,
  onDisputeDateChange,
  onSubmit,
}) {
  const rows = Array.isArray(records) ? records : [];
  const columns = [
    { key: 'File_Id1', label: 'File ID', icon: 'file', className: 'w-[10%]' },
    { key: 'Account_Name', label: 'Account Name', icon: 'account', className: 'w-[14%]' },
    { key: 'Account_Number', label: 'Account Number', icon: 'id', className: 'w-[13%]' },
    { key: 'Report_Created_On', label: 'Report Created On', icon: 'calendar', className: 'w-[10%]' },
    { key: 'Date_Opened', label: 'Date Opened', icon: 'clock', className: 'w-[9%]' },
    { key: 'Result_Text', label: 'Result Text', icon: 'note', className: 'w-[44%]' },
  ];

  function cellValue(record, key) {
    const value = record && record[key];
    if (value == null || value === '') return '-';
    if (typeof value === 'object') {
      return value.display_value || value.name || value.Name || value.value || '-';
    }
    return String(value);
  }

  return (
    <section className="relative z-10 overflow-visible bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <CreditFactorIcon name="dispute" size={16} className="text-indigo-600" />
        Dispute Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div>
          <CreditFactorDropdown
            label="Select Any Provider"
            icon="bureau"
            value={provider}
            onChange={onProviderChange}
            options={providerOptions}
            placeholder="Select Creditor"
          />
        </div>
        <div>
          <CreditFactorDropdown
            label="Select Any Date"
            icon="calendar"
            value={disputeDate}
            onChange={onDisputeDateChange}
            options={disputeDateOptions}
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
          <span className="inline-flex items-center gap-1.5">
            <CreditFactorIcon name="send" size={14} />
          Submit
          </span>
        </button>
      </div>

      {hasSubmitted && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {rows.length ? (
            <div className="max-h-[288px] overflow-y-auto overflow-x-hidden">
              <table className="w-full table-fixed border-collapse text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={`break-words border border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-800 align-middle ${column.className}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <CreditFactorIcon name={column.icon} size={14} className="shrink-0 text-gray-400" />
                          {column.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {rows.map((record, rowIndex) => (
                    <tr key={record.id || record.ID || rowIndex} className="align-top">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`break-words border border-gray-200 px-3 py-3 leading-6 text-gray-900 align-top ${column.className}`}
                        >
                          {cellValue(record, column.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm font-semibold text-gray-800">No records found</div>
          )}
        </div>
      )}
    </section>
  );
}

window.DisputeDetailsCard = DisputeDetailsCard;
