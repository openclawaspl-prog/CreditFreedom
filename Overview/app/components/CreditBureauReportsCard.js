(() => {
  // CreditBureauReportsCard.jsx
  function SpeedometerGauge({ value, max, gradientId }) {
    const safeValue = Math.max(0, Math.min(value, max));
    const cx = 60;
    const cy = 70;
    const r = 50;
    const startAngle = Math.PI;
    const endAngle = 0;
    const ratio = safeValue / max;
    const needleAngle = Math.PI + ratio * Math.PI;
    function polar(a) {
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    const [sx, sy] = polar(startAngle);
    const [ex, ey] = polar(endAngle);
    const needleLen = r - 10;
    const nx = cx + needleLen * Math.cos(needleAngle);
    const ny = cy + needleLen * Math.sin(needleAngle);
    return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 120 100", style: { width: "100%", height: "auto" }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "1", y2: "0" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#22c55e" }), /* @__PURE__ */ React.createElement("stop", { offset: "55%", stopColor: "#f59e0b" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#ef4444" }))), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`,
        fill: "none",
        stroke: "#e5e7eb",
        strokeWidth: "10",
        strokeLinecap: "round"
      }
    ), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`,
        fill: "none",
        stroke: `url(#${gradientId})`,
        strokeWidth: "10",
        strokeLinecap: "round"
      }
    ), /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: cx,
        y1: cy,
        x2: nx,
        y2: ny,
        stroke: "#ef4444",
        strokeWidth: "2",
        strokeLinecap: "round"
      }
    ), /* @__PURE__ */ React.createElement("circle", { cx, cy, r: "3.5", fill: "#111827" }), /* @__PURE__ */ React.createElement("text", { x: cx, y: cy + 20, textAnchor: "middle" }, /* @__PURE__ */ React.createElement("tspan", { fontSize: "12", fontWeight: "700", fill: "#111827" }, safeValue), /* @__PURE__ */ React.createElement("tspan", { fontSize: "9", fill: "#9ca3af" }, "/", max)));
  }
  function BureauCol({ name, score, color, progress, delta, gaugeId }) {
    const positive = delta >= 0;
    return /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-gray-700 truncate mr-1" }, name), /* @__PURE__ */ React.createElement("span", { className: "flex-shrink-0 text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md leading-tight" }, "Good")), /* @__PURE__ */ React.createElement(SpeedometerGauge, { value: score, max: 850, gradientId: gaugeId }), /* @__PURE__ */ React.createElement("div", { className: "mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px]" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "Progress"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-700" }, progress, "%")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "This month"), /* @__PURE__ */ React.createElement("span", { className: `font-semibold ${positive ? "text-green-600" : "text-red-500"}` }, positive ? "+" : "", delta, " pts"))));
  }
  function CreditBureauReportsCard() {
    const bureaus = [
      { name: "Equifax", score: 720, color: "#ec4899", progress: 72, delta: 15 },
      { name: "Experian", score: 703, color: "#818cf8", progress: 70, delta: -5 },
      { name: "TransUnion", score: 735, color: "#a78bfa", progress: 73, delta: 20 }
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-4" }, "Credit Bureau Reports"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4" }, bureaus.map((b, i) => /* @__PURE__ */ React.createElement(BureauCol, { key: b.name, ...b, gaugeId: `gauge-${i}` }))));
  }
  window.CreditBureauReportsCard = CreditBureauReportsCard;
})();
