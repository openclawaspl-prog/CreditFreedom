const { useEffect: useCreditBureauEffect, useState: useCreditBureauState } = React;

function toScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, number);
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
    <svg viewBox="0 0 120 100" style={{ width: '100%', height: 'auto' }} aria-hidden="true">
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

      <div className="flex h-[265px] items-center px-1">
        <SpeedometerGauge value={score} max={max} gradientId={gaugeId} />
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
  const [record, setRecord] = useCreditBureauState(null);
  const [loading, setLoading] = useCreditBureauState(true);
  const [error, setError] = useCreditBureauState('');

  useCreditBureauEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const recordId = data.EntityId;
      setLoading(true);
      setError('');

      ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: recordId })
        .then((res) => {
          const fresh = res.data?.[0];
          if (!fresh) {
            setError('Record not found.');
            setRecord(null);
            return;
          }
          setRecord(fresh);
        })
        .catch(() => {
          setError('Failed to load credit scores.');
          setRecord(null);
        })
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  const bureaus = [
    { name: 'Equifax', score: toScore(record?.Equifax_Score) },
    { name: 'Experian', score: toScore(record?.Experin_Score) },
    { name: 'TransUnion', score: toScore(record?.Transunion_Score) },
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
          <div key={b.name} className="py-4 first:pt-0 last:pb-0 sm:flex sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
            <BureauCol {...b} max={MAX_SCORE} gaugeId={`gauge-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.CreditBureauReportsCard = CreditBureauReportsCard;
