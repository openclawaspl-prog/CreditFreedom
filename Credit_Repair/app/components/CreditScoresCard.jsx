/*
  SpeedometerGauge — geometry matches Overview/CreditBureauReportsCard exactly
  cx=60, cy=70, r=50, viewBox="0 0 120 100"
  Arc: M 10 70 A 50 50 0 0 1 110 70  (sweep-flag=1 → clockwise → top arch)
  Needle: π + ratio×π  (left→up→right via 3π/2 = up)
  Gradient: dark-red → green, userSpaceOnUse x:10→110
*/
function SpeedometerGauge({ score, max, uid }) {
  const cx = 60, cy = 70, r = 50;
  const ratio = Math.min(Math.max(score / max, 0), 1);
  const needleAngle = Math.PI + ratio * Math.PI;
  const nLen = r - 13;
  const nx = cx + nLen * Math.cos(needleAngle);
  const ny = cy + nLen * Math.sin(needleAngle);
  const gid = `sg-cf-${uid}`;

  return (
    <svg viewBox="0 0 120 100" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={gid} x1="10" y1="0" x2="110" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="25%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="75%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* Gray background track */}
      <path d="M 10 70 A 50 50 0 0 1 110 70"
        fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />

      {/* Gradient colour track */}
      <path d="M 10 70 A 50 50 0 0 1 110 70"
        fill="none" stroke={`url(#${gid})`} strokeWidth="10" strokeLinecap="round" />

      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4.5" fill="#1f2937" />
      <circle cx={cx} cy={cy} r="2" fill="white" />

      {/* Score label */}
      <text x={cx} y={cy + 16} textAnchor="middle">
        <tspan fontSize="14" fontWeight="700" fill="#111827">{score}</tspan>
        <tspan fontSize="9" fill="#9ca3af">/{max}</tspan>
      </text>
    </svg>
  );
}

function ScoreCol({ name, score, max, delta }) {
  const progress = Math.round((score / max) * 100);
  const positive = delta >= 0;

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{name}</p>

      <SpeedometerGauge score={score} max={max} uid={name} />

      {/* Progress bar */}
      <div className="mt-1">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-gray-500 font-medium">Progress</span>
          <span className="font-bold text-gray-800">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gray-800 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Delta */}
      <div className="flex items-center justify-between mt-1.5 text-[11px]">
        <span className={`font-semibold whitespace-nowrap ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? '+' : ''}{delta} points
        </span>
        <span className="text-gray-400 whitespace-nowrap">this month</span>
      </div>
    </div>
  );
}

function CreditScoresCard({ record }) {
  const MAX = 900;
  const cols = [
    { name: 'Equifax', score: Number(record.Equifax_Score) || 0, delta: Number(record.Equifax_Delta) || 0 },
    { name: 'Experian', score: Number(record.Experin_Score) || 0, delta: Number(record.Experian_Delta) || 0 },
    { name: 'TransUnion', score: Number(record.Transunion_Score) || 0, delta: Number(record.Transunion_Delta) || 0 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <div className="flex gap-4">
        {cols.map((c, i) => (
          <React.Fragment key={c.name}>
            <ScoreCol {...c} max={MAX} />
            {i < cols.length - 1 && (
              <div className="w-px flex-shrink-0 self-stretch bg-gray-100" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

window.CreditScoresCard = CreditScoresCard;
