const { useEffect: useTplEffect, useState: useTplState } = React;

const MONTH_TEMPLATE_FIELDS = {
  1: 'Month_1',
  2: 'Month_2',
  3: 'Month_3',
};

function toTemplateBool(value) {
  return value === true || value === 'true' || value === 'True' || value === 1 || value === '1';
}

function MessageTemplatesCard() {
  const [state, setState] = useTplState({ 1: false, 2: false, 3: false });
  const [recordId, setRecordId] = useTplState('');
  const [loading, setLoading] = useTplState(true);
  const [saving, setSaving] = useTplState({});
  const [error, setError] = useTplState('');

  useTplEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const id = data && data.EntityId;
      setRecordId(id || '');
      setLoading(true);
      setError('');

      if (!id || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.getRecord) {
        setLoading(false);
        window.OverviewWidget.requestResize();
        return;
      }

      ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: id })
        .then((res) => {
          const record = res && res.data && res.data[0];
          const month1 = toTemplateBool(record && record.Month_1);
          const month2 = toTemplateBool(record && record.Month_2);
          const month3 = toTemplateBool(record && record.Month_3);

          setState({
            1: month1 || month2 || month3,
            2: month2 || month3,
            3: month3,
          });
        })
        .catch(() => {
          setError('Failed to load template updates.');
          setState({ 1: false, 2: false, 3: false });
        })
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  function isEnabled(n) {
    return n === 1 || state[n - 1];
  }

  function updateMonth(n) {
    if (!recordId || loading || saving[n] || !isEnabled(n) || state[n]) return;
    if (!window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.updateRecord) {
      setError('Template update is not available.');
      return;
    }

    const previousState = state;
    setSaving((prev) => ({ ...prev, [n]: true }));
    setError('');
    setState((prev) => {
      const next = { ...prev };
      for (let month = 1; month <= n; month++) next[month] = true;
      return next;
    });

    ZOHO.CRM.API.updateRecord({
      Entity: 'Contacts',
      APIData: {
        id: recordId,
        [MONTH_TEMPLATE_FIELDS[n]]: true,
      },
      Trigger: ['workflow'],
    })
      .catch(() => {
        setState(previousState);
        setError(`Failed to update Month ${n}.`);
      })
      .finally(() => {
        setSaving((prev) => ({ ...prev, [n]: false }));
        window.OverviewWidget.requestResize();
      });
  }

  return (
    <div className="flex min-h-[205px] flex-col bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Auto Signup</h2>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      <div className="flex flex-1 flex-col justify-center space-y-3">
        {[1, 2, 3].map((n) => {
          const enabled = isEnabled(n);
          const updated = state[n];
          const isSaving = Boolean(saving[n]);

          return (
            <div key={n} className="grid w-full grid-cols-[78px_minmax(0,1fr)] items-center gap-3">
              <p className="text-sm font-medium text-gray-500">Month {n}</p>
              <button
                type="button"
                disabled={loading || !enabled || updated || isSaving}
                onClick={() => updateMonth(n)}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                  updated
                    ? 'bg-indigo-600 text-white cursor-default'
                    : enabled && !loading
                      ? 'bg-white border border-gray-200 hover:bg-gray-100 text-gray-700'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {updated ? 'Updated' : isSaving ? 'Updating...' : 'Update'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.MessageTemplatesCard = MessageTemplatesCard;
