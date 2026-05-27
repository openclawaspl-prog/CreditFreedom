const { useEffect, useMemo, useState } = React;
const { FilterBar, StatCard, StatusGroup } = window.DashboardUI || {};

const MODULE_API_NAME = 'Dispute_Submit_Statuses';
const DATE_FIELD_API_NAME = 'Date';

const SUMMARY_CARDS = [
  { key: 'Total_Bot_Count', label: 'Total Bot Count', accent: '#0ea5e9', icon: 'bot' },
  { key: 'Total_Success_Payment', label: 'Total Success Payment', accent: '#10b981', icon: 'payment' },
  { key: 'Total_Pick_for_auto_Bot', label: 'Total Pick for Auto Bot', accent: '#f97316', icon: 'pick' },
  { key: 'Total_Import_Now', label: 'Total Import Now', accent: '#8b5cf6', icon: 'import' },
];

const GROUP_DEFS = [
  {
    title: 'Import Submit',
    icon: 'submit',
    totalKey: 'Total_Import_Submit',
    inprogressKey: 'Total_Import_Submit_Inprogress',
    inprogressPctKey: 'Total_Import_Submit_Inprogress_Percentage',
    successKey: 'Total_Import_Submit_Success',
    successPctKey: 'Total_Import_Submit_Success_Percentage',
    failedKey: 'Total_Import_Submit_Failed',
    failedPctKey: 'Total_Import_Submit_Failed_Percentage',
  },
  {
    title: 'Auto Print',
    icon: 'print',
    totalKey: 'Total_Auto_Print',
    inprogressKey: 'Total_Auto_Print_Inprogress',
    inprogressPctKey: 'Total_Auto_Print_Inprogress_Percentage',
    successKey: 'Total_Auto_Print_Success',
    successPctKey: 'Total_Auto_Print_Success_Percentage',
    failedKey: 'Total_Auto_Print_Failed',
    failedPctKey: 'Total_Auto_Print_Failed_Percentage',
  },
  {
    title: 'Equifax Import',
    icon: 'equifax',
    totalKey: 'Total_Equifax',
    inprogressKey: 'Total_Equifax_Inprogress',
    inprogressPctKey: 'Total_Equifax_Inprogress_Percentage',
    successKey: 'Total_Equifax_Success',
    successPctKey: 'Total_Equifax_Success_Percentage',
    failedKey: 'Total_Equifax_Failed',
    failedPctKey: 'Total_Equifax_Failed_Percentage',
  },
  {
    title: 'Equifax Dispute',
    icon: 'alert',
    totalKey: 'Total_Equifax_Dispute',
    inprogressKey: 'Total_Equifax_Dispute_Inprogress',
    inprogressPctKey: 'Total_Equifax_Dispute_Inprogress_Percentage',
    successKey: 'Total_Equifax_Dispute_Success',
    successPctKey: 'Total_Equifax_Dispute_Success_Percentage',
    failedKey: 'Total_Equifax_Dispute_Failed',
    failedPctKey: 'Total_Equifax_Dispute_Failed_Percentage',
  },
  {
    title: 'TransUnion Import',
    icon: 'transunion',
    totalKey: 'Total_Import_Transunion',
    inprogressKey: 'Total_Import_Transunion_Inprogress',
    inprogressPctKey: 'Total_Import_Transunion_Inprogress_Percentage',
    successKey: 'Total_Import_Transunion_Success',
    successPctKey: 'Total_Import_Transunion_Success_Percentage',
    failedKey: 'Total_Import_Transunion_Failed',
    failedPctKey: 'Total_Import_Transunion_Failed_Percentage',
  },
  {
    title: 'TransUnion Dispute',
    icon: 'alert',
    totalKey: 'Total_Transunion_Despute',
    inprogressKey: 'Total_Transunion_Despute_Inprogress',
    inprogressPctKey: 'Total_Transunion_Despute_Inprogress_Percentage',
    successKey: 'Total_Transunion_Despute_Success',
    successPctKey: 'Total_Transunion_Despute_Success_Percentage',
    failedKey: 'Total_Transunion_Despute_Failed',
    failedPctKey: 'Total_Transunion_Despute_Failed_Percentage',
  },
  {
    title: 'Experian Import',
    icon: 'experian',
    totalKey: 'Total_Import_Experian',
    inprogressKey: 'Total_Import_Experian_Inprogress',
    inprogressPctKey: 'Total_Import_Experian_Inprogress_Percentage',
    successKey: 'Total_Import_Experian_Success',
    successPctKey: 'Total_Import_Experian_Success_Percentage',
    failedKey: 'Total_Import_Experian_Failed',
    failedPctKey: 'Total_Import_Experian_Failed_Percentage1',
  },
  {
    title: 'Experian Dispute',
    icon: 'alert',
    totalKey: 'Total_Experian_Dispute',
    inprogressKey: 'Total_Experian_Dispute_Inprogress',
    inprogressPctKey: 'Total_Experian_Dispute_Inprogress_Percentage',
    successKey: 'Total_Experian_Dispute_Success',
    successPctKey: 'Total_Experian_Dispute_Success_Percentage',
    failedKey: 'Total_Experian_Dispute_Failed',
    failedPctKey: 'Total_Experian_Dispute_Failed_Percentage',
  },
];

function waitForZohoSdk(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tick() {
      if (window.ZOHO && window.ZOHO.embeddedApp) return resolve(window.ZOHO);
      if (Date.now() - start > timeoutMs) return reject(new Error('ZOHO SDK not ready'));
      setTimeout(tick, 120);
    }
    tick();
  });
}

function extractZohoError(resp) {
  const data0 = resp && resp.data && resp.data[0];
  if (data0 && data0.status === 'error') return data0;
  if (resp && resp.status === 'error') return resp;
  return null;
}

function formatZohoError(err) {
  if (!err) return 'Unknown error.';
  if (typeof err === 'string') return err;
  if (err.code || err.message || err.details) {
    const parts = [];
    if (err.code) parts.push(String(err.code));
    if (err.message) parts.push(String(err.message));
    if (err.details) {
      try { parts.push(JSON.stringify(err.details)); } catch {}
    }
    return parts.join(' | ') || 'Unknown error.';
  }
  try { return JSON.stringify(err); } catch { return 'Unknown error.'; }
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toPercent(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function useDynamicHeight() {
  useEffect(() => {
    let timer;
    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const root = document.getElementById('root');
        if (!root) return;
        const bodyStyle = window.getComputedStyle(document.body);
        const paddingTop = parseFloat(bodyStyle.paddingTop || 0);
        const paddingBottom = parseFloat(bodyStyle.paddingBottom || 0);
        const measured = Math.max(root.scrollHeight, root.offsetHeight, root.getBoundingClientRect().height);
        const height = Math.ceil(measured + paddingTop + paddingBottom + 40);
        if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
          window.ZOHO.CRM.UI.Resize({ height: String(height), width: '0' });
        }
      }, 120);
    }
    const observer = new ResizeObserver(sendResize);
    const root = document.getElementById('root');
    if (root) observer.observe(root);
    sendResize();
    window.addEventListener('resize', sendResize);
    window.addEventListener('load', sendResize);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', sendResize);
      window.removeEventListener('load', sendResize);
    };
  }, []);
}

function escapeCriteriaValue(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\)/g, '\\)');
}

function buildDateCriteria(filters) {
  const criteria = [`(${DATE_FIELD_API_NAME}:equals:${escapeCriteriaValue(filters.date)})`];
  if (filters.provider && filters.provider !== 'All') {
    criteria.push(`(Creditor:equals:${escapeCriteriaValue(filters.provider)})`);
  }
  if (filters.accountType && filters.accountType !== 'All') {
    criteria.push(`(Account_Type:equals:${escapeCriteriaValue(filters.accountType)})`);
  }
  return criteria.length === 1 ? criteria[0] : criteria.join('and');
}

async function fetchRecordByDate(zoho, filters) {
  const resp = await zoho.CRM.API.searchRecord({
    Entity: MODULE_API_NAME,
    Type: 'criteria',
    Query: buildDateCriteria(filters),
  });
  const err = extractZohoError(resp);
  if (err) throw err;
  return resp && resp.data && resp.data[0] ? resp.data[0] : null;
}

function mapSummary(data) {
  const numberFormat = new Intl.NumberFormat('en-US');
  return SUMMARY_CARDS.map((item) => ({
    title: item.label,
    value: numberFormat.format(toNumber(data && data[item.key])),
    accent: item.accent,
    icon: item.icon,
  }));
}

function mapGroups(data) {
  const numberFormat = new Intl.NumberFormat('en-US');
  return GROUP_DEFS.map((group) => ({
    title: group.title,
    icon: group.icon,
    total: numberFormat.format(toNumber(data && data[group.totalKey])),
    rows: [
      {
        label: 'In progress',
        value: numberFormat.format(toNumber(data && data[group.inprogressKey])),
        percent: toPercent(data && data[group.inprogressPctKey]),
        tone: 'info',
      },
      {
        label: 'Success',
        value: numberFormat.format(toNumber(data && data[group.successKey])),
        percent: toPercent(data && data[group.successPctKey]),
        tone: 'success',
      },
      {
        label: 'Failed',
        value: numberFormat.format(toNumber(data && data[group.failedKey])),
        percent: toPercent(data && data[group.failedPctKey]),
        tone: 'danger',
      },
    ],
  }));
}

function App() {
  const [zohoClient, setZohoClient] = useState(null);
  const [record, setRecord] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ provider: 'All', date: '', accountType: 'All' });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useDynamicHeight();

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        const zoho = await waitForZohoSdk();
        setZohoClient(zoho);
        zoho.embeddedApp.on('PageLoad', () => {
          if (!alive) return;
          setError('');
        });
        zoho.embeddedApp.init();
      } catch (err) {
        if (!alive) return;
        setError(formatZohoError(err));
        setLoading(false);
        setRecord({});
      }
    }

    init();
    return () => { alive = false; };
  }, []);

  const summaryCards = useMemo(() => mapSummary(record), [record]);
  const groupCards = useMemo(() => mapGroups(record), [record]);

  async function handleSubmit(nextFilters) {
    setFilters(nextFilters);
    setHasSubmitted(true);
    setError('');

    if (!nextFilters.date) {
      setRecord({});
      setError('Please select a date before submitting.');
      return;
    }

    if (!zohoClient) {
      setRecord({});
      setError('Zoho SDK is not ready yet. Please try again in a moment.');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchRecordByDate(zohoClient, nextFilters);
      setRecord(data || {});
      if (!data) setError('No KPI record was found for the selected date.');
    } catch (err) {
      setRecord({});
      setError(formatZohoError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFilters({ provider: 'All', date: '', accountType: 'All' });
    setRecord({});
    setError('');
    setHasSubmitted(false);
  }

  return (
    <div className="app-shell">
      <FilterBar
        initialFilters={filters}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      {error ? (
        <div className="error-card">
          <p className="error-title">Unable to load data</p>
          <p className="error-body">{error}</p>
        </div>
      ) : null}

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            accent={card.accent}
            subtitle={loading ? 'Loading...' : hasSubmitted ? 'Updated just now' : 'Select a date'}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="status-grid">
        {groupCards.map((group) => (
          <StatusGroup
            key={group.title}
            {...group}
            subtitle={loading ? 'Loading...' : hasSubmitted ? 'Updated just now' : 'Select a date'}
          />
        ))}
      </section>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
