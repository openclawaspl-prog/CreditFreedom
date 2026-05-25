const { useState: useAbState, useEffect: useAbEffect, useRef: useAbRef } = React;

const IcChevron = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ActionBtn = ({ onClick, children, tone = 'blue', className = '' }) => {
  const toneClass = tone === 'green'
    ? 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800'
    : tone === 'gray'
      ? 'border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
      : 'border-sky-200 text-sky-700 hover:border-sky-300 hover:text-sky-800';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border bg-white/82 px-3.5 text-sm font-bold leading-none shadow-sm transition-all whitespace-nowrap backdrop-blur-md hover:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 ${toneClass} ${className}`}
      style={{ boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)' }}
    >
      {children}
    </button>
  );
};

function Dropdown({ trigger, children }) {
  const [open, setOpen] = useAbState(false);
  const [menuStyle, setMenuStyle] = useAbState(null);
  const ref = useAbRef(null);
  const menuRef = useAbRef(null);

  useAbEffect(() => {
    if (!open) return undefined;
    function handle(event) {
      if (
        ref.current &&
        !ref.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useAbEffect(() => {
    if (!open || !ref.current) {
      setMenuStyle(null);
      return undefined;
    }

    function updateMenuPosition() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const menuWidth = 258;
      const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - menuWidth - 8));
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 10}px`,
        left: `${left}px`,
        width: `${menuWidth}px`,
        zIndex: 2147483647,
      });
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  const menu = open && menuStyle ? (
    <div
      ref={menuRef}
      className="rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl"
      style={{
        ...menuStyle,
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
      }}
    >
      <span className="absolute -top-3 left-5 h-0 w-0 border-x-[12px] border-b-[12px] border-x-transparent border-b-white" />
      {children(() => setOpen(false))}
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative">
      {trigger(toggle, open)}
      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
}

const DropItem = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-sky-50/80 hover:text-sky-700"
  >
    {children}
  </button>
);

function ActionButtonsBar({ contactId, entity }) {
  const targetEntity = entity || 'Contacts';

  function handleSendTextMessage() {
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

  function noop() {}

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 px-3 py-2" style={{ zIndex: 100, overflow: 'visible' }}>
      <ActionBtn tone="green" onClick={handleSendTextMessage}>
        Send Text Message
      </ActionBtn>

      <ActionBtn tone="blue" onClick={noop}>
        Credit Report
      </ActionBtn>

      <ActionBtn tone="green" onClick={handleSendMail}>
        Send Mail
      </ActionBtn>

      <ActionBtn tone="blue" onClick={noop}>
        Add New Data
      </ActionBtn>

      <Dropdown
        trigger={(toggle) => (
          <ActionBtn tone="gray" onClick={toggle}>
            Contract <IcChevron />
          </ActionBtn>
        )}
      >
        {(close) => (
          <>
            <DropItem onClick={() => { close(); }}>Agreement</DropItem>
            <DropItem onClick={() => { close(); }}>Disclosure</DropItem>
            <DropItem onClick={() => { close(); }}>Remove Fraud Alert/Freeze</DropItem>
            <DropItem onClick={() => { close(); }}>Experian Victim Statement</DropItem>
          </>
        )}
      </Dropdown>

      <ActionBtn tone="blue" onClick={noop}>
        Land Lord Letter
      </ActionBtn>

      <ActionBtn tone="green" onClick={noop}>
        Send Text/Mail
      </ActionBtn>
    </div>
  );
}

window.ActionButtonsBar = ActionButtonsBar;
