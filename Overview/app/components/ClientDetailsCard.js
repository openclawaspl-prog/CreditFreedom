(() => {
  // ClientDetailsCard.jsx
  var { useState, useEffect, useRef } = React;
  function Svg({ size = 16, className = "", children }) {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className
      },
      children
    );
  }
  var EditIcon = (p) => /* @__PURE__ */ React.createElement(Svg, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), /* @__PURE__ */ React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" }));
  var EmailIcon = (p) => /* @__PURE__ */ React.createElement(Svg, { ...p }, /* @__PURE__ */ React.createElement("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }));
  var SmsIcon = (p) => /* @__PURE__ */ React.createElement(Svg, { ...p }, /* @__PURE__ */ React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }));
  var CheckIcon = (p) => /* @__PURE__ */ React.createElement(Svg, { ...p }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }));
  var XIcon = (p) => /* @__PURE__ */ React.createElement(Svg, { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }));
  var CACHE_NS = "cf_crm_";
  var CACHE_TTL = 30 * 60 * 1e3;
  function pickFields(r) {
    return {
      id: r.id,
      Date_of_Birth: r.Date_of_Birth || null,
      Office_Phone: r.Office_Phone || null,
      Email: r.Email || null,
      Assigned_To: r.Assigned_To || null,
      Created_Time: r.Created_Time || null,
      Modified_Time: r.Modified_Time || null
    };
  }
  function cacheRead(recordId) {
    try {
      const raw = localStorage.getItem(CACHE_NS + recordId);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_NS + recordId);
        return null;
      }
      return entry.record;
    } catch {
      return null;
    }
  }
  function cacheWrite(recordId, record) {
    try {
      localStorage.setItem(CACHE_NS + recordId, JSON.stringify({
        record: pickFields(record),
        ts: Date.now()
      }));
    } catch {
    }
  }
  function hasChanged(cached, fresh) {
    if (!cached || !fresh) return true;
    return cached.Modified_Time !== fresh.Modified_Time;
  }
  function fmtDate(str) {
    if (!str) return "\u2014";
    const d = new Date(str);
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
  }
  function fmtDateTime(str) {
    if (!str) return "\u2014";
    const d = new Date(str);
    const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${day} at ${t}`;
  }
  function mapRecord(r) {
    const assigned = r.Assigned_To;
    return {
      dateOfBirth: fmtDate(r.Date_of_Birth),
      assignedTo: assigned ? typeof assigned === "object" ? assigned.name : assigned : "\u2014",
      officePhone: r.Office_Phone || "\u2014",
      primaryEmail: r.Email || "\u2014",
      created: fmtDateTime(r.Created_Time),
      updated: fmtDateTime(r.Modified_Time)
    };
  }
  function Bone({ w = "w-full", h = "h-4" }) {
    return /* @__PURE__ */ React.createElement("div", { className: `${w} ${h} rounded bg-gray-200 animate-pulse` });
  }
  function CardSkeleton() {
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 h-[480px]" }, /* @__PURE__ */ React.createElement(Bone, { w: "w-28", h: "h-5" }), /* @__PURE__ */ React.createElement("div", { className: "mt-2 divide-y divide-gray-100" }, [0, 1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "flex justify-between items-center py-3" }, /* @__PURE__ */ React.createElement(Bone, { w: "w-24" }), /* @__PURE__ */ React.createElement(Bone, { w: "w-36" })))), /* @__PURE__ */ React.createElement("div", { className: "mt-3 pt-4 border-t border-gray-200 flex gap-2" }, [0, 1, 2].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "flex-1 h-10 rounded-lg bg-gray-200 animate-pulse" }))));
  }
  function DisplayRow({ label, value, bold = false }) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-6 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-500 shrink-0 w-28" }, label), /* @__PURE__ */ React.createElement("span", { className: `text-sm text-right break-words max-w-xs ${bold ? "font-semibold text-gray-900" : "font-normal text-gray-800"}` }, value));
  }
  function EditRow({ label, field, value, type = "text", autoFocus = false, onChange }) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 py-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-500 shrink-0 w-28" }, label), /* @__PURE__ */ React.createElement(
      "input",
      {
        type,
        value,
        autoFocus,
        onChange: (e) => onChange(field, e.target.value),
        className: "flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all"
      }
    ));
  }
  function ClientDetailsCard() {
    const [client, setClient] = useState(null);
    const [rawRecord, setRawRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editVals, setEditVals] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const editValsRef = useRef({});
    useEffect(() => {
      editValsRef.current = editVals;
    }, [editVals]);
    useEffect(() => {
      ZOHO.embeddedApp.on("PageLoad", (data) => {
        const recordId = data.EntityId;
        const cached = cacheRead(recordId);
        if (cached) {
          setRawRecord(cached);
          setClient(mapRecord(cached));
          setLoading(false);
          setRefreshing(true);
        }
        ZOHO.CRM.API.getRecord({ Entity: "Contacts", RecordID: recordId }).then((res) => {
          if (res.data?.[0]) {
            const fresh = res.data[0];
            if (hasChanged(cached, fresh)) {
              setRawRecord(fresh);
              setClient(mapRecord(fresh));
            }
            cacheWrite(recordId, fresh);
          } else if (!cached) {
            setError("Record not found.");
          }
        }).catch(() => {
          if (!cached) setError("Failed to load client data.");
        }).finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
      });
      ZOHO.embeddedApp.init();
    }, []);
    useEffect(() => {
      if (!isEditing) return;
      const onKey = (e) => {
        if (e.key === "Escape") doCancel();
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
          doSave(editValsRef.current);
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [isEditing]);
    function startEdit() {
      setEditVals({
        Date_of_Birth: rawRecord.Date_of_Birth || "",
        Office_Phone: rawRecord.Office_Phone || "",
        Email: rawRecord.Email || ""
      });
      setSaveError(null);
      setIsEditing(true);
    }
    function doCancel() {
      setIsEditing(false);
      setEditVals({});
      setSaveError(null);
    }
    function handleFieldChange(field, value) {
      setEditVals((prev) => ({ ...prev, [field]: value }));
    }
    function doSave(vals) {
      setSaving(true);
      setSaveError(null);
      ZOHO.CRM.API.updateRecord({
        Entity: "Contacts",
        APIData: {
          id: rawRecord.id,
          Date_of_Birth: vals.Date_of_Birth || null,
          Office_Phone: vals.Office_Phone || null,
          Email: vals.Email || null
        },
        Trigger: ["workflow"]
      }).then(() => ZOHO.CRM.API.getRecord({ Entity: "Contacts", RecordID: rawRecord.id })).then((res) => {
        if (res.data?.[0]) {
          const fresh = res.data[0];
          setRawRecord(fresh);
          setClient(mapRecord(fresh));
          cacheWrite(rawRecord.id, fresh);
        }
        setIsEditing(false);
        setEditVals({});
      }).catch(() => setSaveError("Save failed. Please try again.")).finally(() => setSaving(false));
    }
    if (loading) return /* @__PURE__ */ React.createElement(CardSkeleton, null);
    if (error) return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-10 text-center h-[480px] flex items-center justify-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-red-500" }, error));
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col h-[480px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900" }, "Client Details"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, refreshing && !isEditing && /* @__PURE__ */ React.createElement(
      "div",
      {
        title: "Refreshing\u2026",
        className: "w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin"
      }
    ), isEditing && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400" }, "Enter \xB7 Esc"))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 divide-y divide-gray-100" }, isEditing ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(EditRow, { label: "Date of Birth", field: "Date_of_Birth", value: editVals.Date_of_Birth, type: "date", autoFocus: true, onChange: handleFieldChange }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Assigned To", value: client.assignedTo, bold: true }), /* @__PURE__ */ React.createElement(EditRow, { label: "Office Phone", field: "Office_Phone", value: editVals.Office_Phone, type: "tel", onChange: handleFieldChange }), /* @__PURE__ */ React.createElement(EditRow, { label: "Primary Email", field: "Email", value: editVals.Email, type: "email", onChange: handleFieldChange }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Created", value: client.created, bold: true }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Updated", value: client.updated, bold: true })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(DisplayRow, { label: "Date of Birth", value: client.dateOfBirth }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Assigned To", value: client.assignedTo, bold: true }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Office Phone", value: client.officePhone }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Primary Email", value: client.primaryEmail }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Created", value: client.created, bold: true }), /* @__PURE__ */ React.createElement(DisplayRow, { label: "Updated", value: client.updated, bold: true }))), saveError && /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-xs text-red-500 text-center" }, saveError), /* @__PURE__ */ React.createElement("div", { className: "mt-auto" }, /* @__PURE__ */ React.createElement("div", { className: "border-t border-gray-200 mt-3 mb-3" }), isEditing ? /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => doSave(editVals),
        disabled: saving,
        className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      },
      /* @__PURE__ */ React.createElement(CheckIcon, { size: 14 }),
      saving ? "Saving\u2026" : "Save"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: doCancel,
        disabled: saving,
        className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      },
      /* @__PURE__ */ React.createElement(XIcon, { size: 14 }),
      "Cancel"
    )) : /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: startEdit,
        className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-medium transition-colors"
      },
      /* @__PURE__ */ React.createElement(EditIcon, { size: 14 }),
      "Edit"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
        },
        className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-medium transition-colors"
      },
      /* @__PURE__ */ React.createElement(EmailIcon, { size: 14 }),
      "Send Email"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
        },
        className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-sm font-medium transition-colors"
      },
      /* @__PURE__ */ React.createElement(SmsIcon, { size: 14 }),
      "Send SMS"
    ))));
  }
  window.ClientDetailsCard = ClientDetailsCard;
})();
