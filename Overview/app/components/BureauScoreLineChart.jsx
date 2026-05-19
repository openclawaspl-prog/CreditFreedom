const { useState: useBureauScoreState, useEffect: useBureauScoreEffect } = React;

const SCORE_BUREAUS = ['Equifax', 'Experian', 'TransUnion'];
const SCORE_COLORS = {
  Equifax: '#ec4899',
  Experian: '#8b5cf6',
  TransUnion: '#6366f1',
};
const SCORE_FILL_COLORS = {
  Equifax: 'rgba(236, 72, 153, 0.10)',
  Experian: 'rgba(139, 92, 246, 0.10)',
  TransUnion: 'rgba(99, 102, 241, 0.12)',
};

const SCORE_CW = 960;
const SCORE_CH = 300;
const SCORE_PL = 42;
const SCORE_PR = 24;
const SCORE_PT = 26;
const SCORE_PB = 64;
const SCORE_IW = SCORE_CW - SCORE_PL - SCORE_PR;
const SCORE_IH = SCORE_CH - SCORE_PT - SCORE_PB;
const SCORE_EDGE_PAD = 18;

function normalizeScoreBureau(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (text === 'equifax') return 'Equifax';
  if (text === 'experian') return 'Experian';
  if (text === 'transunion') return 'TransUnion';
  return '';
}

function normalizeScoreClientId(value) {
  if (!value) return '';
  if (Array.isArray(value)) return normalizeScoreClientId(value[0]);
  if (typeof value === 'object') {
    return String(value.id || value.ID || value.record_id || value.RecordID || '').trim();
  }
  return String(value).trim();
}

function parseScoreNumber(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function getScoreTime(record) {
  const raw = record.Created_Time || record.CreatedTime || record.Modified_Time || '';
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function formatScoreDate(timestamp) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatScoreDateTime(timestamp) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildScoreSeries(records) {
  const series = {};
  SCORE_BUREAUS.forEach((bureau) => { series[bureau] = []; });

  (records || [])
    .map((record) => {
      const bureau = normalizeScoreBureau(record.Creditor);
      const score = parseScoreNumber(record.Creditor_Score);
      const timestamp = getScoreTime(record);
      return bureau && score !== null ? { bureau, score, timestamp } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((point) => {
      series[point.bureau].push(point);
    });

  return series;
}

function flattenScoreSeries(series) {
  return SCORE_BUREAUS.flatMap((bureau) => series[bureau] || []);
}

function niceScoreTicks(minScore, maxScore) {
  if (minScore === maxScore) {
    const lower = Math.max(0, minScore - 50);
    return [lower, minScore, minScore + 50];
  }

  const range = maxScore - minScore;
  const step = range <= 80 ? 20 : range <= 180 ? 50 : 100;
  const start = Math.max(0, Math.floor((minScore - step) / step) * step);
  const end = Math.ceil((maxScore + step) / step) * step;
  const ticks = [];
  for (let value = start; value <= end; value += step) ticks.push(value);
  return ticks;
}

function catmullRomToBezier(points) {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function linearScorePath(points) {
  if (!points.length) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function distanceToScoreSegment(mouse, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (!lengthSquared) {
    return Math.hypot(mouse.x - start.x, mouse.y - start.y);
  }

  const t = Math.max(0, Math.min(1, ((mouse.x - start.x) * dx + (mouse.y - start.y) * dy) / lengthSquared));
  const x = start.x + t * dx;
  const y = start.y + t * dy;
  return Math.hypot(mouse.x - x, mouse.y - y);
}

async function fetchBureauScoresByClientId(clientId) {
  if (!clientId || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.API || !ZOHO.CRM.API.searchRecord) return [];

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

  return all;
}

function BureauScoreLineChart() {
  const [records, setRecords] = useBureauScoreState([]);
  const [loading, setLoading] = useBureauScoreState(false);
  const [error, setError] = useBureauScoreState('');
  const [hovered, setHovered] = useBureauScoreState(null);

  useBureauScoreEffect(() => {
    return window.OverviewWidget.onPageLoad((data) => {
      const clientId = normalizeScoreClientId(data && data.EntityId);
      setLoading(true);
      setError('');

      fetchBureauScoresByClientId(clientId)
        .then((rows) => setRecords(rows))
        .catch(() => {
          setRecords([]);
          setError('Failed to load bureau score data.');
        })
        .finally(() => {
          setLoading(false);
          window.OverviewWidget.requestResize();
        });
    });
  }, []);

  const series = buildScoreSeries(records);
  const allPoints = flattenScoreSeries(series);
  const orderedPoints = allPoints
    .slice()
    .sort((a, b) => {
      if ((a.timestamp || 0) !== (b.timestamp || 0)) return (a.timestamp || 0) - (b.timestamp || 0);
      return SCORE_BUREAUS.indexOf(a.bureau) - SCORE_BUREAUS.indexOf(b.bureau);
    });
  const slotByPoint = new WeakMap();
  orderedPoints.forEach((point, index) => slotByPoint.set(point, index));
  const scoreValues = allPoints.map((point) => point.score);
  const yTicks = scoreValues.length
    ? niceScoreTicks(Math.min(...scoreValues), Math.max(...scoreValues))
    : [300, 450, 600, 750, 900];
  const yMin = Math.min(...yTicks);
  const yMax = Math.max(...yTicks);

  function xForSlot(slot, count) {
    if (count <= 1) return SCORE_PL + SCORE_IW / 2;
    return SCORE_PL + SCORE_EDGE_PAD + (slot / (count - 1)) * (SCORE_IW - SCORE_EDGE_PAD * 2);
  }

  function xForPoint(point) {
    return xForSlot(slotByPoint.get(point) || 0, Math.max(orderedPoints.length, 1));
  }

  function yFor(score) {
    if (yMax === yMin) return SCORE_PT + SCORE_IH / 2;
    return SCORE_PT + SCORE_IH - ((score - yMin) / (yMax - yMin)) * SCORE_IH;
  }

  function tooltipX(point) {
    const width = 150;
    return Math.min(Math.max(point.x - width / 2, 4), SCORE_CW - width - 4);
  }

  const plottedSeries = SCORE_BUREAUS.map((bureau) => {
    const rawPoints = series[bureau] || [];
    const points = rawPoints.map((point, index) => ({
      ...point,
      bureau,
      x: xForPoint(point),
      y: yFor(point.score),
    }));
    const linePath = linearScorePath(points);
    const areaPath = points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${SCORE_CH - SCORE_PB} L ${points[0].x} ${SCORE_CH - SCORE_PB} Z`
      : '';

    return { bureau, points, linePath, areaPath };
  });

  function handleChartMouseMove(event) {
    const svg = event.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const mouse = svgPoint.matrixTransform(ctm.inverse());
    let closest = null;

    plottedSeries.forEach(({ bureau, points }) => {
      if (!points.length) return;

      const nearestPoint = points.reduce((best, point) => (
        Math.abs(point.x - mouse.x) < Math.abs(best.x - mouse.x) ? point : best
      ), points[0]);
      let distance = Math.hypot(mouse.x - nearestPoint.x, mouse.y - nearestPoint.y);

      for (let index = 0; index < points.length - 1; index += 1) {
        distance = Math.min(distance, distanceToScoreSegment(mouse, points[index], points[index + 1]));
      }

      if (!closest || distance < closest.distance) {
        closest = { ...nearestPoint, bureau, distance };
      }
    });

    setHovered(closest && closest.distance <= 18 ? closest : null);
  }

  const labelGroups = orderedPoints.reduce((groups, point, index) => {
    const label = formatScoreDate(point.timestamp);
    if (!groups[label]) groups[label] = { label, first: index, last: index };
    groups[label].last = index;
    return groups;
  }, {});
  const allXLabels = Object.values(labelGroups).map((group) => ({
    label: group.label,
    x: (xForSlot(group.first, Math.max(orderedPoints.length, 1)) + xForSlot(group.last, Math.max(orderedPoints.length, 1))) / 2,
  }));
  const xLabels = allXLabels.length <= 5
    ? allXLabels
    : allXLabels.filter((_, index) => index === 0 || index === allXLabels.length - 1 || index % Math.ceil(allXLabels.length / 4) === 0).slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 h-full flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">Bureau Score Trend</h2>
        <div className="flex flex-wrap items-center justify-end gap-4">
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
          {!loading && error && <span className="text-xs text-red-500">{error}</span>}
          {SCORE_BUREAUS.map((bureau) => (
            <div key={bureau} className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SCORE_COLORS[bureau], display: 'inline-block' }} />
              <span className="text-[11px] text-gray-500">{bureau}</span>
            </div>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SCORE_CW} ${SCORE_CH}`}
        className="flex-1 min-h-0"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={SCORE_PL} y1={y} x2={SCORE_CW - SCORE_PR} y2={y} stroke="#d1d5db" strokeWidth="1" strokeDasharray="3 4" />
              <text x={SCORE_PL - 8} y={y + 4} textAnchor="end" fontSize="12" fill="#111827">{tick}</text>
            </g>
          );
        })}

        <line x1={SCORE_PL} y1={SCORE_CH - SCORE_PB} x2={SCORE_CW - SCORE_PR} y2={SCORE_CH - SCORE_PB} stroke="#c7ccd4" />
        <text x={14} y={SCORE_PT + SCORE_IH / 2} textAnchor="middle" fontSize="13" fontWeight="600" fill="#111827" transform={`rotate(-90 14 ${SCORE_PT + SCORE_IH / 2})`}>Score</text>
        <text x={SCORE_PL + SCORE_IW / 2} y={SCORE_CH - 10} textAnchor="middle" fontSize="13" fontWeight="600" fill="#111827">Created Date</text>

        {xLabels.map((label, index) => {
          return (
            <text key={`${label.label}-${index}`} x={label.x} y={SCORE_CH - 33} textAnchor="middle" fontSize="11" fill="#111827">
              {label.label}
            </text>
          );
        })}

        {plottedSeries.map(({ bureau, points, linePath, areaPath }) => {
          return (
            <g key={bureau} pointerEvents="none">
              {areaPath && <path d={areaPath} fill={SCORE_FILL_COLORS[bureau]} />}
              {points.length > 1 && <path d={linePath} fill="none" stroke={SCORE_COLORS[bureau]} strokeWidth="2.5" strokeLinecap="round" />}
              {points.map((point, index) => (
                <g key={`${bureau}-${point.timestamp}-${index}`}>
                  <circle cx={point.x} cy={point.y} r="4.8" fill="white" stroke={SCORE_COLORS[bureau]} strokeWidth="2.5" />
                  <circle cx={point.x} cy={point.y} r="2.2" fill={SCORE_COLORS[bureau]} />
                </g>
              ))}
            </g>
          );
        })}

        {!loading && !allPoints.length && (
          <text x={SCORE_CW / 2} y={SCORE_CH / 2} textAnchor="middle" fontSize="13" fill="#9ca3af">
            No bureau score data
          </text>
        )}

        {hovered && (() => {
          const ttW = 150;
          const ttH = 72;
          const ttX = tooltipX(hovered);
          const ttY = Math.max(hovered.y - ttH - 12, SCORE_PT + 2);
          return (
            <g pointerEvents="none">
              <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="7" fill="#111827" opacity="0.94" />
              <text x={ttX + 10} y={ttY + 18} fontSize="11" fontWeight="700" fill="white">
                {hovered.bureau}: {hovered.score}
              </text>
              <text x={ttX + 10} y={ttY + 38} fontSize="10" fill="#d1d5db">
                {formatScoreDateTime(hovered.timestamp)}
              </text>
              <text x={ttX + 10} y={ttY + 55} fontSize="10" fill="#d1d5db">
                Created Time
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

window.BureauScoreLineChart = BureauScoreLineChart;
