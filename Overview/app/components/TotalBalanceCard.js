(() => {
  // TotalBalanceCard.jsx
  function DonutRing({ value, total, color }) {
    const r = 68;
    const cx = 90;
    const cy = 90;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - value / total);
    return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 180 180", className: "w-full max-w-[200px] mx-auto block" }, /* @__PURE__ */ React.createElement("circle", { cx, cy, r, fill: "none", stroke: "#e5e7eb", strokeWidth: "12" }), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx,
        cy,
        r,
        fill: "none",
        stroke: color,
        strokeWidth: "12",
        strokeLinecap: "round",
        strokeDasharray: circ,
        strokeDashoffset: offset,
        transform: `rotate(-90 ${cx} ${cy})`
      }
    ), /* @__PURE__ */ React.createElement("text", { x: cx, y: cy + 7, textAnchor: "middle", fontSize: "20", fontWeight: "700", fill: "#111827" }, "$", value.toFixed(2)));
  }
  function TotalBalanceCard() {
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 h-[300px] flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900" }, "Total Balance"), /* @__PURE__ */ React.createElement("button", { className: "text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors whitespace-nowrap" }, "Start Monthly Program")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(DonutRing, { value: 150, total: 1e3, color: "#818cf8" })));
  }
  window.TotalBalanceCard = TotalBalanceCard;
})();
