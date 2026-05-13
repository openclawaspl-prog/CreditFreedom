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

const BLOCK_TYPES = ['late','new','start','charged','closed','account_change','removed'];
const LABELS = {
  late: 'Late', new: 'New', start: 'Started',
  charged: 'Charged', closed: 'Closed',
  account_change: 'Acct Change', removed: 'Removed',
};
const BUREAUS = ['Equifax', 'TransUnion', 'Experian'];
const BAR_COLOR         = '#818cf8';   // indigo-400 — default
const BAR_COLOR_HOVERED = '#6366f1';   // indigo-500 — on hover

/* Chart layout constants */
const CW = 420, CH = 260;
const PL = 32, PR = 12, PT = 18, PB = 52;
const IW = CW - PL - PR;
const IH = CH - PT - PB;
const SLOT_W = IW / BLOCK_TYPES.length;
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
  BLOCK_TYPES.forEach(t => {
    counts[t] = { total: 0, Equifax: 0, TransUnion: 0, Experian: 0 };
  });
  (accounts || []).forEach(acc => {
    const type   = (acc.block_type || '').trim().toLowerCase();
    const bureau = normalizeBureau(acc.Creditor);
    if (!counts[type]) return;
    counts[type].total++;
    if (bureau) counts[type][bureau]++;
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

function AccountsCountChart() {
  const [rawAccounts, setRawAccounts] = useAcctState([]);
  const [hovered,     setHovered]     = useAcctState(null);  // block_type key

  useAcctEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      ZOHO.CRM.API.getRelatedRecords({
        Entity:      'Contacts',
        RecordID:    data.EntityId,
        RelatedList: 'Client_Account',
        page:        1,
        per_page:    200,
      })
        .then(resp => setRawAccounts((resp && resp.data) || []))
        .catch(() => {})
        .finally(() => window.OverviewWidget.requestResize());
    });
  }, []);

  const counts  = buildCounts(rawAccounts);
  const maxVal  = Math.max(...BLOCK_TYPES.map(t => counts[t].total), 1);
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
        {[['#ec4899','Equifax'],['#818cf8','TransUnion'],['#a78bfa','Experian']].map(([col,name]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span style={{ width:8, height:8, borderRadius:'50%', background:col, display:'inline-block' }} />
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
              <text x={PL - 5} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {BLOCK_TYPES.map((type, i) => {
          const total  = counts[type].total;
          const mxTick = Math.max(...yTicks);
          const cx     = PL + SLOT_W * i + SLOT_W / 2;
          const bX     = cx - BAR_W / 2;
          const bY     = barTop(total, mxTick);
          const bH     = barHt(total, mxTick);
          const isHov  = hovered === type;
          const rx     = 4;

          const barPath = bH > rx
            ? `M ${bX+rx} ${bY} H ${bX+BAR_W-rx} Q ${bX+BAR_W} ${bY} ${bX+BAR_W} ${bY+rx} V ${bY+bH} H ${bX} V ${bY+rx} Q ${bX} ${bY} ${bX+rx} ${bY} Z`
            : `M ${bX} ${bY} H ${bX+BAR_W} V ${bY+Math.max(bH,2)} H ${bX} Z`;

          return (
            <g
              key={type}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(type)}
            >
              {/* Invisible wider hit area for easier hover */}
              <rect x={bX - 6} y={PT} width={BAR_W + 12} height={IH + 4} fill="transparent" />

              {/* Bar */}
              <path d={barPath} fill={isHov ? BAR_COLOR_HOVERED : BAR_COLOR} />

              {/* Value label on top */}
              {total > 0 && (
                <text x={cx} y={bY - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#374151">
                  {total}
                </text>
              )}

              {/* X-axis label — rotated to fit */}
              <text
                x={cx} y={CH - 4}
                textAnchor="end"
                fontSize="9.5" fill={isHov ? '#4f46e5' : '#6b7280'}
                fontWeight={isHov ? '600' : '400'}
                transform={`rotate(-35, ${cx}, ${CH - 4})`}
              >
                {LABELS[type]}
              </text>
            </g>
          );
        })}

        {/* Hover tooltip (SVG-native, no positioning issues) */}
        {hovered && (() => {
          const i      = BLOCK_TYPES.indexOf(hovered);
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
              {BUREAUS.map((b, bi) => (
                <text key={b} x={ttX + 9} y={ttY + 30 + bi * 14}
                  fontSize="10" fill="#d1d5db">
                  {b}: {data[b]}
                </text>
              ))}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

window.AccountsCountChart = AccountsCountChart;
