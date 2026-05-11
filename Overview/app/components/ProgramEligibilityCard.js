(() => {
  // ProgramEligibilityCard.jsx
  var { useState: useEligState } = React;
  function EligToggle({ checked, onChange }) {
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
  var PROGRAMS = [
    { key: "frontOfFile", emoji: "\u{1F4C1}", label: "Front of file" },
    { key: "achFile", emoji: "\u{1F4C4}", label: "ACH file" },
    { key: "financialFreedom", emoji: "\u{1F426}", label: "Financial freedom program" }
  ];
  function ProgramEligibilityCard() {
    const [programs, setPrograms] = useEligState({
      frontOfFile: false,
      achFile: false,
      financialFreedom: true
    });
    function toggle(key) {
      setPrograms((prev) => ({ ...prev, [key]: !prev[key] }));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-4" }, "Program Eligibility"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-700" }, "Loan Eligible?"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-red-500 flex-shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-red-600" }, "Not Eligible"))), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3" }, "Available Programs"), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, PROGRAMS.map(({ key, emoji, label }) => /* @__PURE__ */ React.createElement("div", { key, className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-base select-none" }, emoji), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-700" }, label)), /* @__PURE__ */ React.createElement(EligToggle, { checked: programs[key], onChange: () => toggle(key) })))));
  }
  window.ProgramEligibilityCard = ProgramEligibilityCard;
})();
