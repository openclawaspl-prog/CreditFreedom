/*
  ActionButtonsBar
  Top-right action buttons: Send Text Message | Send Mail | Contract ▼ | ⋮
  Mirrors the Zoho CRM page-level controls shown in the widget screenshot.
  Wire up sendTextMessage() and contractItems to your Zoho APIs as needed.
*/
const { useState: useAbState, useEffect: useAbEffect, useRef: useAbRef } = React;

/* Chevron icon */
const IcChevron = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5"  r="1.8"/>
    <circle cx="12" cy="12" r="1.8"/>
    <circle cx="12" cy="19" r="1.8"/>
  </svg>
);

/* Generic bordered button */
const OutlineBtn = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm whitespace-nowrap ${className}`}
  >
    {children}
  </button>
);

/* Dropdown wrapper — closes when clicking outside */
function Dropdown({ trigger, children }) {
  const [open, setOpen] = useAbState(false);
  const ref = useAbRef(null);

  useAbEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen(v => !v), open)}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50"
          style={{ minWidth: 160 }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const DropItem = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {children}
  </button>
);

function ActionButtonsBar({ contactId, entity }) {
  const targetEntity = entity || 'Contacts';

  function handleSendTextMessage() {
    /* TODO: wire up to your SMS provider / Zoho telephony API */
    if (window.ZOHO && ZOHO.CRM && ZOHO.CRM.UI) {
      ZOHO.CRM.UI.Record.open({ Entity: targetEntity, RecordID: contactId });
    }
  }

  function handleSendMail() {
    if (window.ZOHO && ZOHO.CRM && ZOHO.CRM.UI) {
      ZOHO.CRM.UI.Record.sendMail &&
        ZOHO.CRM.UI.Record.sendMail({ Entity: targetEntity, RecordID: contactId });
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 mb-1">

      <OutlineBtn onClick={handleSendTextMessage}>
        Send Text Message
      </OutlineBtn>

      <OutlineBtn onClick={handleSendMail}>
        Send Mail
      </OutlineBtn>

      {/* Contract dropdown */}
      <Dropdown
        trigger={(toggle, open) => (
          <OutlineBtn onClick={toggle}>
            Contract <IcChevron />
          </OutlineBtn>
        )}
      >
        {(close) => (
          <>
            <DropItem onClick={() => {
              close();
              ZOHO.CRM.API.getRelatedRecords &&
                ZOHO.CRM.API.getRelatedRecords({
                  Entity: targetEntity, RecordID: contactId,
                  RelatedList: 'Deals', page: 1, per_page: 10,
                }).then(r => {
                  if (r && r.data && r.data[0])
                    ZOHO.CRM.UI.Record.open({ Entity: 'Deals', RecordID: r.data[0].id });
                }).catch(() => {});
            }}>View Contract</DropItem>
            <DropItem onClick={() => {
              close();
              ZOHO.CRM.UI.Record.create &&
                ZOHO.CRM.UI.Record.create({ Entity: 'Deals' });
            }}>Create Contract</DropItem>
          </>
        )}
      </Dropdown>

      {/* Three-dots more menu */}
      <Dropdown
        trigger={(toggle) => (
          <button
            onClick={toggle}
            className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
            title="More options"
          >
            <IcDots />
          </button>
        )}
      >
        {(close) => (
          <>
            <DropItem onClick={() => { close(); window.print && window.print(); }}>Print</DropItem>
            <DropItem onClick={() => {
              close();
              ZOHO.CRM.UI.Record.open &&
                ZOHO.CRM.UI.Record.open({ Entity: targetEntity, RecordID: contactId });
            }}>Open Record</DropItem>
          </>
        )}
      </Dropdown>

    </div>
  );
}

window.ActionButtonsBar = ActionButtonsBar;
