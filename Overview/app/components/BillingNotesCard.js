(() => {
  // BillingNotesCard.jsx
  var { useState: useBillingState } = React;
  function BillingNotesCard() {
    const [category, setCategory] = useBillingState("Happy");
    const [notes, setNotes] = useBillingState("");
    const [saving, setSaving] = useBillingState(false);
    const [saved, setSaved] = useBillingState(false);
    const categories = ["Happy", "Neutral", "Unhappy", "VIP", "At Risk"];
    function handleSave() {
      if (!notes.trim()) return;
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2e3);
      }, 800);
    }
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col h-full" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-4" }, "Billing Notes"), /* @__PURE__ */ React.createElement("div", { className: "relative mb-3" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: category,
        onChange: (e) => setCategory(e.target.value),
        className: "w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer pr-8"
      },
      categories.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c))
    ), /* @__PURE__ */ React.createElement("div", { className: "pointer-events-none absolute inset-y-0 right-3 flex items-center" }, /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "#6b7280", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" })))), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        placeholder: "Add billing notes or payment Login Credentials...",
        className: "flex-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[120px]"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end mt-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleSave,
        disabled: saving || !notes.trim(),
        className: "px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
      },
      saving ? "Saving\u2026" : saved ? "Saved \u2713" : "Save Note"
    )));
  }
  window.BillingNotesCard = BillingNotesCard;
})();
