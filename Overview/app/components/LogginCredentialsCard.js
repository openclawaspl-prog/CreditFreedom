(() => {
  // LogginCredentialsCard.jsx
  var { useState, useEffect } = React;
  var CARD_DEFS = [
    {
      title: "Equifax Login",
      fields: [
        { label: "Equifax Username", api: "Equifax_Username" },
        { label: "Equifax Password", api: "Equifax_Password" },
        { label: "Equifax Notes", api: "Equifax_Notes", multiLine: true }
      ]
    },
    {
      title: "Transunion Login",
      fields: [
        { label: "Transunion Username", api: "Transunion_Username" },
        { label: "Transunion Password", api: "Transunion_Password" },
        { label: "Transunion Notes", api: "Transunion_Notes", multiLine: true },
        { label: "Otp Email", api: "Otp_Email" }
      ]
    },
    {
      title: "Experian Monitoring Login",
      fields: [
        { label: "Experian Username", api: "Experian_Username" },
        { label: "Experian Password", api: "Experian_Password" },
        { label: "URL", api: "URL", type: "url" },
        { label: "Security Answer", api: "Security_Answer" },
        { label: "Last Import", api: "Last_Import", type: "datetime" },
        { label: "PIN", api: "PIN" },
        { label: "Import Status", api: "Import_status" },
        { label: "Experian Notes", api: "Experian_Notes", multiLine: true }
      ]
    }
  ];
  function fmtDateTime(str) {
    if (!str) return "\u2014";
    const d = new Date(str);
    const day = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    return `${day} ${time}`;
  }
  function normalizeValue(value) {
    if (value === null || value === void 0 || value === "") return "\u2014";
    if (typeof value === "object") {
      return value.name || value.display_value || "\u2014";
    }
    return String(value);
  }
  function FieldRow({ label, value, multiLine = false }) {
    return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-[170px_1fr] items-start gap-3 py-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-500 whitespace-nowrap" }, label), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `text-sm text-gray-800 break-words ${multiLine ? "whitespace-pre-line" : ""}`
      },
      value
    ));
  }
  function LogginCredentialsCard({ stretch = false } = {}) {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const containerClass = `flex flex-col gap-4 w-full${stretch ? " h-full" : ""}`;
    const cardClass = `bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 w-full${stretch ? " flex-1" : ""}`;
    useEffect(() => {
      ZOHO.embeddedApp.on("PageLoad", (data) => {
        const recordId = data.EntityId;
        setLoading(true);
        setError(null);
        ZOHO.CRM.API.getRecord({ Entity: "Contacts", RecordID: recordId }).then((res) => {
          if (res.data?.[0]) {
            setRecord(res.data[0]);
          } else {
            setError("Record not found.");
          }
        }).catch(() => setError("Failed to load login credentials.")).finally(() => setLoading(false));
      });
      ZOHO.embeddedApp.init();
    }, []);
    if (loading) {
      return /* @__PURE__ */ React.createElement("div", { className: containerClass }, CARD_DEFS.map((card) => /* @__PURE__ */ React.createElement("div", { key: card.title, className: cardClass }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-2" }, card.title), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400" }, "Loading..."))));
    }
    if (error) {
      return /* @__PURE__ */ React.createElement("div", { className: `bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-8 text-center w-full${stretch ? " h-full" : ""}` }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-red-500" }, error));
    }
    return /* @__PURE__ */ React.createElement("div", { className: containerClass }, CARD_DEFS.map((card) => /* @__PURE__ */ React.createElement("div", { key: card.title, className: cardClass }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-2" }, card.title), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-gray-100" }, card.fields.map((field) => {
      const rawValue = record ? record[field.api] : null;
      let value = normalizeValue(rawValue);
      if (field.type === "datetime") value = fmtDateTime(rawValue);
      if (field.type === "url" && rawValue) {
        const url = normalizeValue(rawValue);
        value = /* @__PURE__ */ React.createElement(
          "a",
          {
            href: url,
            target: "_blank",
            rel: "noreferrer",
            className: "text-indigo-600 hover:text-indigo-700 break-all"
          },
          url
        );
      }
      return /* @__PURE__ */ React.createElement(
        FieldRow,
        {
          key: field.api,
          label: field.label,
          value,
          multiLine: field.multiLine
        }
      );
    })))));
  }
  window.LogginCredentialsCard = LogginCredentialsCard;
})();
