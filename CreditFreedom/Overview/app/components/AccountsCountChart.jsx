/*
  AccountsCountChart
  - Fetches Client_Account related records from the current Contact
  - One bar per block_type value (7 bars total)
  - Bar height = total accounts with that block_type across all bureaus
  - Hover tooltip = bureau breakdown (Equifax / TransUnion / Experian counts)

  block_type picklist: 'late'|'new'|'start'|'charged'|'closed'|'account_change'|'removed'
  Bureau field in Client_Account: 'Bureau'  ← update if field API name differs
*/
const { useState: useAcctState, useEffect: useAcctEffect } = React;

const BUREAUS = ['Equifax', 'TransUnion', 'Experian'];
const LABELS = { Equifax: 'Equifax', TransUnion: 'TransUnion', Experian: 'Experian' };
const BUREAU_COLORS = {
  Equifax: '#ec4899',
  TransUnion: '#818cf8',
  Experian: '#a78bfa',
};
const BUREAU_HOVER_COLORS = {
  Equifax: '#db2777',
  TransUnion: '#6366f1',
  Experian: '#8b5cf6',
};

/* Chart layout constants */
const CW = 420, CH = 290;
const PL = 32, PR = 12, PT = 18, PB = 70;
const IW = CW - PL - PR;
const IH = CH - PT - PB;
const SLOT_W = IW / BUREAUS.length;
const BAR_W  = Math.min(SLOT_W * 0.55, 42);

function barTop(val, maxVal) { return PT + IH - (val / maxVal) * IH; }
function barHt(val, maxVal)  { return (val / maxVal) * IH; }

function normalizeBureau(val) {
  const s = String(val || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  if (s === 'equifax')    return 'Equifax';
  if (s === 'transunion') return 'TransUnion';
  if (s === 'experian')   return 'Experian';
  return '';
}

function buildCounts(accounts) {
  const counts = {};
  BUREAUS.forEach(bureau => {
    counts[bureau] = { total: 0 };
  });
  (accounts || []).forEach(acc => {
    const bureau = normalizeBureau(acc.Creditor);
    if (!bureau || !counts[bureau]) return;
    counts[bureau].total++;
  });
  return counts;
}

function niceYTicks(maxVal) {
  if (maxVal === 0) return [0];
  const raw  = maxVal * 1.15;
  const step = raw <= 5 ? 1 : raw <= 10 ? 2 : raw <= 25 ? 5 : raw <= 50 ? 10 : raw <= 100 ? 20 : 50;
  const ticks = [];
  for (let v = 0; v <= raw + step; v += step) ticks.push(v);
  return ticks;
}

async function fetchClientAccountsByClientId(clientId) {
  if (!clientId || !ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) return [];

  const all = [];
  const perPage = 200;
  const query = `(Client_ID:equals:${clientId})`;

  for (let page = 1; page <= 10; page++) {
    const resp = await ZOHO.CRM.API.searchRecord({
      Entity: 'Client_Account',
      Type: 'criteria',
      Query: query,
    }, page, perPage);

    const data = (resp && resp.data) || [];
    all.push(...data);

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  return all;
}

function AccountsCountChart() {
  const [rawAccounts, setRawAccounts] = useAcctState([]);
  const [hovered,     setHovered]     = useAcctState(null);  // creditor/bureau key

  useAcctEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      fetchClientAccountsByClientId(data.EntityId)
        .then(accounts => setRawAccounts(accounts))
        .catch(() => setRawAccounts([]))
        .finally(() => window.OverviewWidget.requestResize());
    });
  }, []);

  const counts  = buildCounts(rawAccounts);
  const maxVal  = Math.max(...BUREAUS.map(b => counts[b].total), 1);
  const yTicks  = niceYTicks(maxVal);

  /* Tooltip: position above the hovered bar's center */
  function tooltipX(i) {
    const cx = PL + SLOT_W * i + SLOT_W / 2;
    const ttW = 118;
    return Math.min(Math.max(cx - ttW / 2, 2), CW - ttW - 2);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-1">Account's Count</h2>

      {/* Bureau legend */}
      <div className="flex items-center gap-4 mb-3">
        {BUREAUS.map(name => (
          <div key={name} className="flex items-center gap-1.5">
            <span style={{ width:8, height:8, borderRadius:'50%', background:BUREAU_COLORS[name], display:'inline-block' }} />
            <span className="text-[11px] text-gray-500">{name}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${CW} ${CH}`}
        style={{ width: '100%', height: 'auto' }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Y-axis gridlines + tick labels */}
        {yTicks.map(tick => {
          const y = barTop(tick, Math.max(...yTicks));
          return (
            <g key={tick}>
              <line x1={PL} y1={y} x2={CW - PR} y2={y}
                stroke={tick === 0 ? '#e5e7eb' : '#f3f4f6'} strokeWidth="1" />
              <text x={PL - 5} y={y + 4} textAnchor="end" fontSize="13" fill="black">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {BUREAUS.map((bureau, i) => {
          const total  = counts[bureau].total;
          const mxTick = Math.max(...yTicks);
          const cx     = PL + SLOT_W * i + SLOT_W / 2;
          const bX     = cx - BAR_W / 2;
          const bY     = barTop(total, mxTick);
          const bH     = barHt(total, mxTick);
          const isHov  = hovered === bureau;
          const rx     = 4;

          const barPath = bH > rx
            ? `M ${bX+rx} ${bY} H ${bX+BAR_W-rx} Q ${bX+BAR_W} ${bY} ${bX+BAR_W} ${bY+rx} V ${bY+bH} H ${bX} V ${bY+rx} Q ${bX} ${bY} ${bX+rx} ${bY} Z`
            : `M ${bX} ${bY} H ${bX+BAR_W} V ${bY+Math.max(bH,2)} H ${bX} Z`;

          return (
            <g
              key={bureau}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(bureau)}
            >
              {/* Invisible wider hit area for easier hover */}
              <rect x={bX - 6} y={PT} width={BAR_W + 12} height={IH + 4} fill="transparent" />

              {/* Bar */}
              <path d={barPath} fill={isHov ? BUREAU_HOVER_COLORS[bureau] : BUREAU_COLORS[bureau]} />

              {/* Value label on top */}
              {total > 0 && (
                <text x={cx} y={bY - 4} textAnchor="middle" fontSize="12" fontWeight="500" fill="#374151">
                  {total}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={cx} y={CH - 24}
                textAnchor="middle"
                fontSize="13" fill={isHov ? BUREAU_HOVER_COLORS[bureau] : 'black'}
                fontWeight={isHov ? '600' : '400'}
              >
                {LABELS[bureau]}
              </text>
            </g>
          );
        })}

        {/* Hover tooltip (SVG-native, no positioning issues) */}
        {hovered && (() => {
          const i      = BUREAUS.indexOf(hovered);
          const data   = counts[hovered];
          const ttX    = tooltipX(i);
          const barCY  = barTop(data.total, Math.max(...yTicks));
          const ttY    = Math.max(barCY - 72, PT + 2);
          const ttW    = 118;
          const ttH    = 68;
          return (
            <g pointerEvents="none">
              <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="6"
                fill="#111827" opacity="0.92" />
              <text x={ttX + 9} y={ttY + 15} fontSize="10.5" fontWeight="700" fill="white">
                {LABELS[hovered]}: {data.total}
              </text>
              <text x={ttX + 9} y={ttY + 34} fontSize="10" fill="#d1d5db">
                Total accounts: {data.total}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

window.AccountsCountChart = AccountsCountChart;
