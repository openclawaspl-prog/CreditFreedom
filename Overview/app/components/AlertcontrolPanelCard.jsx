const { useEffect, useState } = React;

const FIELD_DEFS = [
  { label: 'Portal User', api: 'Portal_User' },
  { label: 'Interested', api: 'Interested' },
  { label: 'PAY AS YOU GO', api: 'PAY_AS_YOU_GO' },
  { label: 'PAID IN FULL', api: 'PAID_IN_FULL' },
  { label: 'Clients Cancelled', api: 'Clients_Cancelled' },
  { label: 'Pushed out Payments', api: 'Pushed_out_Payments' },
  { label: 'Secure Credit Card Needed', api: 'Secure_Credit_Card_Needed' },
  { label: 'CANADA Client', api: 'CANADA_Client' },
  { label: 'BILLING ISSUE', api: 'BILLING_ISSUE' },
  { label: 'INTERESTED IN BUSINESS CREDIT', api: 'INTERESTED_IN_BUSINESS_CREDIT' },
  { label: 'Business Credit Client', api: 'Business_Credit_Client' },
  { label: 'Canada Credit Cards', api: 'Canada_Credit_Cards' },
  { label: 'Get 3 Open Accounts Needed', api: 'Get_3_Open_Accounts_Needed' },
  { label: 'Possible Restart', api: 'Possible_Restart' },
  { label: 'Transunion Issue', api: 'Transunion_Issue' },
  { label: 'Social Security Card', api: 'Social_Security_Card' },
  { label: 'Address Verification', api: 'Address_Verification' },
  { label: 'Credit Karma Login', api: 'Credit_Karma_Login' },
  { label: 'Free CrediScore Login', api: 'Free_CrediScore_Login' },
  { label: 'KOVO', api: 'KOVO' },
  { label: 'Unsecure Credit Card', api: 'Unsecure_Credit_Card' },
  { label: 'Restarted', api: 'Restarted' },
  { label: 'Name Alert', api: 'Name_Alert' },
];

const BILLING_ISSUE_API = 'BILLING_ISSUE';
const BILLING_ISSUE_DATE_API = 'BILLING_ISSUE_DATE';
const RESTARTED_API = 'Restarted';
const RESTARTED_DATE_API = 'Restarted_Date';

function toBool(value) {
  return value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === 1;
}

function toDateInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => (!disabled ? onChange(!checked) : null)}
      aria-pressed={checked}
      aria-disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-indigo-700' : 'bg-gray-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function AlertcontrolPanelCard() {
  const [recordId, setRecordId] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const alertColumns = [
    FIELD_DEFS.filter((field) => field.api !== RESTARTED_API && field.api !== 'Name_Alert')
      .filter((_, index) => index % 2 === 0),
    FIELD_DEFS.filter((field) => field.api !== RESTARTED_API && field.api !== 'Name_Alert')
      .filter((_, index) => index % 2 === 1),
  ];
  const unsecureIndex = alertColumns[0].findIndex((field) => field.api === 'Unsecure_Credit_Card');
  if (unsecureIndex !== -1) {
    alertColumns[1].splice(unsecureIndex, 0, { label: 'Restarted', api: RESTARTED_API });
    alertColumns[1].splice(unsecureIndex + 1, 0, { label: 'Name Alert', api: 'Name_Alert' });
  }

  useEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const id = data.EntityId;
      setRecordId(id);
      setLoading(true);
      setError(null);

      ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: id })
        .then((res) => {
          const record = res.data?.[0];
          if (!record) {
            setError('Record not found.');
            return;
          }

          const nextValues = {};
          FIELD_DEFS.forEach((field) => {
            nextValues[field.api] = toBool(record[field.api]);
          });
          nextValues[BILLING_ISSUE_DATE_API] = toDateInputValue(record[BILLING_ISSUE_DATE_API]);
          nextValues[RESTARTED_DATE_API] = toDateInputValue(record[RESTARTED_DATE_API]);
          setValues(nextValues);
        })
        .catch(() => setError('Failed to load alert settings.'))
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  function updateField(apiName, nextValue) {
    if (!recordId) return;

    setValues((prev) => ({ ...prev, [apiName]: nextValue }));
    setSaving((prev) => ({ ...prev, [apiName]: true }));
    setError(null);

    ZOHO.CRM.API.updateRecord({
      Entity: 'Contacts',
      APIData: {
        id: recordId,
        [apiName]: nextValue,
      },
      Trigger: ['workflow'],
    })
      .then(() => {
        setSaving((prev) => ({ ...prev, [apiName]: false }));
      })
      .catch(() => {
        setSaving((prev) => ({ ...prev, [apiName]: false }));
        setValues((prev) => ({ ...prev, [apiName]: !nextValue }));
        setError('Failed to update alert settings.');
      });
  }

  function updateBillingIssueDate(nextDate) {
    updateDateField(BILLING_ISSUE_DATE_API, nextDate, 'Failed to update billing issue date.');
  }

  function updateRestartedDate(nextDate) {
    updateDateField(RESTARTED_DATE_API, nextDate, 'Failed to update restarted date.');
  }

  function updateDateField(apiName, nextDate, errorMessage) {
    if (!recordId) return;

    const previousDate = values[apiName] || '';
    setValues((prev) => ({ ...prev, [apiName]: nextDate }));
    setSaving((prev) => ({ ...prev, [apiName]: true }));
    setError(null);

    ZOHO.CRM.API.updateRecord({
      Entity: 'Contacts',
      APIData: {
        id: recordId,
        [apiName]: nextDate || null,
      },
      Trigger: ['workflow'],
    })
      .then(() => {
        setSaving((prev) => ({ ...prev, [apiName]: false }));
      })
      .catch(() => {
        setSaving((prev) => ({ ...prev, [apiName]: false }));
        setValues((prev) => ({ ...prev, [apiName]: previousDate }));
        setError(errorMessage);
      });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Alert Control Panel</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start">
        {alertColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-2.5">
            {column.map((field) => {
              const isBillingIssue = field.api === BILLING_ISSUE_API;
              const billingIssueOn = !!values[BILLING_ISSUE_API];
              const isRestarted = field.api === RESTARTED_API;
              const restartedOn = !!values[RESTARTED_API];

              return (
                <div key={field.api} className="min-h-[64px] rounded-lg bg-[#f1f3f5] px-3.5 py-3">
                  <div className="grid min-h-10 max-w-[270px] grid-cols-[minmax(0,1fr)_44px] items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{field.label}</span>
                    <ToggleSwitch
                      checked={!!values[field.api]}
                      disabled={loading || !!saving[field.api]}
                      onChange={(checked) => updateField(field.api, checked)}
                    />
                  </div>

                  {isBillingIssue && billingIssueOn && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Billing Issue Date
                      </label>
                      <input
                        type="date"
                        value={values[BILLING_ISSUE_DATE_API] || ''}
                        disabled={loading || !!saving[BILLING_ISSUE_DATE_API]}
                        onChange={(e) => updateBillingIssueDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                      />
                    </div>
                  )}

                  {isRestarted && restartedOn && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Restarted Date
                      </label>
                      <input
                        type="date"
                        value={values[RESTARTED_DATE_API] || ''}
                        disabled={loading || !!saving[RESTARTED_DATE_API]}
                        onChange={(e) => updateRestartedDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

window.AlertcontrolPanelCard = AlertcontrolPanelCard;
