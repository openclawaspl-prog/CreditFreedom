(() => {
  // ReferralCreditsCard.jsx
  var MOCK_REFERRALS = [
    { id: 1, name: "Mike Johnson", date: "Feb 10, 2026", amount: "$150" },
    { id: 2, name: "Sarah Williams", date: "Jan 28, 2026", amount: "$150" },
    { id: 3, name: "David Chen", date: "Jan 15, 2026", amount: "$150" }
  ];
  function ReferralCreditsCard() {
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900" }, "Referral Credits"), /* @__PURE__ */ React.createElement("button", { className: "text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors" }, "Add")), /* @__PURE__ */ React.createElement("div", { className: "bg-indigo-50 rounded-xl px-4 py-3 mb-4 flex items-start justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mb-1" }, "Total Referral Credits"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-gray-900" }, "$450"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-1" }, "3 successful referrals")), /* @__PURE__ */ React.createElement("span", { className: "text-2xl select-none" }, "\u{1F381}")), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-gray-100" }, MOCK_REFERRALS.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "flex items-center justify-between py-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium text-gray-800" }, r.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-0.5" }, "Referred: ", r.date)), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-green-600" }, r.amount)))));
  }
  window.ReferralCreditsCard = ReferralCreditsCard;
})();
