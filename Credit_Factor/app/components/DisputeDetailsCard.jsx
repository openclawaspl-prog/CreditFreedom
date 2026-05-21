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
    { key: 'File_Id1', label: 'File ID', className: 'w-[150px] min-w-[150px] whitespace-nowrap' },
    { key: 'Account_Name', label: 'Account Name', className: 'w-[190px] min-w-[190px] whitespace-normal' },
    { key: 'Account_Number', label: 'Account Number', className: 'w-[190px] min-w-[190px] whitespace-nowrap' },
    { key: 'Report_Created_On', label: 'Report Created On', className: 'w-[135px] min-w-[135px] whitespace-normal' },
    { key: 'Date_Opened', label: 'Date Opened', className: 'w-[130px] min-w-[130px] whitespace-normal' },
    { key: 'Result_Text', label: 'Result Text', className: 'min-w-[520px] whitespace-normal' },
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
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Dispute Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div>
          <CreditFactorDropdown
            label="Select Any Provider"
            value={provider}
            onChange={onProviderChange}
            options={providerOptions}
            placeholder="Select Creditor"
          />
        </div>
        <div>
          <CreditFactorDropdown
            label="Select Any Date"
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
          Submit
        </button>
      </div>

      {hasSubmitted && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {rows.length ? (
            <div className="overflow-auto max-h-[288px]">
              <table className="w-full min-w-[1320px] table-fixed border-collapse text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={`border border-gray-200 px-3 py-3 text-left text-sm font-semibold text-gray-800 align-middle ${column.className}`}
                      >
                        {column.label}
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
                          className={`border border-gray-200 px-3 py-3 leading-6 text-gray-900 align-top ${column.className}`}
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
