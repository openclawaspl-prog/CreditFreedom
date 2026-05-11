/*
  DisputeStatus widget — main entry
  Two API calls in parallel:
    1. getRecord         → Contact fields (scores, header info)
    2. getRelatedRecords → Client_Account related list (dispute counts)
  Stale-while-revalidate cache (localStorage, 30-min TTL).
  Delta check via Contact's Modified_Time.
*/
const { useState, useEffect } = React;

const CACHE_NS  = 'cf_ds_';
const CACHE_TTL = 30 * 60 * 1000;

function cacheRead(id) {
  try {
    const raw = localStorage.getItem(CACHE_NS + id);
    if (!raw) return null;
    const { ts, payload } = JSON.parse(raw);
    return Date.now() - ts > CACHE_TTL ? null : payload;
  } catch { return null; }
}

function cacheWrite(id, payload) {
  try {
    localStorage.setItem(CACHE_NS + id, JSON.stringify({ ts: Date.now(), payload }));
  } catch {}
}

/* Slim down the Contact record — only fields we render */
function pickContact(r) {
  return {
    Full_Name:        r.Full_Name        || '',
    Email:            r.Email            || '',
    /* "Referred By" lookup — API field name confirmed as Name1 */
    Referred_By:      r.Name1            || '—',
    Client_Status:    r.Client_Status    || 'Client',
    /* Credit scores (max 900) */
    Equifax_Score:    Number(r.Equifax_Score)    || 0,
    Experin_Score:    Number(r.Experin_Score)    || 0,   // "Experin" as confirmed
    Transunion_Score: Number(r.Transunion_Score) || 0,
    /* Monthly deltas — add field API names here once created in Zoho */
    Equifax_Delta:    Number(r.Equifax_Delta)    || 0,
    Experian_Delta:   Number(r.Experian_Delta)   || 0,
    Transunion_Delta: Number(r.Transunion_Delta) || 0,
    Modified_Time:    r.Modified_Time            || '',
  };
}

/*
  Build dispute counts from Client_Account related records.
  Each record has:
    block_type : 'late'|'new'|'start'|'charged'|'closed'|'account_change'|'removed'
    Bureau     : 'Equifax'|'TransUnion'|'Experian'
                 ↑ TODO: replace 'Bureau' with the actual field API name in Client_Account
  Returns: { Equifax: { late: N, new: N, … }, TransUnion: {…}, Experian: {…} }
*/
const BLOCK_TYPES = ['late', 'new', 'start', 'charged', 'closed', 'account_change', 'removed'];
const BUREAUS     = ['Equifax', 'TransUnion', 'Experian'];

/* Unwrap Zoho field — picklist returns string, lookup returns { display_value, name, id } */
function zohoStr(val) {
  if (!val) return '';
  if (typeof val === 'object') return val.display_value || val.name || val.value || '';
  return String(val);
}

function normalizeBureau(val) {
  const s = zohoStr(val).trim().toLowerCase().replace(/[\s_-]/g, '');
  if (s === 'equifax')    return 'Equifax';
  if (s === 'transunion') return 'TransUnion';
  if (s === 'experian')   return 'Experian';
  return '';
}

function buildCounts(accounts) {
  const counts = {};
  BUREAUS.forEach(b => {
    counts[b] = {};
    BLOCK_TYPES.forEach(t => { counts[b][t] = 0; });
  });

  (accounts || []).forEach(acc => {
    console.log('[CF] acc.Creditor =', acc.Creditor, '| acc.block_type =', acc.block_type);
    const bureau = normalizeBureau(acc.Creditor);
    const type   = zohoStr(acc.block_type).trim().toLowerCase();
    if (bureau && counts[bureau] && counts[bureau][type] !== undefined) {
      counts[bureau][type]++;
    }
  });

  return counts;
}

/* Resize iframe to fit content */
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

/* Loading skeleton */
function Skeleton() {
  const Bar = ({ cls }) => <div className={`h-3 bg-blue-300 rounded animate-pulse ${cls}`} />;
  return (
    <div className="space-y-4">
      <div className="rounded-xl px-6 py-5" style={{ background: '#1d4ed8' }}>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {[1,2,3,4].map(i => (
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

const DisputeWidget = () => {
  const [contact,  setContact]  = useState(null);
  const [counts,   setCounts]   = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contactId, setContactId] = useState(null);
  const [loading,  setLoading]  = useState(true);
  useDynamicHeight();

  useEffect(() => {
    /* One-time: log all related list API names on Contacts so we pick the right one */
    ZOHO.CRM.META.getRelatedLists({ Entity: 'Contacts' })
      .then(data => console.log('[CF] Contacts related lists:', JSON.stringify(data)))
      .catch(e => console.error('[CF] META error:', e));

    console.log('[CF] registering PageLoad handler');
    ZOHO.embeddedApp.on('PageLoad', (pageData) => {
      console.log('[CF] PageLoad fired, EntityId =', pageData && pageData.EntityId);
      const id = pageData.EntityId;
      setContactId(id);

      /* Instant render from cache */
      const cached = cacheRead(id);
      if (cached) {
        setContact(cached.contact);
        setCounts(cached.counts);
        setLoading(false);
      }

      /* Parallel: fetch Contact + Client_Account records */
      Promise.all([
        ZOHO.CRM.API.getRecord({
          Entity: 'Contacts',
          RecordID: id,
        }),
        ZOHO.CRM.API.searchRecords({
          Entity:   'Client_Account',
          Type:     'criteria',
          Query:    '(Contact_Name:equals:' + id + ')',
          page:     1,
          per_page: 200,
        }).then(resp => {
          console.log('[CF] searchRecords response:', JSON.stringify(resp));
          return resp;
        }).catch(e => {
          console.error('[CF] searchRecords error:', e);
          return { data: [] };
        }),
      ]).then(([contactResp, accountsResp]) => {
        if (!contactResp || !contactResp.data || !contactResp.data[0]) return;

        const rawAccounts  = (accountsResp && accountsResp.data) || [];
        const freshContact = pickContact(contactResp.data[0]);
        const freshCounts  = buildCounts(rawAccounts);

        setAccounts(rawAccounts);

        /* Always apply fresh counts (accounts change independently of contact) */
        setCounts(freshCounts);

        /* Only re-render contact fields if contact record itself changed */
        if (!cached || cached.contact.Modified_Time !== freshContact.Modified_Time) {
          setContact(freshContact);
        }

        /* Always write fresh counts to cache */
        cacheWrite(id, { contact: freshContact, counts: freshCounts });
        setLoading(false);
      });
    });

    ZOHO.embeddedApp.init();
  }, []);

  if (loading && !contact) return <Skeleton />;

  const c = contact || {};

  return (
    <div className="space-y-4">

      <ActionButtonsBar contactId={contactId} />

      <ClientHeaderCard
        name={c.Full_Name}
        email={c.Email}
        referredBy={c.Referred_By}
        status={c.Client_Status}
      />

      {/* 3:2 ratio — gauges take the wider left column */}
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

      <AccountsDetailTable contactId={contactId} accounts={accounts} />

    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<DisputeWidget />);
