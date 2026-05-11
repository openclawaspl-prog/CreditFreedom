(() => {
  // CreditBureauAutomationCard.jsx
  var { useState: useAutoState } = React;
  function AutoToggle({ checked, onChange }) {
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onChange(!checked),
        "aria-checked": checked,
        className: `relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-indigo-600" : "bg-gray-200"}`
      },
      /* @__PURE__ */ React.createElement("span", { className: `inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-1"}` })
    );
  }
  function UploadIcon() {
    return /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 8 12 3 7 8" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "3", x2: "12", y2: "15" }));
  }
  function PrintIcon() {
    return /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 6 2 18 2 18 9" }), /* @__PURE__ */ React.createElement("path", { d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }), /* @__PURE__ */ React.createElement("rect", { x: "6", y: "14", width: "12", height: "8" }));
  }
  function CreditBureauAutomationCard() {
    const [autoBot, setAutoBot] = useAutoState(false);
    const [selected, setSelected] = useAutoState("Equifax");
    const bureaus = ["Equifax", "TransUnion", "Experian"];
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-4" }, "Credit Bureau Automation"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-600" }, "Pick for Auto Bot (CreditKarma)"), /* @__PURE__ */ React.createElement(AutoToggle, { checked: autoBot, onChange: setAutoBot })), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2" }, "Bureau Selection"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-5" }, bureaus.map((b) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: b,
        onClick: () => setSelected(b),
        className: `flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${selected === b ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`
      },
      b
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { className: "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors" }, /* @__PURE__ */ React.createElement(UploadIcon, null), "Experian File Upload"), /* @__PURE__ */ React.createElement("button", { className: "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap" }, /* @__PURE__ */ React.createElement(PrintIcon, null), "Print Letter")));
  }
  window.CreditBureauAutomationCard = CreditBureauAutomationCard;
})();
