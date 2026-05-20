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

function SpeedometerGauge({ value, min = 300, max, gradientId }) {
  const safeValue = Math.max(0, Math.min(value, max));
  const displayValue = Math.round(safeValue);
  const ratio = safeValue > 0 ? (Math.max(min, safeValue) - min) / (max - min) : 0;
  const cx = 120;
  
  const cy = 145;
  const arcRadius = 97;
  const innerRadius = 57;
  const needleBaseRadius = innerRadius - 2;
  const needleTipRadius = 93;
  const needleHalfWidth = 11;
  const needleDeg = 180 - ratio * 180;
  const arcGradientId = `${gradientId}-arc`;
  const scoreFillId = `${gradientId}-score-fill`;
  const needleFillId = `${gradientId}-needle`;
  const arcShadowId = `${gradientId}-arc-shadow`;
  const scoreShadowId = `${gradientId}-score-shadow`;

  function polar(radius, angleDeg) {
    const angle = (angleDeg * Math.PI) / 180;
    return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
  }

  function arcPath(radius, fromDeg, toDeg) {
    const [sx, sy] = polar(radius, fromDeg);
    const [ex, ey] = polar(radius, toDeg);
    const largeArc = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`;
  }

  function getActiveScoreStyle(scoreRatio) {
    if (scoreRatio < 0.25) {
      return { from: '#e00000', to: '#ff2f12', text: 'white' };
    }
    if (scoreRatio < 0.5) {
      return { from: '#ff5f14', to: '#ff9418', text: 'white' };
    }
    if (scoreRatio < 0.7) {
      return { from: '#ffd400', to: '#fff05a', text: '#374151' };
    }
    return { from: '#35d85f', to: '#079642', text: 'white' };
  }

  const activeScoreStyle = getActiveScoreStyle(ratio);
  const needleAngle = (needleDeg * Math.PI) / 180;
  const [needleBaseX, needleBaseY] = polar(needleBaseRadius, needleDeg);
  const [needleTipX, needleTipY] = polar(needleTipRadius, needleDeg);
  const perpendicularX = -Math.sin(needleAngle);
  const perpendicularY = -Math.cos(needleAngle);
  const needleLeftX = needleBaseX + perpendicularX * needleHalfWidth;
  const needleLeftY = needleBaseY + perpendicularY * needleHalfWidth;
  const needleRightX = needleBaseX - perpendicularX * needleHalfWidth;
  const needleRightY = needleBaseY - perpendicularY * needleHalfWidth;

  return (
    <svg viewBox="0 0 240 170" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={arcGradientId} x1="22" y1="145" x2="218" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e00000" />
          <stop offset="25%" stopColor="#ff3012" />
          <stop offset="43%" stopColor="#ff8a18" />
          <stop offset="58%" stopColor="#ffd800" />
          <stop offset="70%" stopColor="#fff35d" />
          <stop offset="84%" stopColor="#35d85f" />
          <stop offset="100%" stopColor="#079b45" />
        </linearGradient>
        <linearGradient id={scoreFillId} x1="63" y1="89" x2="177" y2="157" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={activeScoreStyle.from} />
          <stop offset="100%" stopColor={activeScoreStyle.to} />
        </linearGradient>
        <linearGradient id={needleFillId} x1="76" y1="70" x2="135" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <filter id={arcShadowId} x="-20%" y="-25%" width="140%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#64748b" floodOpacity="0.18" />
        </filter>
        <filter id={scoreShadowId} x="-25%" y="-35%" width="150%" height="165%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#64748b" floodOpacity="0.18" />
        </filter>
      </defs>

      <path
        d={arcPath(arcRadius, 180, 0)}
        fill="none"
        stroke="#e4ebf1"
        strokeWidth="38"
        strokeLinecap="butt"
        filter={`url(#${arcShadowId})`}
      />

      <path
        d={arcPath(arcRadius, 180, 0)}
        fill="none"
        stroke={`url(#${arcGradientId})`}
        strokeWidth="32"
        strokeLinecap="butt"
      />

      <path
        d={`M ${cx - innerRadius} ${cy} A ${innerRadius} ${innerRadius} 0 0 1 ${cx + innerRadius} ${cy} L ${cx - innerRadius} ${cy} Z`}
        fill={`url(#${scoreFillId})`}
        stroke="#dfe7ee"
        strokeWidth="5"
        filter={`url(#${scoreShadowId})`}
      />

      <polygon
        points={`${needleLeftX},${needleLeftY} ${needleTipX},${needleTipY} ${needleRightX},${needleRightY}`}
        fill={`url(#${needleFillId})`}
      />

      <text x={cx} y="132" textAnchor="middle">
        <tspan fontSize="38" fontWeight="800" fill={activeScoreStyle.text}>{displayValue}</tspan>
      </text>
    </svg>
  );
}

function BureauCol({ name, score, max, gaugeId, logoSrc }) {
  const logoClass = name === 'Experian'
    ? 'h-9 w-auto max-w-[150px] object-contain'
    : 'h-7 w-auto max-w-[150px] object-contain';

  return (
    <div className="flex h-full w-full min-w-0 flex-col items-center text-center">
      <div className="flex h-10 w-full items-center justify-center">
        <img
          src={logoSrc}
          alt={name}
          className={logoClass}
        />
      </div>

      <div className="flex h-[135px] w-full items-center justify-center">
        <div className="h-[122px] w-[185px] max-w-full">
          <SpeedometerGauge value={score} max={max} gradientId={gaugeId} />
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
    { name: 'Equifax', score: toScore(scores.Equifax), logoSrc: './assets/equifax-logo.svg' },
    { name: 'Experian', score: toScore(scores.Experian), logoSrc: './assets/experian-logo.svg' },
    { name: 'TransUnion', score: toScore(scores.TransUnion), logoSrc: './assets/transunion-logo.svg' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full min-h-[240px] px-4 py-3">
      {(loading || error) && (
        <div className="mb-3 flex justify-end">
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
          {!loading && error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}
      <div className="grid min-h-[214px] grid-cols-1 content-center gap-2 sm:grid-cols-3">
        {bureaus.map((b, i) => (
          <div key={b.name} className="py-1 first:pt-0 last:pb-0 sm:flex sm:px-2 sm:py-0">
            <BureauCol {...b} max={MAX_SCORE} gaugeId={`gauge-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.CreditBureauReportsCard = CreditBureauReportsCard;
