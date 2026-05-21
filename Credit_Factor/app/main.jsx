const { useEffect: useResizeEffect, useState: useCreditFactorState, useEffect: useCreditFactorEffect } = React;

const CREDIT_FACTOR_BUREAUS = ['Equifax', 'Experian', 'TransUnion'];
const CREDIT_UPDATE_BUREAUS = ['Equifax', 'TransUnion'];
const CHANGE_TYPES = ['All', 'Updated or Removed'];
const CREDIT_FACTOR_MODULE = 'Credit_Factor';
const CREDIT_UPDATE_DATA_MODULE = 'credit_update_data';

window.CreditFactorWidget = window.CreditFactorWidget || {
  requestResize() {},
  setDropdownSpace() {},
};

const DEFAULT_CREDIT_FACTOR_STATS = [
  {
    title: 'Hard Inquiries',
    value: '-',
    badgeValue: '-',
    note: "Number of times you've applied for credit",
  },
  {
    title: 'Total Accounts',
    value: '-',
    badgeValue: '-',
    note: 'Total open and close accounts',
  },
  {
    title: 'Credit Age',
    value: '-',
    badgeValue: '-',
    note: 'Average age of your open accounts',
  },
  {
    title: 'Derogatory marks',
    value: '-',
    badgeValue: '-',
    note: 'Collection, tax liens, bankruptcies or civil judgments on your report',
  },
  {
    title: 'Credit card use',
    value: '-',
    badgeValue: '-',
    note: "How much credit you're using compared to your total limits",
  },
  {
    title: 'Payment history',
    value: '-',
    badgeValue: '-',
    note: "Percentage of payments you've made on time",
  },
];

function getPageEntityId(pageData) {
  if (!pageData) return '';
  const raw = pageData.EntityId || pageData.EntityID || pageData.entityId || pageData.EntityIds;
  if (Array.isArray(raw)) return raw[0] || '';
  if (raw && typeof raw === 'object') return raw.id || raw.ID || raw.record_id || '';
  return raw ? String(raw) : '';
}

function creditFactorStr(value) {
  if (value == null) return '';
  if (typeof value === 'object') return value.display_value || value.name || value.Name || value.value || '';
  return String(value);
}

function creditFactorNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function creditFactorDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function normalizeProvider(value) {
  return creditFactorStr(value).trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function normalizeUpdateBureau(record) {
  const candidates = [record && record.Block_Tag, record && record.Provider, record && record.Bureau, record && record.Credit_Bureau];
  for (const candidate of candidates) {
    const value = normalizeProvider(candidate);
    if (!value) continue;
    if (value.includes('equifax')) return 'Equifax';
    if (value.includes('transunion')) return 'TransUnion';
    if (value.includes('experian')) return 'Experian';
  }
  return '';
}

function getRecordDate(record) {
  return creditFactorDate(record.Credit_Factor_Date || record.Date || record.Created_Time || record.Modified_Time);
}

function getUpdateRecordDate(record) {
  return creditFactorDate(record.Created_Date || record.Created_Time || record.Modified_Time);
}

function formatUpdateDateLabel(dateValue) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function latestText(records, field) {
  const found = records.find((record) => creditFactorStr(record[field]));
  return found ? creditFactorStr(found[field]) : '-';
}

function sumField(records, field) {
  if (!records.length) return '-';
  return String(records.reduce((total, record) => total + creditFactorNumber(record[field]), 0));
}

function buildCreditFactorStats(records) {
  if (!records.length) return DEFAULT_CREDIT_FACTOR_STATS;

  return [
    {
      title: 'Hard Inquiries',
      value: sumField(records, 'Hard_Inquiries'),
      note: "Number of times you've applied for credit",
    },
    {
      title: 'Total Accounts',
      value: sumField(records, 'Total_Accounts'),
      note: 'Total open and close accounts',
    },
    {
      title: 'Credit Age',
      value: latestText(records, 'Credit_Age'),
      note: 'Average age of your open accounts',
    },
    {
      title: 'Derogatory marks',
      value: latestText(records, 'Derogatory_marks'),
      note: 'Collection, tax liens, bankruptcies or civil judgments on your report',
    },
    {
      title: 'Credit card use',
      value: sumField(records, 'Credit_Card_Use'),
      note: "How much credit you're using compared to your total limits",
    },
    {
      title: 'Payment history',
      value: latestText(records, 'Payment_History'),
      note: "Percentage of payments you've made on time",
    },
  ];
}

function filterCreditFactorRecords(records, provider, date) {
  return records.filter((record) => {
    const providerMatches = !provider || normalizeProvider(record.Provider) === normalizeProvider(provider);
    const dateMatches = !date || getRecordDate(record) === date;
    return providerMatches && dateMatches;
  });
}

function groupCreditUpdateRecords(records) {
  const grouped = {};

  (records || []).forEach((record) => {
    const bureau = normalizeUpdateBureau(record);
    const date = getUpdateRecordDate(record);
    if (!bureau || !date) return;

    if (!grouped[bureau]) grouped[bureau] = {};
    if (!grouped[bureau][date]) grouped[bureau][date] = [];
    grouped[bureau][date].push(record);
  });

  return grouped;
}

function getChangeTone(record) {
  const color = creditFactorStr(record && record.Color_Code).trim().toLowerCase();
  const tag = creditFactorStr(record && record.Block_Tag).trim().toLowerCase();
  if (color.includes('green') || /positive|resolved|paid|removed|decrease|good/.test(tag)) return 'positive';
  if (color.includes('red') || /late|negative|delin|balance increase|charge|collection|hard inquiry/.test(tag)) return 'negative';
  return 'neutral';
}

function getChangeStatus(record) {
  const tag = creditFactorStr(record && record.Block_Tag).trim().toLowerCase();
  const updateComment = creditFactorStr(record && record.Update_Comment).trim().toLowerCase();
  return /removed|remove|deleted|delete/.test(`${tag} ${updateComment}`) ? 'Removed' : 'Updated';
}

async function fetchCreditFactorsByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) return [];

  const all = [];
  const perPage = 200;
  const query = `(Client_Id:equals:${clientId})`;

  for (let page = 1; page <= 10; page++) {
    const resp = await ZOHO.CRM.API.searchRecord(
      {
        Entity: CREDIT_FACTOR_MODULE,
        Type: 'criteria',
        Query: query,
      },
      page,
      perPage
    );

    const data = (resp && resp.data) || [];
    all.push(...data);

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  return all;
}

async function fetchCreditUpdateDataByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) return [];

  const all = [];
  const perPage = 200;
  const query = `(Client:equals:${clientId})`;

  for (let page = 1; page <= 10; page++) {
    const resp = await ZOHO.CRM.API.searchRecord(
      {
        Entity: CREDIT_UPDATE_DATA_MODULE,
        Type: 'criteria',
        Query: query,
      },
      page,
      perPage
    );

    const data = (resp && resp.data) || [];
    all.push(...data);

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  return all;
}

function waitForZohoSdk() {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (window.ZOHO && window.ZOHO.embeddedApp) {
        resolve(window.ZOHO);
        return;
      }
      if (Date.now() - startedAt > 5000) {
        resolve(null);
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

function useZohoResize() {
  useResizeEffect(() => {
    let timer;
    const settleTimers = [];

    function measureHeight() {
      const root = document.getElementById('root');
      if (!root) return;

      const bodyStyle = window.getComputedStyle(document.body);
      const paddingTop = parseFloat(bodyStyle.paddingTop || 0);
      const paddingBottom = parseFloat(bodyStyle.paddingBottom || 0);
      const rootRect = root.getBoundingClientRect();
      const measuredRootHeight = Math.max(
        root.scrollHeight,
        root.offsetHeight,
        rootRect.height
      );
      const h = Math.ceil(measuredRootHeight + paddingTop + paddingBottom + 40);

      if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
        window.ZOHO.CRM.UI.Resize({ height: String(h), width: '0' });
      }
    }

    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(measureHeight, 150);
    }

    window.CreditFactorWidget.requestResize = sendResize;

    function burstResize() {
      sendResize();
      requestAnimationFrame(sendResize);
      [300, 800, 1500, 3000].forEach((delay) => {
        settleTimers.push(setTimeout(sendResize, delay));
      });
    }

    const observer = new ResizeObserver(sendResize);
    const root = document.getElementById('root');
    if (root) observer.observe(root);

    waitForZohoSdk().then(() => {
      burstResize();
    });

    burstResize();
    window.addEventListener('resize', sendResize);
    window.addEventListener('load', burstResize);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      settleTimers.forEach(clearTimeout);
      window.removeEventListener('resize', sendResize);
      window.removeEventListener('load', burstResize);
      window.CreditFactorWidget.requestResize = function () {};
    };
  }, []);
}

function useZohoPageLoad(onPageLoad) {
  useResizeEffect(() => {
    let cancelled = false;

    waitForZohoSdk().then((zoho) => {
      if (cancelled || !zoho || !zoho.embeddedApp) return;

      zoho.embeddedApp.on('PageLoad', (data) => {
        onPageLoad(data);
      });
      zoho.embeddedApp.init();
    });

    return () => {
      cancelled = true;
    };
  }, []);
}

const RootApp = () => {
  useZohoResize();
  const [dropdownSpace, setDropdownSpace] = useCreditFactorState(0);
  const [reportProvider, setReportProvider] = useCreditFactorState(CREDIT_FACTOR_BUREAUS[0]);
  const [appliedProvider, setAppliedProvider] = useCreditFactorState(CREDIT_FACTOR_BUREAUS[0]);
  const [reportDate, setReportDate] = useCreditFactorState('');
  const [appliedDate, setAppliedDate] = useCreditFactorState('');
  const [records, setRecords] = useCreditFactorState([]);
  const [loading, setLoading] = useCreditFactorState(true);
  const [error, setError] = useCreditFactorState('');
  const [changeType, setChangeType] = useCreditFactorState('All');
  const [changeBureau, setChangeBureau] = useCreditFactorState(CREDIT_FACTOR_BUREAUS[0]);
  const [changeDate, setChangeDate] = useCreditFactorState('2021-12-28');
  const [creditUpdateRecords, setCreditUpdateRecords] = useCreditFactorState([]);
  const [selectedChangeGroup, setSelectedChangeGroup] = useCreditFactorState(null);
  const [showChangeCards, setShowChangeCards] = useCreditFactorState(false);
  const [disputeProvider, setDisputeProvider] = useCreditFactorState(CREDIT_FACTOR_BUREAUS[0]);
  const [disputeDate, setDisputeDate] = useCreditFactorState('');

  useZohoPageLoad((pageData) => {
    const clientId = getPageEntityId(pageData);
    setLoading(true);
    setError('');

    Promise.allSettled([
      fetchCreditFactorsByClientId(clientId),
      fetchCreditUpdateDataByClientId(clientId),
    ])
      .then(([factorResult, updateResult]) => {
        if (factorResult.status === 'fulfilled') {
          setRecords(factorResult.value);
        } else {
          setRecords([]);
          setError('Failed to load credit factor data.');
        }

        if (updateResult.status === 'fulfilled') {
          setCreditUpdateRecords(updateResult.value);
        } else {
          setCreditUpdateRecords([]);
        }
      })
      .finally(() => {
        setLoading(false);
        window.CreditFactorWidget?.requestResize?.();
      });
  });

  const filteredRecords = filterCreditFactorRecords(records, appliedProvider, appliedDate);
  const stats = buildCreditFactorStats(filteredRecords);
  const creditUpdateGroups = groupCreditUpdateRecords(creditUpdateRecords);
  const activeChangeBureau = CREDIT_UPDATE_BUREAUS.includes(changeBureau)
    ? changeBureau
    : CREDIT_UPDATE_BUREAUS[0];
  const changeDateOptions = activeChangeBureau
    ? Object.keys(creditUpdateGroups[activeChangeBureau] || {}).sort((a, b) => b.localeCompare(a))
    : [];
  const activeChangeDate = changeDateOptions.includes(changeDate)
    ? changeDate
    : changeDateOptions[0] || '';
  const activeChangeRecords = activeChangeBureau && activeChangeDate
    ? (creditUpdateGroups[activeChangeBureau] && creditUpdateGroups[activeChangeBureau][activeChangeDate]) || []
    : [];
  const filteredChangeRecords = activeChangeRecords.filter((record) => {
    if (changeType === 'All') return true;
    return getChangeStatus(record) === changeType;
  });

  useCreditFactorEffect(() => {
    if (!CREDIT_UPDATE_BUREAUS.includes(changeBureau)) {
      setChangeBureau(CREDIT_UPDATE_BUREAUS[0]);
    }
  }, [changeBureau]);

  useCreditFactorEffect(() => {
    if (changeDateOptions.length && !changeDateOptions.includes(changeDate)) {
      setChangeDate(changeDateOptions[0]);
    }
  }, [changeDateOptions.join('|'), changeDate]);

  function submitReport() {
    setAppliedProvider(reportProvider);
    setAppliedDate(reportDate);
    window.CreditFactorWidget?.requestResize?.();
  }

  function submitChanges() {
    setSelectedChangeGroup({
      bureau: activeChangeBureau,
      date: activeChangeDate,
      records: filteredChangeRecords,
    });
    setShowChangeCards(false);
    window.CreditFactorWidget?.requestResize?.();
  }

  function toggleChangeCards() {
    setShowChangeCards((prev) => !prev);
    window.CreditFactorWidget?.requestResize?.();
  }

  function submitDispute() {
    window.CreditFactorWidget?.requestResize?.();
  }

  window.CreditFactorWidget.setDropdownSpace = function (space) {
    setDropdownSpace(space);
    window.CreditFactorWidget?.requestResize?.();
  };

  return (
    <div
      className="w-full"
      style={{ paddingBottom: dropdownSpace ? `${dropdownSpace}px` : undefined }}
    >
      <div className="w-full space-y-5">
        <CreditFactorCard
          provider={reportProvider}
          providerOptions={CREDIT_FACTOR_BUREAUS}
          reportDate={reportDate}
          stats={stats}
          loading={loading}
          error={error}
          recordCount={filteredRecords.length}
          onProviderChange={setReportProvider}
          onReportDateChange={setReportDate}
          onSubmit={submitReport}
        />

        <WhatsChangedCard
          changeType={changeType}
          changeTypeOptions={CHANGE_TYPES}
          changeBureau={activeChangeBureau}
          bureauOptions={CREDIT_UPDATE_BUREAUS}
          changeDate={activeChangeDate}
          changeDateOptions={changeDateOptions.map((date) => ({
            label: formatUpdateDateLabel(date),
            value: date,
          }))}
          onChangeTypeChange={(value) => {
            setChangeType(value);
            setSelectedChangeGroup(null);
            setShowChangeCards(false);
          }}
          onChangeBureauChange={(bureau) => {
            setChangeBureau(bureau);
            const bureauDates = Object.keys(creditUpdateGroups[bureau] || {}).sort((a, b) => b.localeCompare(a));
            setChangeDate(bureauDates[0] || '');
            setSelectedChangeGroup(null);
            setShowChangeCards(false);
          }}
          onChangeDateChange={(date) => {
            setChangeDate(date);
            setSelectedChangeGroup(null);
            setShowChangeCards(false);
          }}
          onSubmit={submitChanges}
          selectedChangeGroup={selectedChangeGroup}
          selectedChangeRecords={filteredChangeRecords}
          showChangeCards={showChangeCards}
          onToggleChangeCards={toggleChangeCards}
        />

        <DisputeDetailsCard
          provider={disputeProvider}
          providerOptions={CREDIT_FACTOR_BUREAUS}
          disputeDate={disputeDate}
          onProviderChange={setDisputeProvider}
          onDisputeDateChange={setDisputeDate}
          onSubmit={submitDispute}
        />

        <footer className="text-center text-xs text-gray-500 py-2">
          Powered by Credit Freedom & Restoration Corp
        </footer>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<RootApp />);
