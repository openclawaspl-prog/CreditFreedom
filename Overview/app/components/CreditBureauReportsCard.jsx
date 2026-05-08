/*
  CircleGauge — full 360° ring gauge using strokeDasharray
  Rotated -90° so fill starts from 12-o'clock (top)
  Circumference = 2π × r
*/
function CircleGauge({ score, max, color }) {
  const r    = 38;
  const cx   = 50;
  const cy   = 50;
  const circ = 2 * Math.PI * r;          // ≈ 238.8
  const fill = (score / max) * circ;

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: 'auto' }}>
      {/* Gray track — full ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#f3f4f6" strokeWidth="9"
      />
      {/* Coloured progress arc — starts at top */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Score + /max on same baseline, centred in ring */}
      <text x={cx} y={cy + 5} textAnchor="middle">
        <tspan fontSize="14" fontWeight="700" fill="#111827">{score}</tspan>
        <tspan fontSize="9" fill="#9ca3af">/{max}</tspan>
      </text>
    </svg>
  );
}

function BureauCol({ name, score, color, progress, delta }) {
  const positive = delta >= 0;
  return (
    <div className="flex-1 min-w-0">

      {/* Name left — Good badge right */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700 truncate mr-1">{name}</span>
        <span className="flex-shrink-0 text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md leading-tight">
          Good
        </span>
      </div>

      {/* Ring gauge */}
      <CircleGauge score={score} max={850} color={color} />

      {/* Progress bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500">Progress</span>
          <span className="text-[10px] font-bold text-gray-700">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>
      </div>

      {/* Delta row */}
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] font-semibold whitespace-nowrap ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? '+' : ''}{delta} points
        </span>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">this month</span>
      </div>

    </div>
  );
}

function CreditBureauReportsCard() {
  const bureaus = [
    { name: 'Equifax',    score: 720, color: '#ec4899', progress: 72, delta:  15 },
    { name: 'Experian',   score: 703, color: '#818cf8', progress: 70, delta:  -5 },
    { name: 'TransUnion', score: 735, color: '#a78bfa', progress: 73, delta:  20 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Credit Bureau Reports</h2>
      <div className="flex gap-4">
        {bureaus.map((b, i) => (
          <React.Fragment key={b.name}>
            <BureauCol {...b} />
            {i < bureaus.length - 1 && (
              <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

window.CreditBureauReportsCard = CreditBureauReportsCard;
