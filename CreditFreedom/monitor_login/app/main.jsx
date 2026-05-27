(() => {
  // monitor_login/app/main.jsx
  var { useState, useEffect } = React;
  var colors = [
    "rgba(238, 244, 255, 0.68)",
    "rgba(235, 251, 252, 0.68)",
    "rgba(255, 250, 240, 0.68)",
    "rgba(255, 240, 239, 0.68)",
    "rgba(255, 253, 242, 0.68)",
    "rgba(251, 240, 255, 0.68)"
  ];
  var MODULE_NAME = "Monitoring_Log_In";
  var hasZohoApi = () => typeof ZOHO !== "undefined" && ZOHO.CRM && ZOHO.CRM.API && ZOHO.CRM.API.searchRecord;
  var getPageRecordId = (data) => {
    const entityId = data && data.EntityId;
    if (Array.isArray(entityId)) return entityId[0] || "";
    return entityId || "";
  };
  var getContactLookupValue = (recordId) => ({ id: recordId });
  var MAX_FIELD_LENGTH = 40;
  var MAX_NOTE_LENGTH = 1e3;
  var NOTE_PREVIEW_LENGTH = 90;
  var MIN_USERNAME_LENGTH = 5;
  var NAME_REGEX = /^[A-Za-z0-9.@#$ ]+$/;
  var USERNAME_REGEX = /^[A-Za-z0-9.@#$]+$/;
  var PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,40}$/;
  function FieldIcon({ label }) {
    const commonProps = {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    };
    if (label === "Username") {
      return /* @__PURE__ */ React.createElement("svg", { ...commonProps }, /* @__PURE__ */ React.createElement("path", { d: "M20 21a8 8 0 0 0-16 0" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "7", r: "4" }));
    }
    if (label === "Password") {
      return /* @__PURE__ */ React.createElement("svg", { ...commonProps }, /* @__PURE__ */ React.createElement("rect", { x: "4", y: "11", width: "16", height: "9", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }));
    }
    if (label === "Notes") {
      return /* @__PURE__ */ React.createElement("svg", { ...commonProps }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 2v6h6" }), /* @__PURE__ */ React.createElement("path", { d: "M8 13h8" }), /* @__PURE__ */ React.createElement("path", { d: "M8 17h5" }));
    }
    return /* @__PURE__ */ React.createElement("svg", { ...commonProps }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("path", { d: "M12 8v8" }), /* @__PURE__ */ React.createElement("path", { d: "M8 12h8" }));
  }
  function PasswordValue({ password, show }) {
    const chars = Array.from(password || "");
    if (!chars.length) return "-";
    return /* @__PURE__ */ React.createElement("span", { className: "password-value", "aria-label": show ? password : "Password hidden" }, chars.map((char, index) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: `${show ? "shown" : "hidden"}-${index}-${char}`,
        className: "password-char",
        style: { animationDelay: `${index * 35}ms` }
      },
      show ? char : "*"
    )));
  }
  function NoteValue({ note }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldClamp = (note || "").length > NOTE_PREVIEW_LENGTH;
    if (!note) return "-";
    return /* @__PURE__ */ React.createElement("div", { className: "note-value" }, /* @__PURE__ */ React.createElement("span", { className: `note-text ${shouldClamp && !isExpanded ? "is-clamped" : ""}` }, note), shouldClamp && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "note-toggle",
        onClick: () => setIsExpanded((prev) => !prev)
      },
      isExpanded ? "See less" : "See more"
    ));
  }
  function copyTextToClipboard(text) {
    if (!text) return Promise.resolve(false);
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true);
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve(copied);
  }
  function DetailRow({ label, value, copyValue }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      copyTextToClipboard(copyValue || "").then((success) => {
        if (!success) return;
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "detail-row" }, /* @__PURE__ */ React.createElement("div", { className: "detail-label" }, /* @__PURE__ */ React.createElement("span", { className: "detail-icon" }, /* @__PURE__ */ React.createElement(FieldIcon, { label })), label), /* @__PURE__ */ React.createElement("div", { className: "detail-value-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "detail-value" }, value), copyValue && copyValue !== "-" && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "copy-field-button",
        onClick: handleCopy,
        title: copied ? "Copied" : `Copy ${label}`,
        "aria-label": copied ? `${label} copied` : `Copy ${label}`
      },
      copied ? /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M20 6 9 17l-5-5" })) : /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }))
    )));
  }
  function CredentialCard({ card, index, onEdit, onDelete, showPasswords }) {
    const [copiedName, setCopiedName] = useState(false);
    const details = [
      // ['URL', card.URL],
      { label: "Username", value: card.Name || "-", copyValue: card.Name || "" },
      { label: "Password", value: /* @__PURE__ */ React.createElement(PasswordValue, { password: card.Password, show: showPasswords }), copyValue: card.Password || "" },
      // ['Last Import', card.Last_Import],
      // ['Import Status', card.Import_Status],
      { label: "Notes", value: /* @__PURE__ */ React.createElement(NoteValue, { note: card.Note }), copyValue: card.Note || "" }
    ];
    const handleCopyName = () => {
      copyTextToClipboard(card.Name1 || "").then((success) => {
        if (!success) return;
        setCopiedName(true);
        setTimeout(() => setCopiedName(false), 1200);
      });
    };
    return /* @__PURE__ */ React.createElement(
      "article",
      {
        className: "card group relative",
        style: { background: colors[index % colors.length] }
      },
      /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onEdit(card),
          className: "flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 transition-all duration-150 shadow-sm hover:shadow-md",
          title: "Edit"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), /* @__PURE__ */ React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" }))
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onDelete(card.id),
          className: "flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 hover:bg-red-100 text-slate-700 hover:text-red-600 transition-all duration-150 shadow-sm hover:shadow-md",
          title: "Delete"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "3 6 5 6 21 6" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "11", x2: "10", y2: "17" }), /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "11", x2: "14", y2: "17" }))
      )),
      /* @__PURE__ */ React.createElement("div", { className: "relative z-10 flex h-full flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4 pr-16" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "card-title-row" }, /* @__PURE__ */ React.createElement("h2", { className: "card-title flex items-center gap-3 text-[1.35rem] font-bold text-slate-800 break-all whitespace-normal" }, /* @__PURE__ */ React.createElement("span", { className: "title-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "32", viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "13", width: "36", height: "27", rx: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M17 13v-2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2" }), /* @__PURE__ */ React.createElement("path", { d: "M15 8h18" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "26", r: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M11 36a7 7 0 0 1 14 0" }), /* @__PURE__ */ React.createElement("path", { d: "M29 23h9" }), /* @__PURE__ */ React.createElement("path", { d: "M29 29h9" }), /* @__PURE__ */ React.createElement("path", { d: "M29 35h6" }))), card.Name1), card.Name1 && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "copy-field-button title-copy-button",
          onClick: handleCopyName,
          title: copiedName ? "Copied" : "Copy name",
          "aria-label": copiedName ? "Name copied" : "Copy name"
        },
        copiedName ? /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M20 6 9 17l-5-5" })) : /* @__PURE__ */ React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }))
      )))), /* @__PURE__ */ React.createElement("div", { className: "mt-7 space-y-1" }, details.map(({ label, value, copyValue }) => /* @__PURE__ */ React.createElement(DetailRow, { key: label, label, value: value || "-", copyValue }))))
    );
  }
  function DeleteConfirmModal({ card, onCancel, onConfirm }) {
    if (!card) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-modal" }, /* @__PURE__ */ React.createElement("div", { className: "confirm-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M3 6h18" }), /* @__PURE__ */ React.createElement("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), /* @__PURE__ */ React.createElement("path", { d: "M10 11v6" }), /* @__PURE__ */ React.createElement("path", { d: "M14 11v6" }))), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-slate-900" }, "Delete monitoring?"), /* @__PURE__ */ React.createElement("p", { className: "text-sm leading-6 text-slate-600" }, "Are you sure you want to delete ", /* @__PURE__ */ React.createElement("strong", { className: "font-semibold text-slate-900" }, card.Name1 || "this login"), "? This action cannot be undone."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 pt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onCancel,
        className: "flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      },
      "Cancel"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onConfirm(card.id),
        className: "flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700"
      },
      "Delete"
    ))));
  }
  function MonitoringModal({ isOpen, onClose, onSave, editingCard }) {
    const [formData, setFormData] = useState({
      Name1: "",
      Name: "",
      Password: "",
      Note: ""
    });
    const [errors, setErrors] = useState({});
    React.useEffect(() => {
      if (editingCard) {
        setFormData(editingCard);
      } else {
        setFormData({ Name1: "", Name: "", Password: "", Note: "" });
      }
      setErrors({});
    }, [editingCard, isOpen]);
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    };
    const validateForm = () => {
      const nextErrors = {};
      const trimmedName = formData.Name1.trim();
      const trimmedUserName = formData.Name.trim();
      const trimmedPassword = formData.Password.trim();
      const trimmedNote = formData.Note.trim();
      if (!trimmedName) {
        nextErrors.Name1 = "Name is required.";
      } else if (trimmedName.length > MAX_FIELD_LENGTH) {
        nextErrors.Name1 = `Name must be ${MAX_FIELD_LENGTH} characters or less.`;
      } else if (!NAME_REGEX.test(trimmedName)) {
        nextErrors.Name1 = "Only letters, numbers, space, ., $, @, # are allowed.";
      }
      if (!trimmedUserName) {
        nextErrors.Name = "User name is required.";
      } else if (trimmedUserName.length < MIN_USERNAME_LENGTH) {
        nextErrors.Name = `User name must be at least ${MIN_USERNAME_LENGTH} characters.`;
      } else if (trimmedUserName.length > MAX_FIELD_LENGTH) {
        nextErrors.Name = `User name must be ${MAX_FIELD_LENGTH} characters or less.`;
      } else if (!USERNAME_REGEX.test(trimmedUserName)) {
        nextErrors.Name = "Only letters, numbers, ., @, $, # are allowed.";
      }
      if (!trimmedPassword) {
        nextErrors.Password = "Password is required.";
      } else if (!PASSWORD_REGEX.test(trimmedPassword)) {
        nextErrors.Password = "Password must be 8-40 chars with letters and numbers.";
      }
      if (!trimmedNote) {
        nextErrors.Note = "Note is required.";
      } else if (trimmedNote.length > MAX_NOTE_LENGTH) {
        nextErrors.Note = `Note must be ${MAX_NOTE_LENGTH} characters or less.`;
      }
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    };
    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        onSave({
          Name1: formData.Name1.trim(),
          Name: formData.Name.trim(),
          Password: formData.Password.trim(),
          Note: formData.Note.trim()
        });
      }
    };
    if (!isOpen) return null;
    const isEditing = !!editingCard;
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-slate-900" }, isEditing ? "Edit Monitoring" : "Add New Monitoring"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-slate-700 mb-2" }, "Name *"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        name: "Name1",
        value: formData.Name1,
        onChange: handleChange,
        placeholder: "e.g., Credit Monitoring Login",
        className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900",
        maxLength: MAX_FIELD_LENGTH,
        required: true
      }
    ), errors.Name1 && /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-red-600" }, errors.Name1)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-slate-700 mb-2" }, "User Name"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        name: "Name",
        value: formData.Name,
        onChange: handleChange,
        placeholder: "e.g., john.1",
        className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900",
        maxLength: MAX_FIELD_LENGTH
      }
    ), errors.Name && /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-red-600" }, errors.Name)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-slate-700 mb-2" }, "Password"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "password",
        name: "Password",
        value: formData.Password,
        onChange: handleChange,
        placeholder: "e.g., password123",
        className: "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900",
        maxLength: MAX_FIELD_LENGTH
      }
    ), errors.Password && /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-red-600" }, errors.Password)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-slate-700 mb-2" }, "Note"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        name: "Note",
        value: formData.Note,
        onChange: handleChange,
        placeholder: "e.g., Important account",
        className: "min-h-24 w-full resize-y px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900",
        maxLength: MAX_NOTE_LENGTH
      }
    ), errors.Note && /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-red-600" }, errors.Note)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 pt-4" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
      },
      "Cancel"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        className: "flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
      },
      isEditing ? "Update" : "Add"
    )))));
  }
  function useDynamicHeight() {
    useEffect(() => {
      let timer;
      function sendResize() {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const root2 = document.getElementById("root");
          if (!root2) return;
          const bodyStyle = window.getComputedStyle(document.body);
          const paddingTop = parseFloat(bodyStyle.paddingTop || 0);
          const paddingBottom = parseFloat(bodyStyle.paddingBottom || 0);
          const rootRect = root2.getBoundingClientRect();
          const measuredRootHeight = Math.max(
            root2.scrollHeight,
            root2.offsetHeight,
            rootRect.height
          );
          const h = Math.ceil(measuredRootHeight + paddingTop + paddingBottom + 40);
          if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
            window.ZOHO.CRM.UI.Resize({ height: String(h), width: "0" });
          }
        }, 150);
      }
      function burstResize() {
        sendResize();
        requestAnimationFrame(sendResize);
        [300, 800, 1500, 3e3].forEach((delay) => setTimeout(sendResize, delay));
      }
      const root = document.getElementById("root");
      const observer = window.ResizeObserver ? new ResizeObserver(sendResize) : null;
      if (root && observer) observer.observe(root);
      window.MonitorLoginWidget = window.MonitorLoginWidget || {};
      window.MonitorLoginWidget.requestResize = sendResize;
      burstResize();
      window.addEventListener("resize", sendResize);
      window.addEventListener("load", burstResize);
      return () => {
        if (observer) observer.disconnect();
        clearTimeout(timer);
        window.removeEventListener("resize", sendResize);
        window.removeEventListener("load", burstResize);
        if (window.MonitorLoginWidget) {
          window.MonitorLoginWidget.requestResize = function() {
          };
        }
      };
    }, []);
  }
  function App() {
    useDynamicHeight();
    const [cards, setCards] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [contactRecordId, setContactRecordId] = useState(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [cardPendingDelete, setCardPendingDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const fetchRecords = (recordId) => {
      if (!hasZohoApi()) {
        setCards([]);
        setIsLoading(false);
        setLoadError("Zoho CRM API is not available.");
        return;
      }
      if (!recordId) {
        setIsLoading(false);
        setLoadError("No Contact record id available.");
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      ZOHO.CRM.API.searchRecord({
        Entity: MODULE_NAME,
        Type: "criteria",
        Query: `(Clients:equals:${recordId})`,
        delay: false
      }, 1, 200).then((res) => {
        const records = res.data || [];
        const mapped = records.map((record) => ({
          id: record.id,
          Name1: record.Name1 || "",
          // URL: record.URL || record.Url || record.url || '',
          Name: record.Name || "",
          Password: record.Password || "",
          // Last_Import: record.Last_Import || record.Last_import || record.Last_Imported || record.Last_Import_Time || '',
          // Import_Status: record.Import_Status || record.Import_status || record.Status || '',
          Note: record.Note || record.Notes || ""
        }));
        setCards(mapped);
      }).catch((err) => {
        console.error("Failed to load Monitoring Log In records:", err);
        setLoadError("Failed to load Monitoring Log In records.");
      }).finally(() => {
        setIsLoading(false);
      });
    };
    useEffect(() => {
      if (!hasZohoApi()) {
        setIsLoading(false);
        return;
      }
      ZOHO.embeddedApp.on("PageLoad", (data) => {
        const recordId = getPageRecordId(data);
        setContactRecordId(recordId);
        fetchRecords(recordId);
      });
      ZOHO.embeddedApp.init();
    }, []);
    const handleSaveCard = (formData) => {
      if (!hasZohoApi()) {
        setLoadError("Zoho CRM API is not available.");
        return;
      }
      if (!contactRecordId) {
        setLoadError("Cannot save without a Contact record id.");
        return;
      }
      if (editingCard) {
        ZOHO.CRM.API.updateRecord({
          Entity: MODULE_NAME,
          APIData: { id: editingCard.id, ...formData, Clients: getContactLookupValue(contactRecordId) },
          Trigger: ["workflow"]
        }).then(() => {
          fetchRecords(contactRecordId);
          setIsModalOpen(false);
          setEditingCard(null);
        }).catch(() => {
          setLoadError("Failed to update record.");
        });
      } else {
        ZOHO.CRM.API.insertRecord({
          Entity: MODULE_NAME,
          APIData: { ...formData, Clients: getContactLookupValue(contactRecordId) },
          Trigger: ["workflow"]
        }).then((res) => {
          if (!res.data?.[0]?.details?.id) {
            setLoadError("Record created, but ID was not returned.");
          }
          fetchRecords(contactRecordId);
          setIsModalOpen(false);
          setEditingCard(null);
        }).catch(() => {
          setLoadError("Failed to create record.");
        });
      }
    };
    const handleDeleteCard = (id) => {
      if (!hasZohoApi()) {
        setLoadError("Zoho CRM API is not available.");
        return;
      }
      ZOHO.CRM.API.deleteRecord({ Entity: MODULE_NAME, RecordID: id }).then(() => {
        setCardPendingDelete(null);
        fetchRecords(contactRecordId);
      }).catch(() => {
        setLoadError("Failed to delete record.");
      });
    };
    const handleEditCard = (card) => {
      setEditingCard(card);
      setIsModalOpen(true);
    };
    const handleOpenAddModal = () => {
      setEditingCard(null);
      setIsModalOpen(true);
    };
    const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingCard(null);
    };
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredCards = normalizedSearch ? cards.filter((card) => [
      card.Name1,
      card.Name,
      card.Password,
      card.Note
    ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))) : cards;
    return /* @__PURE__ */ React.createElement("main", { className: "app-shell" }, /* @__PURE__ */ React.createElement("div", { className: "mx-auto flex w-full max-w-[1600px] flex-col gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "search-box" }, /* @__PURE__ */ React.createElement("span", { className: "search-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "M21 21l-4.35-4.35" }))), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: "Search logins...",
        className: "search-input",
        "aria-label": "Search login credentials"
      }
    ), searchQuery && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "search-clear",
        onClick: () => setSearchQuery(""),
        "aria-label": "Clear search"
      },
      /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M18 6 6 18" }), /* @__PURE__ */ React.createElement("path", { d: "m6 6 12 12" }))
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 lg:ml-auto" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleOpenAddModal,
        type: "button",
        className: "inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-800"
      },
      /* @__PURE__ */ React.createElement("span", { className: "relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/30", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "absolute h-2.5 w-px rounded-full bg-current" }), /* @__PURE__ */ React.createElement("span", { className: "absolute h-px w-2.5 rounded-full bg-current" })),
      "Add Another Monitoring"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowPasswords((prev) => !prev),
        type: "button",
        className: "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-800",
        title: showPasswords ? "Hide passwords" : "Show passwords",
        "aria-label": showPasswords ? "Hide passwords" : "Show passwords"
      },
      showPasswords ? /* @__PURE__ */ React.createElement("svg", { width: "21", height: "21", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a18.45 18.45 0 0 1 5.06-6.94" }), /* @__PURE__ */ React.createElement("path", { d: "M9.9 4.24A10.84 10.84 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" }), /* @__PURE__ */ React.createElement("path", { d: "M14.12 14.12A3 3 0 0 1 9.88 9.88" }), /* @__PURE__ */ React.createElement("path", { d: "M1 1l22 22" })) : /* @__PURE__ */ React.createElement("svg", { width: "21", height: "21", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }))
    ))), loadError && /* @__PURE__ */ React.createElement("div", { className: "mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" }, loadError), /* @__PURE__ */ React.createElement("section", { className: "card-grid" }, isLoading ? /* @__PURE__ */ React.createElement("div", { className: "col-span-full text-sm text-slate-600" }, "Loading records...") : cards.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "col-span-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-600" }, "No monitoring logins found.") : filteredCards.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "col-span-full rounded-2xl border border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-600" }, "No logins match your search.") : filteredCards.map((card, index) => /* @__PURE__ */ React.createElement(
      CredentialCard,
      {
        key: card.id,
        card,
        index,
        onEdit: handleEditCard,
        onDelete: () => setCardPendingDelete(card),
        showPasswords
      }
    )))), /* @__PURE__ */ React.createElement(
      MonitoringModal,
      {
        isOpen: isModalOpen,
        onClose: handleCloseModal,
        onSave: handleSaveCard,
        editingCard
      }
    ), /* @__PURE__ */ React.createElement(
      DeleteConfirmModal,
      {
        card: cardPendingDelete,
        onCancel: () => setCardPendingDelete(null),
        onConfirm: handleDeleteCard
      }
    ));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
