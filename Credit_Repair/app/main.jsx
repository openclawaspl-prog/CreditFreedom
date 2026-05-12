/*
  DisputeStatus widget - main entry
  Fetches Contact and Client_Account data, then passes them to child components.
*/
const { useState, useEffect } = React;

const LOAD_TIMEOUT_MS = 30000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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

function normalizeEntityId(rawId) {
  let val = rawId;
  if (Array.isArray(val)) val = val[0];
  if (val && typeof val === 'object') {
    val = val.id || val.ID || val.record_id || val.RecordID || '';
  }
  if (val == null) return '';
  return String(val).trim();
}

function getPageEntityId(pageData) {
  if (!pageData) return '';
  const candidates = [
    pageData.EntityId,
    pageData.EntityID,
    pageData.entityId,
    pageData.entityID,
    pageData.EntityIds,
    pageData.EntityIDs,
  ];
  for (const c of candidates) {
    const id = normalizeEntityId(c);
    if (id) return id;
  }
  return '';
}

function waitForZohoSdk(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tick() {
      if (window.ZOHO && window.ZOHO.embeddedApp) return resolve(window.ZOHO);
      if (Date.now() - start > timeoutMs) return reject(new Error('ZOHO SDK not ready'));
      setTimeout(tick, 100);
    }
    tick();
  });
}

function waitForCrmApi(zoho, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    function tick() {
      if (zoho && zoho.CRM && zoho.CRM.API) return resolve(true);
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(tick, 100);
    }
    tick();
  });
}

async function resolveContactId(zoho, sourceEntity, sourceId) {
  if (sourceEntity === 'Contacts') return sourceId;
  if (!sourceId) return '';

  try {
    const resp = await withTimeout(
      zoho.CRM.API.getRecord({ Entity: sourceEntity, RecordID: sourceId }),
      LOAD_TIMEOUT_MS,
      'getRecord:source'
    );
    const err = extractZohoError(resp);
    if (err) throw err;
    const rec = resp && resp.data && resp.data[0];
    const lookup = rec && (
      rec.Client_ID || rec.Client || rec.Contact || rec.Contact_Name || rec.Client_Name
    );
    return normalizeEntityId(lookup);
  } catch (err) {
    console.error('[CF] resolveContactId error:', formatZohoError(err));
    return '';
  }
}

function pickContact(r) {
  return {
    Full_Name:        r.Full_Name        || '',
    Email:            r.Email            || '',
    Referred_By:      r.Name1            || '-',
    Client_Status:    r.Client_Status    || 'Client',
    Equifax_Score:    Number(r.Equifax_Score)    || 0,
    Experin_Score:    Number(r.Experin_Score)    || 0,
    Transunion_Score: Number(r.Transunion_Score) || 0,
    Equifax_Delta:    Number(r.Equifax_Delta)    || 0,
    Experian_Delta:   Number(r.Experian_Delta)   || 0,
    Transunion_Delta: Number(r.Transunion_Delta) || 0,
    Modified_Time:    r.Modified_Time           || '',
  };
}

const BLOCK_TYPES = ['late', 'new', 'start', 'charged', 'closed', 'account_change', 'removed'];
const BUREAUS = ['Equifax', 'TransUnion', 'Experian'];

function zohoStr(val) {
  if (!val) return '';
  if (typeof val === 'object') return val.display_value || val.name || val.value || '';
  return String(val);
}

function normalizeBureau(val) {
  const s = zohoStr(val).trim().toLowerCase().replace(/[\s_-]/g, '');
  if (s === 'equifax') return 'Equifax';
  if (s === 'transunion') return 'TransUnion';
  if (s === 'experian') return 'Experian';
  return '';
}

function buildCounts(accounts) {
  const counts = {};
  BUREAUS.forEach(b => {
    counts[b] = {};
    BLOCK_TYPES.forEach(t => { counts[b][t] = 0; });
  });

  (accounts || []).forEach(acc => {
    const bureau = normalizeBureau(
      acc.Creditor || acc.Bureau || acc.Credit_Bureau || acc.CreditBureau || acc.Creditor_Name
    );
    const type = zohoStr(
      acc.block_type || acc.Block_Type || acc.BlockType || acc.Block || acc.Blocktype
    ).trim().toLowerCase();
    if (bureau && counts[bureau] && counts[bureau][type] !== undefined) {
      counts[bureau][type]++;
    }
  });

  return counts;
}

function useDynamicHeight() {
  useEffect(() => {
    let timer;
    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const h = document.body.scrollHeight + 32;
        if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
          window.ZOHO.CRM.UI.Resize({ height: String(h), width: '0' });
        }
      }, 150);
    }
    const observer = new ResizeObserver(sendResize);
    observer.observe(document.body);
    const t = setTimeout(sendResize, 500);
    return () => { observer.disconnect(); clearTimeout(timer); clearTimeout(t); };
  }, []);
}

function Skeleton() {
  const Bar = ({ cls }) => <div className={`h-3 bg-blue-300 rounded animate-pulse ${cls}`} />;
  return (
    <div className="space-y-4">
      <div className="rounded-xl px-6 py-5" style={{ background: '#1d4ed8' }}>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Bar cls="w-16 opacity-60" />
              <Bar cls="w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-56 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="h-56 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

async function fetchContact(zoho, entity, idStr) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const resp = await withTimeout(
        zoho.CRM.API.getRecord({ Entity: entity, RecordID: idStr }),
        LOAD_TIMEOUT_MS,
        'getRecord'
      );
      const err = extractZohoError(resp);
      if (err) throw err;
      return resp && resp.data && resp.data[0] ? resp.data[0] : null;
    } catch (err) {
      if (attempt >= 2) {
        console.error('[CF] getRecord error:', formatZohoError(err));
        return null;
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return null;
}

async function fetchAccounts(zoho, entity, idStr) {
  if (entity !== 'Contacts') return [];
  const api = zoho && zoho.CRM && zoho.CRM.API;
  if (!api || !api.getAllRecords) return [];

  const perPage = 100;
  const all = [];

  try {
    for (let page = 1; page <= 10; page++) {
      const resp = await withTimeout(
        api.getAllRecords({
          Entity: 'Client_Account',
          page,
          per_page: perPage,
        }),
        LOAD_TIMEOUT_MS,
        'getAllRecords'
      );
      const err = extractZohoError(resp);
      if (err) throw err;
      const data = (resp && resp.data) || [];
      all.push(...data);

      if (page === 1) {
        data.slice(0, 5).forEach(row => {
          
          const reason = row.Reason;
          const remarks = row.Remarks;
          const instruction = row.Instruction;
          console.log('[CF] Client_Account Reason:', reason, '| Name:', reason && reason.name);
          console.log('[CF] Client_Account Remarks:', remarks);
          console.log('[CF] Client_Account Instruction:', instruction, '| Name:', instruction && instruction.name);
        });
      }

      const more = resp && resp.info && resp.info.more_records;
      if (!more && data.length < perPage) break;
      if (data.length < perPage) break;
    }
  } catch (err) {
    console.error('[CF] getAllRecords error:', formatZohoError(err));
  }

  return all;
}

const DisputeWidget = () => {
  const [contact, setContact] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [counts, setCounts] = useState(buildCounts([]));
  const [contactId, setContactId] = useState('');
  const [entityName, setEntityName] = useState('Contacts');
  const [loading, setLoading] = useState(true);

  useDynamicHeight();

  useEffect(() => {
    let alive = true;
    let pageLoadFired = false;
    let pageLoadTimer;

    waitForZohoSdk().then((zoho) => {
      if (!alive) return;

      pageLoadTimer = setTimeout(() => {
        if (!pageLoadFired && alive) {
          console.error('[CF] Waiting for CRM context...');
          setContact({});
          setCounts(buildCounts([]));
          setAccounts([]);
          setLoading(false);
        }
      }, 2000);

      zoho.embeddedApp.on('PageLoad', async (pageData) => {
        pageLoadFired = true;
        clearTimeout(pageLoadTimer);
        if (!alive) return;

        const sourceEntity = (pageData && pageData.Entity) ? pageData.Entity : 'Contacts';
        const sourceId = getPageEntityId(pageData);

        const idStr = await resolveContactId(zoho, sourceEntity, sourceId);
        const contactEntity = 'Contacts';

        setContactId(idStr);
        setEntityName(contactEntity);
        setLoading(true);

        if (!idStr) {
          console.error('[CF] Missing contact id from PageLoad:', pageData);
          setContact({});
          setCounts(buildCounts([]));
          setAccounts([]);
          setLoading(false);
          return;
        }

        const apiReady = await waitForCrmApi(zoho);
        if (!apiReady) {
          console.error('[CF] CRM API not ready');
          setContact({});
          setCounts(buildCounts([]));
          setAccounts([]);
          setLoading(false);
          return;
        }

        try {
          console.log("Fetching acc");
          
          const [contactData, accountRows] = await Promise.all([
            fetchContact(zoho, contactEntity, idStr),
            fetchAccounts(zoho, contactEntity, idStr),
          ]);

          if (!alive) return;

          const safeAccounts = Array.isArray(accountRows) ? accountRows : [];
          const freshCounts = buildCounts(safeAccounts);

          setAccounts(safeAccounts);
          setCounts(freshCounts);
          setContact(contactData ? pickContact(contactData) : {});
        } catch (err) {
          if (!alive) return;
          console.error('[CF] data load error:', formatZohoError(err));
          setContact({});
          setCounts(buildCounts([]));
          setAccounts([]);
        } finally {
          if (alive) setLoading(false);
        }
      });

      zoho.embeddedApp.init();
    }).catch((err) => {
      if (!alive) return;
      console.error('[CF] ZOHO SDK not available:', err);
      setContact({});
      setCounts(buildCounts([]));
      setAccounts([]);
      setLoading(false);
    });

    return () => {
      alive = false;
      if (pageLoadTimer) clearTimeout(pageLoadTimer);
    };
  }, []);

  if (loading && !contact) return <Skeleton />;

  const c = contact || {};

  return (
    <div className="space-y-4">
      <ActionButtonsBar contactId={contactId} entity={entityName} />

      <ClientHeaderCard
        name={c.Full_Name}
        email={c.Email}
        referredBy={c.Referred_By}
        status={c.Client_Status}
      />

      <div className="grid grid-cols-1 gap-4 items-start" style={{ gridTemplateColumns: '1fr' }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3">
            <CreditScoresCard record={c} />
          </div>
          <div className="lg:col-span-2">
            <DisputeStatusTable counts={counts} />
          </div>
        </div>
      </div>

      <AccountsDetailTable
        contactId={contactId}
        accounts={accounts}
        entityName={entityName}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DisputeWidget />);
