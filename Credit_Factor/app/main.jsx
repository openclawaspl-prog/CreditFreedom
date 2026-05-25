const { useEffect: useResizeEffect, useState: useCreditFactorState, useEffect: useCreditFactorEffect } = React;

const CREDIT_FACTOR_BUREAUS = ['Equifax', 'Experian', 'TransUnion'];
const CREDIT_UPDATE_BUREAUS = ['Equifax', 'Transunion'];
const CHANGE_TYPES = ['All', 'Updated or Removed'];
const CREDIT_FACTOR_MODULE = 'Credit_Factor';
const CREDIT_UPDATE_DATA_MODULE = 'Account_Management';
const CLIENT_CREDIT_REPORTS_MODULE = 'Client_Credit_Reports';
const CHANGE_DEBUG_PREFIX = '[CreditFactor][WhatsChanged]';

console.log(`${CHANGE_DEBUG_PREFIX} main.jsx loaded`);

const existingCreditFactorWidget = window.CreditFactorWidget || {};
window.CreditFactorWidget = {
  ...existingCreditFactorWidget,
  pageData: existingCreditFactorWidget.pageData || null,
  listeners: existingCreditFactorWidget.listeners || new Set(),
  zohoInitialized: false,
  requestResize: existingCreditFactorWidget.requestResize || function () {},
  setDropdownSpace: existingCreditFactorWidget.setDropdownSpace || function () {},
  onPageLoad(callback) {
    this.listeners.add(callback);
    if (this.pageData) {
      setTimeout(() => callback(this.pageData), 0);
    }
    return () => this.listeners.delete(callback);
  },
  emitPageLoad(data) {
    this.pageData = data;
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorWidget emitPageLoad`, data);
    this.listeners.forEach((callback) => callback(data));
    this.requestResize();
  },
};

const DEFAULT_CREDIT_FACTOR_STATS = [
  {
    title: 'Hard Inquiries',
    value: '-',
    badgeValue: '-',
    note: "Tracks how often you've applied for new credit, which can temporarily impact your credit score.",
  },
  {
    title: 'Total Accounts',
    value: '-',
    badgeValue: '-',
    note: 'Shows the total number of credit accounts you’ve opened and maintained over time.',
  },
  {
    title: 'Credit Age',
    value: '-',
    badgeValue: '-',
    note: 'Measures the average age of your credit accounts, reflecting your credit history experience.',
  },
  {
    title: 'Derogatory marks',
    value: '-',
    badgeValue: '-',
    note: 'Highlights serious negative records such as collections, bankruptcies, tax liens, or legal judgments.',
  },
  {
    title: 'Credit card use',
    value: '-',
    badgeValue: '-',
    note: 'Indicates how much of your available credit limit you’re currently using across all cards.',
  },
  {
    title: 'Payment history',
    value: '-',
    badgeValue: '-',
    note: 'Represents your consistency in making payments on time, one of the biggest factors affecting your score.',
  },
];

function getPageEntityId(pageData) {
  if (!pageData) return '';
  const raw = pageData.EntityId || pageData.EntityID || pageData.entityId || pageData.EntityIds;
  if (Array.isArray(raw)) return raw[0] || '';
  if (raw && typeof raw === 'object') return raw.id || raw.ID || raw.record_id || '';
  return raw ? String(raw) : '';
}

function getPageEntityIdFromUrl() {
  const params = new URLSearchParams(window.location.search || '');
  const candidates = [
    'EntityId',
    'EntityID',
    'entityId',
    'EntityIds',
    'recordId',
    'record_id',
    'id',
  ];

  for (const key of candidates) {
    const value = params.get(key);
    if (value) return value.split(',')[0];
  }

  return '';
}

function getClientIdFromCreditFactorRecords(records) {
  const found = (records || []).find((record) => creditFactorStr(record && record.Client_Id));
  return found ? creditFactorStr(found.Client_Id) : '';
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
  const raw = creditFactorStr(value).trim();
  if (!raw) return '';
  return raw.slice(0, 10);
}

function normalizeProvider(value) {
  return creditFactorStr(value).trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function normalizeUpdateBureau(record) {
  const candidates = [
    record && record.Creditor,
  ];
  for (const candidate of candidates) {
    const value = normalizeProvider(candidate);
    if (!value) continue;
    if (value.includes('equifax')) return 'Equifax';
    if (value.includes('transunion')) return 'Transunion';
    if (value.includes('experian')) return 'Experian';
  }
  return '';
}

function normalizeDisputeBureau(record) {
  const value = normalizeProvider(record && record.Creditor);
  if (!value) return '';
  if (value.includes('equifax')) return 'Equifax';
  if (value.includes('transunion')) return 'Transunion';
  return '';
}

function getRecordDate(record) {
  return creditFactorDate(record && record.Created_Date);
}

function getUpdateRecordDate(record) {
  return creditFactorDate(record && record.Created_Date);
}

function getDisputeRecordDate(record) {
  return creditFactorDate(record && record.Created_At);
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
      note: "Tracks how often you've applied for new credit, which can temporarily impact your credit score.",
    },
    {
      title: 'Total Accounts',
      value: sumField(records, 'Total_Accounts'),
      note: 'Shows the total number of credit accounts you’ve opened and maintained over time.',
    },
    {
      title: 'Credit Age',
      value: latestText(records, 'Credit_Age'),
      note: 'Measures the average age of your credit accounts, reflecting your credit history experience.',
    },
    {
      title: 'Derogatory marks',
      value: latestText(records, 'Derogatory_marks'),
      note: 'Highlights serious negative records such as collections, bankruptcies, tax liens, or legal judgments.',
    },
    {
      title: 'Credit card use',
      value: sumField(records, 'Credit_Card_Use'),
      note: 'Indicates how much of your available credit limit you’re currently using across all cards.',
    },
    {
      title: 'Payment history',
      value: latestText(records, 'Payment_History'),
      note: 'Represents your consistency in making payments on time, one of the biggest factors affecting your score.',
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

function buildCreditFactorDataModel(records) {
  const recordsByProvider = CREDIT_FACTOR_BUREAUS.reduce((groups, provider) => {
    groups[provider] = [];
    return groups;
  }, {});
  const dateGroupsByProvider = CREDIT_FACTOR_BUREAUS.reduce((groups, provider) => {
    groups[provider] = {};
    return groups;
  }, {});
  const skippedRecords = [];

  (records || []).forEach((record, index) => {
    const provider = CREDIT_FACTOR_BUREAUS.find((bureau) => (
      normalizeProvider(record && record.Provider) === normalizeProvider(bureau)
    ));
    const createdDate = getRecordDate(record);

    if (!provider) {
      skippedRecords.push({
        reason: 'Provider is not Equifax, Experian, or TransUnion',
        index,
        id: record && (record.id || record.ID),
        provider: record && record.Provider,
        createdDate,
        rawRecord: record,
      });
      return;
    }

    recordsByProvider[provider].push(record);

    if (!createdDate) {
      skippedRecords.push({
        reason: 'Created_Date is empty',
        index,
        id: record && (record.id || record.ID),
        provider,
        rawRecord: record,
      });
      return;
    }

    if (!dateGroupsByProvider[provider][createdDate]) {
      dateGroupsByProvider[provider][createdDate] = [];
    }
    dateGroupsByProvider[provider][createdDate].push(record);
  });

  const datesByProvider = CREDIT_FACTOR_BUREAUS.reduce((groups, provider) => {
    groups[provider] = Object.keys(dateGroupsByProvider[provider]).sort((a, b) => b.localeCompare(a));
    return groups;
  }, {});

  return {
    recordsByProvider,
    dateGroupsByProvider,
    datesByProvider,
    skippedRecords,
  };
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

function buildCreditUpdateDataModel(records) {
  const recordsByCreditor = CREDIT_UPDATE_BUREAUS.reduce((groups, creditor) => {
    groups[creditor] = [];
    return groups;
  }, {});
  const dateGroupsByCreditor = CREDIT_UPDATE_BUREAUS.reduce((groups, creditor) => {
    groups[creditor] = {};
    return groups;
  }, {});
  const skippedRecords = [];

  (records || []).forEach((record, index) => {
    const creditor = normalizeUpdateBureau(record);
    const createdDate = getUpdateRecordDate(record);

    if (!CREDIT_UPDATE_BUREAUS.includes(creditor)) {
      skippedRecords.push({
        reason: 'Creditor is not Equifax or Transunion',
        summary: getUpdateRecordDebugSummary(record, index),
        rawRecord: record,
      });
      return;
    }

    recordsByCreditor[creditor].push(record);

    if (!createdDate) {
      skippedRecords.push({
        reason: 'Created_Date is empty',
        summary: getUpdateRecordDebugSummary(record, index),
        rawRecord: record,
      });
      return;
    }

    if (!dateGroupsByCreditor[creditor][createdDate]) {
      dateGroupsByCreditor[creditor][createdDate] = [];
    }
    dateGroupsByCreditor[creditor][createdDate].push(record);
  });

  const datesByCreditor = CREDIT_UPDATE_BUREAUS.reduce((groups, creditor) => {
    groups[creditor] = Object.keys(dateGroupsByCreditor[creditor]).sort((a, b) => b.localeCompare(a));
    return groups;
  }, {});

  return {
    recordsByCreditor,
    dateGroupsByCreditor,
    datesByCreditor,
    skippedRecords,
  };
}

function buildDisputeDetailsDataModel(records) {
  const recordsByCreditor = CREDIT_UPDATE_BUREAUS.reduce((groups, creditor) => {
    groups[creditor] = [];
    return groups;
  }, {});
  const dateGroupsByCreditor = CREDIT_UPDATE_BUREAUS.reduce((groups, creditor) => {
    groups[creditor] = {};
    return groups;
  }, {});
  const skippedRecords = [];

  (records || []).forEach((record, index) => {
    const creditor = normalizeDisputeBureau(record);
    const createdDate = getDisputeRecordDate(record);

    if (!CREDIT_UPDATE_BUREAUS.includes(creditor)) {
      skippedRecords.push({
        reason: 'Creditor is not Equifax or Transunion',
        summary: getDisputeRecordDebugSummary(record, index),
        rawRecord: record,
      });
      return;
    }

    recordsByCreditor[creditor].push(record);

    if (!createdDate) {
      skippedRecords.push({
        reason: 'Created_At is empty',
        summary: getDisputeRecordDebugSummary(record, index),
        rawRecord: record,
      });
      return;
    }

    if (!dateGroupsByCreditor[creditor][createdDate]) {
      dateGroupsByCreditor[creditor][createdDate] = [];
    }
    dateGroupsByCreditor[creditor][createdDate].push(record);
  });

  const datesByCreditor = CREDIT_UPDATE_BUREAUS.reduce((groups, creditor) => {
    groups[creditor] = Object.keys(dateGroupsByCreditor[creditor]).sort((a, b) => b.localeCompare(a));
    return groups;
  }, {});

  return {
    recordsByCreditor,
    dateGroupsByCreditor,
    datesByCreditor,
    skippedRecords,
  };
}

function getCreditUpdateRecordsForBureau(records, bureau) {
  if (!bureau) return [];
  return (records || []).filter((record) => normalizeProvider(record && record.Creditor) === normalizeProvider(bureau));
}

function getUniqueUpdateDates(records) {
  return [...new Set((records || []).map(getUpdateRecordDate).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));
}

function getUpdateRecordDebugSummary(record, index) {
  const dateFields = {};
  Object.keys(record || {}).forEach((field) => {
    if (/date|time/i.test(field)) {
      dateFields[field] = record[field];
    }
  });

  return {
    index,
    id: record && (record.id || record.ID),
    keys: Object.keys(record || {}),
    accountName: record && record.Account_Name,
    blockTag: record && record.Block_Tag,
    creditor: record && record.Creditor,
    provider: record && record.Provider,
    bureau: normalizeUpdateBureau(record),
    resolvedDate: getUpdateRecordDate(record),
    status: getChangeStatus(record),
    matchesUpdatedOrRemovedBlockTag: hasUpdatedOrRemovedBlockTag(record),
    dateFields,
    rawRecord: record,
  };
}

function getDisputeRecordDebugSummary(record, index) {
  return {
    index,
    id: record && (record.id || record.ID),
    creditor: record && record.Creditor,
    resolvedCreditor: normalizeDisputeBureau(record),
    createdAt: record && record.Created_At,
    resolvedDate: getDisputeRecordDate(record),
    File_Id1: record && record.File_Id1,
    Account_Number: record && record.Account_Number,
    Account_Name: record && record.Account_Name,
    Result_Text: record && record.Result_Text,
    Report_Created_On: record && record.Report_Created_On,
    Date_Opened: record && record.Date_Opened,
    rawRecord: record,
  };
}

function logWhatsChangedDebug(label, payload) {
  if (typeof window === 'undefined' || !window.console) return;
  console.log(`${CHANGE_DEBUG_PREFIX} ${label}`, payload);
}

function getCreditUpdateGroupDebug(grouped) {
  return Object.keys(grouped || {}).reduce((summary, bureau) => {
    summary[bureau] = Object.keys(grouped[bureau] || {}).reduce((dateSummary, date) => {
      dateSummary[date] = grouped[bureau][date].map(getUpdateRecordDebugSummary);
      return dateSummary;
    }, {});
    return summary;
  }, {});
}

function getUniqueDateGroupDebug(records, grouped) {
  return {
    allResolvedDates: getUniqueUpdateDates(records),
    byCreditor: CREDIT_UPDATE_BUREAUS.reduce((summary, creditor) => {
      const creditorRecords = getCreditUpdateRecordsForBureau(records, creditor);
      summary[creditor] = {
        fetchedRecordCount: creditorRecords.length,
        uniqueDates: getUniqueUpdateDates(creditorRecords),
        groupedDates: Object.keys((grouped && grouped[creditor]) || {}).sort((a, b) => b.localeCompare(a)),
        records: creditorRecords.map(getUpdateRecordDebugSummary),
      };
      return summary;
    }, {}),
  };
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
  if (tag.includes('removed')) return 'Removed';
  if (tag.includes('updated')) return 'Updated';
  return '';
}

function hasUpdatedOrRemovedBlockTag(record) {
  const tag = creditFactorStr(record && record.Block_Tag).trim().toLowerCase();
  return tag.includes('updated') || tag.includes('removed');
}

async function fetchCreditFactorsByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) {
    logWhatsChangedDebug('Credit_Factor fetch skipped', {
      clientId,
      hasZoho: !!window.ZOHO,
      hasCrm: !!(window.ZOHO && ZOHO.CRM),
      hasApi: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API),
      hasSearchRecord: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.searchRecord),
    });
    return [];
  }

  const all = [];
  const perPage = 200;
  const query = `(Client_Id:equals:${clientId})`;
  logWhatsChangedDebug('Credit_Factor query started', {
    module: CREDIT_FACTOR_MODULE,
    clientId,
    query,
  });

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
    logWhatsChangedDebug('Credit_Factor query page result', {
      page,
      count: data.length,
      moreRecords: !!(resp && resp.info && resp.info.more_records),
      rawRecords: data,
      response: resp,
    });
    console.log(`${CHANGE_DEBUG_PREFIX} raw fetched Credit_Factor data page ${page}`, data);

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  logWhatsChangedDebug('Credit_Factor combined query result', {
    clientId,
    count: all.length,
    rawRecords: all,
  });
  console.log(`${CHANGE_DEBUG_PREFIX} all raw fetched Credit_Factor records`, all);

  return all;
}

async function fetchCreditUpdateDataByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) {
    logWhatsChangedDebug('credit_update_data fetch skipped', {
      clientId,
      hasZoho: !!window.ZOHO,
      hasCrm: !!(window.ZOHO && ZOHO.CRM),
      hasApi: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API),
      hasSearchRecord: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.searchRecord),
    });
    return [];
  }

  const all = [];
  const perPage = 200;
  const query = `(Client:equals:${clientId})`;

  logWhatsChangedDebug('credit_update_data client fetch started', {
    module: CREDIT_UPDATE_DATA_MODULE,
    clientId,
    query,
  });

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

    console.log(`${CHANGE_DEBUG_PREFIX} credit_update_data CLIENT FETCH PAGE COMPLETE`, {
      clientId,
      page,
      query,
      count: data.length,
      moreRecords: !!(resp && resp.info && resp.info.more_records),
      fullResponse: resp,
      fullRecords: data,
    });
    data.forEach((record, index) => {
      console.log(`${CHANGE_DEBUG_PREFIX} credit_update_data FULL RECORD`, {
        clientId,
        page,
        index,
        id: record && (record.id || record.ID),
        Creditor: record && record.Creditor,
        Created_Date: record && record.Created_Date,
        fullRecord: record,
      });
    });

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  logWhatsChangedDebug('credit_update_data combined query result', {
    clientId,
    query,
    count: all.length,
    rawRecords: all,
    records: all.map(getUpdateRecordDebugSummary),
  });
  console.log(`${CHANGE_DEBUG_PREFIX} credit_update_data CLIENT FETCH COMPLETED`, {
    clientId,
    query,
    totalRecords: all.length,
    allFetchedRecords: all,
  });
  console.table(all.map(getUpdateRecordDebugSummary));

  return all;
}

async function fetchClientCreditReportsByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) {
    logWhatsChangedDebug('Client_Credit_Reports fetch skipped', {
      clientId,
      hasZoho: !!window.ZOHO,
      hasCrm: !!(window.ZOHO && ZOHO.CRM),
      hasApi: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API),
      hasSearchRecord: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.searchRecord),
    });
    return [];
  }

  const all = [];
  const perPage = 200;
  const query = `(Client:equals:${clientId})`;

  logWhatsChangedDebug('Client_Credit_Reports client fetch started', {
    module: CLIENT_CREDIT_REPORTS_MODULE,
    clientId,
    query,
  });

  for (let page = 1; page <= 10; page++) {
    const resp = await ZOHO.CRM.API.searchRecord(
      {
        Entity: CLIENT_CREDIT_REPORTS_MODULE,
        Type: 'criteria',
        Query: query,
      },
      page,
      perPage
    );

    const data = (resp && resp.data) || [];
    all.push(...data);

    console.log(`${CHANGE_DEBUG_PREFIX} Client_Credit_Reports FETCH PAGE COMPLETE`, {
      clientId,
      page,
      query,
      count: data.length,
      moreRecords: !!(resp && resp.info && resp.info.more_records),
      fullResponse: resp,
      fullRecords: data,
    });

    data.forEach((record, index) => {
      console.log(`${CHANGE_DEBUG_PREFIX} Client_Credit_Reports FULL RECORD`, {
        clientId,
        page,
        index,
        id: record && (record.id || record.ID),
        Creditor: record && record.Creditor,
        Created_At: record && record.Created_At,
        fullRecord: record,
      });
    });

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  logWhatsChangedDebug('Client_Credit_Reports combined query result', {
    clientId,
    query,
    count: all.length,
    rawRecords: all,
    records: all.map(getDisputeRecordDebugSummary),
  });
  console.log(`${CHANGE_DEBUG_PREFIX} Client_Credit_Reports FETCH COMPLETED`, {
    clientId,
    query,
    totalRecords: all.length,
    allFetchedRecords: all,
  });
  console.table(all.map(getDisputeRecordDebugSummary));

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

function useZohoPageLoadBridge() {
  useResizeEffect(() => {
    let cancelled = false;

    console.log(`${CHANGE_DEBUG_PREFIX} bridge waiting for Zoho SDK before PageLoad registration`);

    waitForZohoSdk().then((zoho) => {
      console.log(`${CHANGE_DEBUG_PREFIX} bridge Zoho SDK wait resolved`, {
        cancelled,
        hasZoho: !!zoho,
        hasEmbeddedApp: !!(zoho && zoho.embeddedApp),
        zohoInitialized: window.CreditFactorWidget.zohoInitialized,
        hasCrmApi: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.searchRecord),
      });

      if (cancelled) {
        console.log(`${CHANGE_DEBUG_PREFIX} bridge PageLoad registration cancelled before SDK ready`);
        return;
      }

      if (window.CreditFactorWidget.zohoInitialized) {
        console.log(`${CHANGE_DEBUG_PREFIX} bridge PageLoad already initialized`);
        return;
      }

      if (!zoho || !zoho.embeddedApp) {
        console.log(`${CHANGE_DEBUG_PREFIX} bridge PageLoad registration skipped because Zoho embeddedApp is missing`);
        return;
      }

      console.log(`${CHANGE_DEBUG_PREFIX} bridge registering Zoho PageLoad handler`);
      zoho.embeddedApp.on('PageLoad', (data) => {
        console.log(`${CHANGE_DEBUG_PREFIX} bridge Zoho PageLoad event received`, data);
        window.CreditFactorWidget.emitPageLoad(data);
      });
      console.log(`${CHANGE_DEBUG_PREFIX} bridge calling zoho.embeddedApp.init()`);
      zoho.embeddedApp.init();
      window.CreditFactorWidget.zohoInitialized = true;
      console.log(`${CHANGE_DEBUG_PREFIX} bridge zoho.embeddedApp.init() called`);

      setTimeout(() => {
        if (!window.CreditFactorWidget.pageData) {
          console.log(`${CHANGE_DEBUG_PREFIX} bridge PageLoad has not fired yet`, {
            hasZoho: !!window.ZOHO,
            hasEmbeddedApp: !!(window.ZOHO && ZOHO.embeddedApp),
            hasCrmApi: !!(window.ZOHO && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.searchRecord),
            url: window.location.href,
          });

          const fallbackClientId = getPageEntityIdFromUrl();
          console.log(`${CHANGE_DEBUG_PREFIX} fallback URL client id check`, {
            fallbackClientId,
            search: window.location.search,
          });

          if (fallbackClientId) {
            console.log(`${CHANGE_DEBUG_PREFIX} bridge using URL fallback client id to emit PageLoad`, {
              fallbackClientId,
            });
            window.CreditFactorWidget.emitPageLoad({ EntityId: fallbackClientId, source: 'url-fallback' });
          }
        }
      }, 3000);
    });

    return () => {
      cancelled = true;
    };
  }, []);
}

function useZohoPageLoad(onPageLoad) {
  useResizeEffect(() => {
    return window.CreditFactorWidget.onPageLoad(onPageLoad);
  }, []);
}

const RootApp = () => {
  useZohoResize();
  useZohoPageLoadBridge();
  const [dropdownSpace, setDropdownSpace] = useCreditFactorState(0);
  const [reportProvider, setReportProvider] = useCreditFactorState('');
  const [appliedProvider, setAppliedProvider] = useCreditFactorState('');
  const [reportDate, setReportDate] = useCreditFactorState('');
  const [appliedDate, setAppliedDate] = useCreditFactorState('');
  const [records, setRecords] = useCreditFactorState([]);
  const [pageClientId, setPageClientId] = useCreditFactorState('');
  const [loading, setLoading] = useCreditFactorState(true);
  const [error, setError] = useCreditFactorState('');
  const [changeType, setChangeType] = useCreditFactorState('All');
  const [changeBureau, setChangeBureau] = useCreditFactorState('');
  const [changeDate, setChangeDate] = useCreditFactorState('');
  const [creditUpdateRecords, setCreditUpdateRecords] = useCreditFactorState([]);
  const [selectedChangeGroup, setSelectedChangeGroup] = useCreditFactorState(null);
  const [showChangeCards, setShowChangeCards] = useCreditFactorState(false);
  const [disputeProvider, setDisputeProvider] = useCreditFactorState('');
  const [appliedDisputeProvider, setAppliedDisputeProvider] = useCreditFactorState('');
  const [disputeDate, setDisputeDate] = useCreditFactorState('');
  const [appliedDisputeDate, setAppliedDisputeDate] = useCreditFactorState('');
  const [disputeRecords, setDisputeRecords] = useCreditFactorState([]);

  useCreditFactorEffect(() => {
    logWhatsChangedDebug('RootApp mounted', {
      changeTypeOptions: CHANGE_TYPES,
      creditorOptions: CREDIT_UPDATE_BUREAUS,
    });
  }, []);

  useZohoPageLoad((pageData) => {
    const clientId = getPageEntityId(pageData);
    logWhatsChangedDebug('PageLoad', { pageData, clientId });
    setPageClientId(clientId);
    setLoading(true);
    setError('');

    Promise.allSettled([
      fetchCreditFactorsByClientId(clientId),
      fetchCreditUpdateDataByClientId(clientId),
      fetchClientCreditReportsByClientId(clientId),
    ])
      .then(([factorResult, updateResult, disputeResult]) => {
        if (factorResult.status === 'fulfilled') {
          setRecords(factorResult.value);
        } else {
          setRecords([]);
          setError('Failed to load credit factor data.');
        }

        if (updateResult.status === 'fulfilled') {
          setCreditUpdateRecords(updateResult.value);
          logWhatsChangedDebug('Fetched credit_update_data records', {
            count: updateResult.value.length,
            rawRecords: updateResult.value,
            records: updateResult.value.map(getUpdateRecordDebugSummary),
          });
          console.log(`${CHANGE_DEBUG_PREFIX} Fetched credit_update_data RAW RECORDS`, updateResult.value);
        } else {
          setCreditUpdateRecords([]);
          logWhatsChangedDebug('Failed to fetch credit_update_data records', updateResult.reason);
        }

        if (disputeResult.status === 'fulfilled') {
          setDisputeRecords(disputeResult.value);
          logWhatsChangedDebug('Fetched Client_Credit_Reports records', {
            count: disputeResult.value.length,
            rawRecords: disputeResult.value,
            records: disputeResult.value.map(getDisputeRecordDebugSummary),
          });
          console.log(`${CHANGE_DEBUG_PREFIX} Fetched Client_Credit_Reports RAW RECORDS`, disputeResult.value);
        } else {
          setDisputeRecords([]);
          logWhatsChangedDebug('Failed to fetch Client_Credit_Reports records', disputeResult.reason);
        }
      })
      .finally(() => {
        setLoading(false);
        window.CreditFactorWidget?.requestResize?.();
      });
  });

  const creditFactorDataModel = buildCreditFactorDataModel(records);
  const reportDateOptions = reportProvider
    ? creditFactorDataModel.datesByProvider[reportProvider] || []
    : [];
  const renderedReportDateOptions = reportDateOptions.map((date) => ({
    label: formatUpdateDateLabel(date),
    value: date,
  }));
  const canSubmitReport = !!reportProvider && !!reportDate;
  const hasAppliedReportFilters = !!appliedProvider && !!appliedDate;
  const filteredRecords = hasAppliedReportFilters
    ? filterCreditFactorRecords(records, appliedProvider, appliedDate)
    : [];
  const stats = buildCreditFactorStats(filteredRecords);
  const creditUpdateDataModel = buildCreditUpdateDataModel(creditUpdateRecords);
  const creditUpdateGroups = creditUpdateDataModel.dateGroupsByCreditor;
  const creditUpdateDatesByCreditor = creditUpdateDataModel.datesByCreditor;
  const activeChangeBureau = CREDIT_UPDATE_BUREAUS.includes(changeBureau)
    ? changeBureau
    : '';
  const activeCreditorRecords = activeChangeBureau
    ? creditUpdateDataModel.recordsByCreditor[activeChangeBureau] || []
    : [];
  const changeDateOptions = activeChangeBureau ? creditUpdateDatesByCreditor[activeChangeBureau] || [] : [];
  const activeChangeDate = changeDateOptions.includes(changeDate)
    ? changeDate
    : '';
  const activeChangeRecords = activeChangeBureau && activeChangeDate
    ? (creditUpdateGroups[activeChangeBureau] && creditUpdateGroups[activeChangeBureau][activeChangeDate]) || []
    : [];
  const renderedChangeDateOptions = changeDateOptions.map((date) => ({
    label: formatUpdateDateLabel(date),
    value: date,
  }));
  const filteredChangeRecords = activeChangeRecords.filter((record) => {
    if (changeType === 'All') return true;
    if (changeType === 'Updated or Removed') {
      return hasUpdatedOrRemovedBlockTag(record);
    }
    return true;
  });
  const canSubmitChanges = !!activeChangeBureau && !!activeChangeDate;
  const disputeDataModel = buildDisputeDetailsDataModel(disputeRecords);
  const disputeDateOptions = disputeProvider
    ? disputeDataModel.datesByCreditor[disputeProvider] || []
    : [];
  const renderedDisputeDateOptions = disputeDateOptions.map((date) => ({
    label: formatUpdateDateLabel(date),
    value: date,
  }));
  const canSubmitDispute = !!disputeProvider && !!disputeDate;
  const hasAppliedDisputeFilters = !!appliedDisputeProvider && !!appliedDisputeDate;
  const selectedDisputeRecords = hasAppliedDisputeFilters
    ? (disputeDataModel.dateGroupsByCreditor[appliedDisputeProvider]
      && disputeDataModel.dateGroupsByCreditor[appliedDisputeProvider][appliedDisputeDate]) || []
    : [];

  useCreditFactorEffect(() => {
    const creditFactorGroupDebug = {
      recordsByProvider: CREDIT_FACTOR_BUREAUS.reduce((summary, provider) => {
        summary[provider] = (creditFactorDataModel.recordsByProvider[provider] || []).map((record, index) => ({
          index,
          id: record && (record.id || record.ID),
          provider: record && record.Provider,
          createdDate: getRecordDate(record),
          rawRecord: record,
        }));
        return summary;
      }, {}),
      uniqueDatesByProvider: creditFactorDataModel.datesByProvider,
      dateGroupsByProvider: CREDIT_FACTOR_BUREAUS.reduce((summary, provider) => {
        summary[provider] = Object.keys(creditFactorDataModel.dateGroupsByProvider[provider] || {}).reduce((dateSummary, date) => {
          dateSummary[date] = creditFactorDataModel.dateGroupsByProvider[provider][date].map((record, index) => ({
            index,
            id: record && (record.id || record.ID),
            provider: record && record.Provider,
            createdDate: getRecordDate(record),
            rawRecord: record,
          }));
          return dateSummary;
        }, {});
        return summary;
      }, {}),
      skippedRecords: creditFactorDataModel.skippedRecords,
    };

    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard all fetched raw records`, records);
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard records grouped by Provider`, creditFactorGroupDebug.recordsByProvider);
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard unique Created_Date values by Provider`, creditFactorDataModel.datesByProvider);
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard records grouped by Provider and Created_Date`, creditFactorGroupDebug.dateGroupsByProvider);
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard selected provider date dropdown options`, {
      selectedProvider: reportProvider,
      dateOptions: renderedReportDateOptions,
      sourceRecords: reportProvider ? creditFactorDataModel.recordsByProvider[reportProvider] || [] : [],
    });
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard applied records`, {
      appliedProvider,
      appliedDate,
      hasAppliedReportFilters,
      recordCount: filteredRecords.length,
      records: filteredRecords,
    });
    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard skipped records while grouping`, creditFactorDataModel.skippedRecords);
  }, [
    records.length,
    reportProvider,
    reportDate,
    appliedProvider,
    appliedDate,
    filteredRecords.length,
    reportDateOptions.join('|'),
  ]);

  useCreditFactorEffect(() => {
    if (reportProvider && !CREDIT_FACTOR_BUREAUS.includes(reportProvider)) {
      setReportProvider('');
      return;
    }
    if (reportDate && !reportDateOptions.includes(reportDate)) {
      setReportDate('');
    }
  }, [reportProvider, reportDateOptions.join('|'), reportDate]);

  useCreditFactorEffect(() => {
    const disputeGroupDebug = {
      recordsByCreditor: CREDIT_UPDATE_BUREAUS.reduce((summary, creditor) => {
        summary[creditor] = (disputeDataModel.recordsByCreditor[creditor] || []).map(getDisputeRecordDebugSummary);
        return summary;
      }, {}),
      uniqueDatesByCreditor: disputeDataModel.datesByCreditor,
      dateGroupsByCreditor: CREDIT_UPDATE_BUREAUS.reduce((summary, creditor) => {
        summary[creditor] = Object.keys(disputeDataModel.dateGroupsByCreditor[creditor] || {}).reduce((dateSummary, date) => {
          dateSummary[date] = disputeDataModel.dateGroupsByCreditor[creditor][date].map(getDisputeRecordDebugSummary);
          return dateSummary;
        }, {});
        return summary;
      }, {}),
      skippedRecords: disputeDataModel.skippedRecords,
    };

    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails all fetched raw records`, disputeRecords);
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails records grouped by Creditor`, disputeGroupDebug.recordsByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails unique Created_At dates by Creditor`, disputeDataModel.datesByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails records grouped by Creditor and Created_At date`, disputeGroupDebug.dateGroupsByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails selected creditor date dropdown options`, {
      selectedCreditor: disputeProvider,
      dateOptions: renderedDisputeDateOptions,
      sourceRecords: disputeProvider ? disputeDataModel.recordsByCreditor[disputeProvider] || [] : [],
    });
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails applied table records`, {
      appliedDisputeProvider,
      appliedDisputeDate,
      hasAppliedDisputeFilters,
      recordCount: selectedDisputeRecords.length,
      records: selectedDisputeRecords,
    });
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails skipped records while grouping`, disputeDataModel.skippedRecords);
  }, [
    disputeRecords.length,
    disputeProvider,
    disputeDate,
    appliedDisputeProvider,
    appliedDisputeDate,
    selectedDisputeRecords.length,
    disputeDateOptions.join('|'),
  ]);

  useCreditFactorEffect(() => {
    if (disputeProvider && !CREDIT_UPDATE_BUREAUS.includes(disputeProvider)) {
      setDisputeProvider('');
      return;
    }
    if (disputeDate && !disputeDateOptions.includes(disputeDate)) {
      setDisputeDate('');
    }
  }, [disputeProvider, disputeDateOptions.join('|'), disputeDate]);

  useCreditFactorEffect(() => {
    const uniqueDateGroups = getUniqueDateGroupDebug(creditUpdateRecords, creditUpdateGroups);
    const modelDebug = {
      recordsByCreditor: CREDIT_UPDATE_BUREAUS.reduce((summary, creditor) => {
        summary[creditor] = (creditUpdateDataModel.recordsByCreditor[creditor] || []).map(getUpdateRecordDebugSummary);
        return summary;
      }, {}),
      uniqueDatesByCreditor: creditUpdateDatesByCreditor,
      dateGroupsByCreditor: getCreditUpdateGroupDebug(creditUpdateGroups),
      skippedRecords: creditUpdateDataModel.skippedRecords,
    };

    console.log(`${CHANGE_DEBUG_PREFIX} All fetched credit_update_data raw records`, creditUpdateRecords);
    console.log(`${CHANGE_DEBUG_PREFIX} Records grouped by Creditor`, modelDebug.recordsByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} Unique Created_Date values by Creditor`, creditUpdateDatesByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} Records grouped by Creditor and Created_Date`, modelDebug.dateGroupsByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} Records skipped while grouping`, creditUpdateDataModel.skippedRecords);
    CREDIT_UPDATE_BUREAUS.forEach((creditor) => {
      console.log(`${CHANGE_DEBUG_PREFIX} ${creditor} raw records`, creditUpdateDataModel.recordsByCreditor[creditor] || []);
      console.log(`${CHANGE_DEBUG_PREFIX} ${creditor} unique dates for dropdown`, creditUpdateDatesByCreditor[creditor] || []);
      Object.keys(creditUpdateGroups[creditor] || {}).forEach((date) => {
        console.log(`${CHANGE_DEBUG_PREFIX} ${creditor} records for ${date}`, creditUpdateGroups[creditor][date]);
      });
    });
    console.log(`${CHANGE_DEBUG_PREFIX} Selected creditor/date records`, {
      selectedCreditor: activeChangeBureau,
      selectedDate: activeChangeDate,
      changeType,
      recordCount: activeChangeRecords.length,
      records: activeChangeRecords,
      filteredRecordCount: filteredChangeRecords.length,
      filteredRecords: filteredChangeRecords,
      updatedOrRemovedBlockTagMatches: activeChangeRecords
        .filter(hasUpdatedOrRemovedBlockTag)
        .map(getUpdateRecordDebugSummary),
    });

    logWhatsChangedDebug('Dropdown options and grouped records', {
      changeTypeOptions: CHANGE_TYPES,
      bureauOptions: CREDIT_UPDATE_BUREAUS,
      activeChangeBureau,
      creditUpdateDatesByCreditor,
      activeCreditorRecords: activeCreditorRecords.map(getUpdateRecordDebugSummary),
      activeCreditorRawRecords: activeCreditorRecords,
      rawSelectedChangeDate: changeDate,
      activeChangeDate,
      changeDateOptions,
      dateDropdownOptions: renderedChangeDateOptions,
      uniqueDateGroups,
      modelDebug,
      groupSummary: modelDebug.dateGroupsByCreditor,
      skippedRecords: creditUpdateDataModel.skippedRecords,
      activeChangeRecords: activeChangeRecords.map(getUpdateRecordDebugSummary),
      activeChangeRawRecords: activeChangeRecords,
      filteredChangeRecords: filteredChangeRecords.map(getUpdateRecordDebugSummary),
      filteredChangeRawRecords: filteredChangeRecords,
      rawFetchedRecords: creditUpdateRecords,
    });
    logWhatsChangedDebug('Date dropdown render input', {
      selectedCreditor: activeChangeBureau,
      dateDropdownOptions: renderedChangeDateOptions,
      sourceRecords: activeCreditorRecords.map(getUpdateRecordDebugSummary),
      rawSourceRecords: activeCreditorRecords,
    });
    console.log(`${CHANGE_DEBUG_PREFIX} unique Created_Date arrays by creditor`, creditUpdateDatesByCreditor);
    console.log(`${CHANGE_DEBUG_PREFIX} date dropdown options shown`, renderedChangeDateOptions);
    console.log(`${CHANGE_DEBUG_PREFIX} unique date groups by creditor`, uniqueDateGroups);
    console.log(`${CHANGE_DEBUG_PREFIX} selected creditor raw records used for date dropdown`, activeCreditorRecords);
    console.table(activeCreditorRecords.map(getUpdateRecordDebugSummary));
    console.table(changeDateOptions.map((date) => ({
      activeCreditor: activeChangeBureau || '(none)',
      date,
      label: formatUpdateDateLabel(date),
      recordCount: activeCreditorRecords.filter((record) => getUpdateRecordDate(record) === date).length,
    })));
  }, [
    creditUpdateRecords.length,
    activeChangeBureau,
    changeDate,
    activeChangeDate,
    changeDateOptions.join('|'),
    changeType,
    activeCreditorRecords.length,
    activeChangeRecords.length,
    filteredChangeRecords.length,
  ]);

  useCreditFactorEffect(() => {
    if (changeBureau && !CREDIT_UPDATE_BUREAUS.includes(changeBureau)) {
      setChangeBureau('');
    }
  }, [changeBureau]);

  useCreditFactorEffect(() => {
    if (changeDate && !changeDateOptions.includes(changeDate)) {
      setChangeDate('');
    }
  }, [changeDateOptions.join('|'), changeDate]);

  useCreditFactorEffect(() => {
    const retryClientId = pageClientId || getClientIdFromCreditFactorRecords(records);
    if (!changeBureau || creditUpdateRecords.length || !retryClientId) return;

    let cancelled = false;
    logWhatsChangedDebug('What Changed creditor selected with no update records; retrying credit_update_data fetch', {
      selectedCreditor: changeBureau,
      pageClientId,
      retryClientId,
      derivedClientIdFromCreditFactorRecords: getClientIdFromCreditFactorRecords(records),
    });

    fetchCreditUpdateDataByClientId(retryClientId)
      .then((updateRecords) => {
        if (cancelled) return;
        logWhatsChangedDebug('What Changed retry fetch completed', {
          selectedCreditor: changeBureau,
          count: updateRecords.length,
          rawRecords: updateRecords,
          records: updateRecords.map(getUpdateRecordDebugSummary),
        });
        setCreditUpdateRecords(updateRecords);
      })
      .catch((error) => {
        if (cancelled) return;
        logWhatsChangedDebug('What Changed retry fetch failed', {
          selectedCreditor: changeBureau,
          pageClientId,
          retryClientId,
          error,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [changeBureau, creditUpdateRecords.length, pageClientId, records.length]);

  function submitReport() {
    if (!canSubmitReport) return;

    console.log(`${CHANGE_DEBUG_PREFIX} CreditFactorCard submit filters`, {
      reportProvider,
      reportDate,
      matchingRecords: filterCreditFactorRecords(records, reportProvider, reportDate),
    });
    setAppliedProvider(reportProvider);
    setAppliedDate(reportDate);
    window.CreditFactorWidget?.requestResize?.();
  }

  function submitChanges() {
    if (!canSubmitChanges) return;

    logWhatsChangedDebug('Submit changes graph filters', {
      changeType,
      activeChangeBureau,
      activeChangeDate,
      selectedRecordCount: filteredChangeRecords.length,
      rawRecords: filteredChangeRecords,
      records: filteredChangeRecords.map(getUpdateRecordDebugSummary),
    });
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
    if (!canSubmitDispute) return;

    const matchingRecords = (disputeDataModel.dateGroupsByCreditor[disputeProvider]
      && disputeDataModel.dateGroupsByCreditor[disputeProvider][disputeDate]) || [];
    console.log(`${CHANGE_DEBUG_PREFIX} DisputeDetails submit filters`, {
      disputeProvider,
      disputeDate,
      recordCount: matchingRecords.length,
      records: matchingRecords,
      summaries: matchingRecords.map(getDisputeRecordDebugSummary),
    });
    setAppliedDisputeProvider(disputeProvider);
    setAppliedDisputeDate(disputeDate);
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
          reportDateOptions={renderedReportDateOptions}
          stats={stats}
          loading={loading}
          error={error}
          recordCount={filteredRecords.length}
          canSubmit={canSubmitReport}
          onProviderChange={(provider) => {
            setReportProvider(provider);
            setReportDate('');
          }}
          onReportDateChange={setReportDate}
          onSubmit={submitReport}
        />

        <WhatsChangedCard
          changeType={changeType}
          changeTypeOptions={CHANGE_TYPES}
          changeBureau={changeBureau}
          bureauOptions={CREDIT_UPDATE_BUREAUS}
          changeDate={changeDate}
          changeDateOptions={renderedChangeDateOptions}
          onChangeTypeChange={(value) => {
            setChangeType(value);
            setSelectedChangeGroup(null);
            setShowChangeCards(false);
          }}
          onChangeBureauChange={(bureau) => {
            setChangeBureau(bureau);
            setChangeDate('');
            setSelectedChangeGroup(null);
            setShowChangeCards(false);
          }}
          onChangeDateChange={(date) => {
            setChangeDate(date);
            setSelectedChangeGroup(null);
            setShowChangeCards(false);
          }}
          onSubmit={submitChanges}
          canSubmit={canSubmitChanges}
          selectedChangeGroup={selectedChangeGroup}
          selectedChangeRecords={filteredChangeRecords}
          showChangeCards={showChangeCards}
          onToggleChangeCards={toggleChangeCards}
        />

        <DisputeDetailsCard
          provider={disputeProvider}
          providerOptions={CREDIT_UPDATE_BUREAUS}
          disputeDate={disputeDate}
          disputeDateOptions={renderedDisputeDateOptions}
          records={selectedDisputeRecords}
          canSubmit={canSubmitDispute}
          hasSubmitted={hasAppliedDisputeFilters}
          onProviderChange={(provider) => {
            setDisputeProvider(provider);
            setDisputeDate('');
            setAppliedDisputeProvider('');
            setAppliedDisputeDate('');
          }}
          onDisputeDateChange={(date) => {
            setDisputeDate(date);
            setAppliedDisputeProvider('');
            setAppliedDisputeDate('');
          }}
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
