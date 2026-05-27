const { useEffect } = React;

window.UtilityBillsWidgetBridge = window.UtilityBillsWidgetBridge || {
  requestResize() {},
};

const STATIC_FORM = {
  accountNumber: '',
  accountNumberPlaceholder: '12XXXXXXXXXXXXXX',
  billingDate: '',
  billingDatePlaceholder: 'MM/DD/YYYY',
  billType: 'select',
};

const STATIC_BILL_TYPES = [
  { value: 'select', label: 'Select' },
  { value: 'CANADA_BILL', label: 'CANADA_BILL' },
  { value: 'US_BILL', label: 'US_BILL' },
];

const STATIC_ROWS = [
  {
    clientName: 'Terry Swaniawski',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
  {
    clientName: 'Irving Gislason',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
  {
    clientName: 'Amelia Conn',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
  {
    clientName: 'John McDermott',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
  {
    clientName: 'Cindy Brekke',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
  {
    clientName: 'Pete Yundt-Stamm',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
  {
    clientName: 'Ana Hansen',
    billType: 'CANADA_BILL',
    accountNumber: '12366',
    billDate: '12-15-2025',
    address: '830 Sim Mission',
  },
];

function useDynamicHeight() {
  useEffect(() => {
    let timer;
    const settleTimers = [];

    function resizeZoho(height) {
      if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
        window.ZOHO.CRM.UI.Resize({ height: String(height), width: '0' });
      }
    }

    function measureHeight() {
      const root = document.getElementById('root');
      const content = document.getElementById('utility-bills') || root;
      if (!root || !content) return;

      const bodyStyle = window.getComputedStyle(document.body);
      const paddingTop = parseFloat(bodyStyle.paddingTop || 0);
      const paddingBottom = parseFloat(bodyStyle.paddingBottom || 0);
      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const measuredRootHeight = Math.max(
        root.scrollHeight,
        root.offsetHeight,
        rootRect.height
      );
      const measuredContentHeight = Math.max(
        content.scrollHeight,
        content.offsetHeight,
        contentRect.height
      );
      const height = Math.ceil(Math.max(measuredRootHeight, measuredContentHeight) + paddingTop + paddingBottom + 40);

      resizeZoho(height);
    }

    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(measureHeight, 150);
    }

    function burstResize() {
      sendResize();
      requestAnimationFrame(sendResize);
      [300, 800, 1500, 3000].forEach((delay) => {
        settleTimers.push(setTimeout(sendResize, delay));
      });
    }

    const observer = new ResizeObserver(sendResize);
    const root = document.getElementById('root');
    const content = document.getElementById('utility-bills');
    if (root) observer.observe(root);
    if (content && content !== root) observer.observe(content);

    window.UtilityBillsWidgetBridge.requestResize = sendResize;

    burstResize();
    window.addEventListener('resize', sendResize);
    window.addEventListener('load', burstResize);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      settleTimers.forEach(clearTimeout);
      window.removeEventListener('resize', sendResize);
      window.removeEventListener('load', burstResize);
      window.UtilityBillsWidgetBridge.requestResize = function () {};
    };
  }, []);
}

function useZohoInit() {
  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    function tick() {
      if (cancelled) return;
      if (window.ZOHO && window.ZOHO.embeddedApp) {
        window.ZOHO.embeddedApp.init();
        setTimeout(() => window.UtilityBillsWidgetBridge.requestResize(), 300);
        return;
      }
      if (Date.now() - startedAt < 5000) {
        setTimeout(tick, 120);
      }
    }

    tick();
    return () => {
      cancelled = true;
    };
  }, []);
}

function useUtilityBillsData() {
  return {
    formDefaults: STATIC_FORM,
    billTypes: STATIC_BILL_TYPES,
    rows: STATIC_ROWS,
  };
}

function UtilityBillsApp() {
  useZohoInit();
  useDynamicHeight();

  const { formDefaults, billTypes, rows } = useUtilityBillsData();

  return (
    <div className="cf-page">
      <UtilityBillsWidget
        formDefaults={formDefaults}
        billTypes={billTypes}
        rows={rows}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UtilityBillsApp />);
