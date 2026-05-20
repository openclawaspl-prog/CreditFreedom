const { useEffect: useCreditBureauEffect, useState: useCreditBureauState } = React;

function toScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, number);
}

function normalizeCreditBureau(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (text === 'equifax') return 'Equifax';
  if (text === 'experian') return 'Experian';
  if (text === 'transunion') return 'TransUnion';
  return '';
}

function getCreditBureauRecordTime(record) {
  const raw = record.Created_Time || record.CreatedTime || record.Modified_Time || '';
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function normalizeCreditBureauClientId(value) {
  if (!value) return '';
  if (Array.isArray(value)) return normalizeCreditBureauClientId(value[0]);
  if (typeof value === 'object') {
    return String(value.id || value.ID || value.record_id || value.RecordID || '').trim();
  }
  return String(value).trim();
}

async function fetchLatestBureauScores(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) {
    return {};
  }

  const all = [];
  const perPage = 200;
  const query = `(Client:equals:${clientId})`;

  for (let page = 1; page <= 10; page++) {
    const resp = await ZOHO.CRM.API.searchRecord({
      Entity: 'Bureau_Score',
      Type: 'criteria',
      Query: query,
    }, page, perPage);

    const data = (resp && resp.data) || [];
    all.push(...data);

    const more = resp && resp.info && resp.info.more_records;
    if (!more || data.length < perPage) break;
  }

  const latestScores = {};

  all
    .slice()
    .sort((a, b) => getCreditBureauRecordTime(b) - getCreditBureauRecordTime(a))
    .forEach((record) => {
      const bureau = normalizeCreditBureau(record.Creditor);
      if (!bureau || Object.prototype.hasOwnProperty.call(latestScores, bureau)) return;
      latestScores[bureau] = toScore(record.Creditor_Score);
    });

  return latestScores;
}

function SpeedometerGauge({ value, max, gradientId }) {
  const safeValue = Math.max(0, Math.min(value, max));
  const cx = 60;
  const cy = 70;
  const r = 50;

  // Arc goes left to right (clockwise, sweep-flag=1)
  const startAngle = Math.PI;        // leftmost point
  const endAngle = 0;                // rightmost point
  const ratio = safeValue / max;
  const needleAngle = Math.PI + ratio * Math.PI; // left → right

  function polar(a) {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  const [sx, sy] = polar(startAngle);
  const [ex, ey] = polar(endAngle);

  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 120 100" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="10" y1="0" x2="110" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="25%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="75%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* Track arc — clockwise (sweep-flag=1) */}
      <path
        d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Gradient arc — clockwise (sweep-flag=1) */}
      <path
        d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4.5" fill="#1f2937" />
      <circle cx={cx} cy={cy} r="2" fill="white" />

      {/* Value */}
      <text x={cx} y={cy + 18} textAnchor="middle">
        <tspan fontSize="15" fontWeight="800" fill="#111827">{safeValue}</tspan>
        <tspan fontSize="9" fill="#9ca3af">/{max}</tspan>
      </text>
    </svg>
  );
}

function BureauCol({ name, score, max, gaugeId }) {
  const progress = Math.round((Math.max(0, Math.min(score, max)) / max) * 100);

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <p className="text-sm font-semibold text-gray-700">{name}</p>

      <div className="flex h-[270px] items-center justify-center px-1">
        <div className="h-[250px] w-[300px] max-w-full">
          <SpeedometerGauge value={score} max={max} gradientId={gaugeId} />
        </div>
      </div>

      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Progress</span>
          <span className="font-bold text-gray-800">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-green-600">+0 points</span>
          <span className="text-gray-400">this month</span>
        </div>
      </div>
    </div>
  );
}

function CreditBureauReportsCard() {
  const MAX_SCORE = 900;
  const [scores, setScores] = useCreditBureauState({});
  const [loading, setLoading] = useCreditBureauState(true);
  const [error, setError] = useCreditBureauState('');

  useCreditBureauEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const clientId = normalizeCreditBureauClientId(data && data.EntityId);
      setLoading(true);
      setError('');

      fetchLatestBureauScores(clientId)
        .then((latestScores) => {
          setScores(latestScores);
        })
        .catch(() => {
          setError('Failed to load credit scores.');
          setScores({});
        })
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  const bureaus = [
    { name: 'Equifax', score: toScore(scores.Equifax) },
    { name: 'Experian', score: toScore(scores.Experian) },
    { name: 'TransUnion', score: toScore(scores.TransUnion) },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
      {(loading || error) && (
        <div className="mb-3 flex justify-end">
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
          {!loading && error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {bureaus.map((b, i) => (
          <div key={b.name} className="py-4 first:pt-0 last:pb-0 sm:flex sm:px-5 sm:py-0">
            <BureauCol {...b} max={MAX_SCORE} gaugeId={`gauge-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.CreditBureauReportsCard = CreditBureauReportsCard;
