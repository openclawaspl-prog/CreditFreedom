(() => {
  // AccountsCountChart.jsx
  function AccountsCountChart() {
    const data = [
      { name: "Equifax", value: 35, color: "#c4b5fd" },
      { name: "Experian", value: 55, color: "#a5b4fc" },
      { name: "TransUnion", value: 75, color: "#93c5fd" }
    ];
    const chartHeight = 280;
    const chartWidth = 420;
    const paddingLeft = 50;
    const paddingBottom = 40;
    const paddingTop = 20;
    const paddingRight = 20;
    const maxValue = 90;
    const yTicks = [0, 15, 30, 45, 60, 75];
    const innerHeight = chartHeight - paddingTop - paddingBottom;
    const innerWidth = chartWidth - paddingLeft - paddingRight;
    const barWidth = 65;
    const totalBars = data.length;
    const slotWidth = innerWidth / totalBars;
    function getY(val) {
      return paddingTop + innerHeight - val / maxValue * innerHeight;
    }
    function getBarHeight(val) {
      return val / maxValue * innerHeight;
    }
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-1" }, "Account's Count"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 mb-4" }, data.map((d) => /* @__PURE__ */ React.createElement("div", { key: d.name, className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", backgroundColor: d.color, display: "inline-block" } }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-500" }, d.name)))), /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${chartWidth} ${chartHeight}`, style: { width: "100%", height: "auto" }, "aria-label": "Account's Count bar chart" }, yTicks.map((tick) => {
      const y = getY(tick);
      return /* @__PURE__ */ React.createElement("g", { key: tick }, /* @__PURE__ */ React.createElement("text", { x: paddingLeft - 8, y: y + 4, textAnchor: "end", fontSize: "11", fill: "#9ca3af" }, tick));
    }), data.map((d, i) => {
      const slotCenterX = paddingLeft + slotWidth * i + slotWidth / 2;
      const barX = slotCenterX - barWidth / 2;
      const barY = getY(d.value);
      const barH = getBarHeight(d.value);
      const rx = 6;
      return /* @__PURE__ */ React.createElement("g", { key: d.name }, /* @__PURE__ */ React.createElement(
        "path",
        {
          d: `
                  M ${barX + rx} ${barY}
                  H ${barX + barWidth - rx}
                  Q ${barX + barWidth} ${barY} ${barX + barWidth} ${barY + rx}
                  V ${barY + barH}
                  H ${barX}
                  V ${barY + rx}
                  Q ${barX} ${barY} ${barX + rx} ${barY}
                  Z
                `,
          fill: d.color
        }
      ), /* @__PURE__ */ React.createElement("text", { x: slotCenterX, y: chartHeight - 8, textAnchor: "middle", fontSize: "12", fontWeight: "600", fill: "#374151" }, d.name));
    }), /* @__PURE__ */ React.createElement("line", { x1: paddingLeft, y1: getY(0), x2: chartWidth - paddingRight, y2: getY(0), stroke: "#d1d5db", strokeWidth: "1" })));
  }
  window.AccountsCountChart = AccountsCountChart;
})();
