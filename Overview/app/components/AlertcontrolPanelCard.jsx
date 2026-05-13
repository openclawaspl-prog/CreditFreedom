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
  { label: 'Name Alert', api: 'Name_Alert' },
];

function toBool(value) {
  return value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === 1;
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Alert Control Panel</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELD_DEFS.map((field) => (
          <div key={field.api} className="bg-gray-100 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-700">{field.label}</span>
            <ToggleSwitch
              checked={!!values[field.api]}
              disabled={loading || !!saving[field.api]}
              onChange={(checked) => updateField(field.api, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

window.AlertcontrolPanelCard = AlertcontrolPanelCard;
