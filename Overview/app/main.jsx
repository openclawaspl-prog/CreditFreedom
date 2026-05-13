/*
  Responsive layout strategy
  ─────────────────────────────────────────────────────────
  sm  (< 768px)   → 1 column, every card full-width, stacked
                    in reading order: Client → Payment → Bureau
                    → Billing → Accounts → Balance → Referral
                    → Comments → Automation → Eligibility
                    → Templates → Activities

  md  (768–1023px) → 2 columns
                    Client | Payment
                    Bureau | Billing
                    Accounts (span-2)
                    Balance | Referral
                    Sidebar (span-2, bottom)

  lg  (1024px+)   → 3 columns
                    Col 1       | Col 2        | Col 3 (sidebar)
                    Client      | Payment      | Comments
                    Bureau      | Billing      | Automation
                    Accounts ←—span 2—→       | Eligibility
                    Balance     | Referral     | Templates
                                               | Activities

  Key trick: sidebar is last in HTML (correct mobile order) but
  uses lg:col-start-3 lg:row-start-1 to snap into col-3 on lg.
  Main content items use lg:col-start-1/2 so they never drift
  into col-3.
  ─────────────────────────────────────────────────────────
*/
const { useEffect: useResizeEffect } = React;

window.OverviewWidget = window.OverviewWidget || {
  pageData: null,
  listeners: new Set(),
  resizeHandlers: new Set(),
  zohoInitialized: false,
  onPageLoad(callback) {
    this.listeners.add(callback);
    if (this.pageData) {
      setTimeout(() => callback(this.pageData), 0);
    }
    return () => this.listeners.delete(callback);
  },
  emitPageLoad(data) {
    this.pageData = data;
    this.listeners.forEach((callback) => callback(data));
    this.requestResize();
  },
  onResizeRequest(callback) {
    this.resizeHandlers.add(callback);
    return () => this.resizeHandlers.delete(callback);
  },
  requestResize() {
    this.resizeHandlers.forEach((callback) => callback());
  },
};

function waitForZohoSdk() {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (window.ZOHO && window.ZOHO.embeddedApp) {
        resolve(window.ZOHO);
        return;
      }
      if (Date.now() - startedAt > 5000) {
        resolve(null);
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

function useZohoPageLoadBridge() {
  useResizeEffect(() => {
    let cancelled = false;

    waitForZohoSdk().then((zoho) => {
      if (cancelled || !zoho || window.OverviewWidget.zohoInitialized) return;

      zoho.embeddedApp.on('PageLoad', (data) => {
        window.OverviewWidget.emitPageLoad(data);
      });
      zoho.embeddedApp.init();
      window.OverviewWidget.zohoInitialized = true;
    });

    return () => {
      cancelled = true;
    };
  }, []);
}

function useDynamicHeight() {
  useResizeEffect(() => {
    let timer;

    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const root = document.getElementById('root');
        if (!root) return;

        const bodyStyle = window.getComputedStyle(document.body);
        const paddingY = parseFloat(bodyStyle.paddingTop || 0) + parseFloat(bodyStyle.paddingBottom || 0);
        const h = Math.ceil(root.scrollHeight + paddingY + 2);
        if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
          window.ZOHO.CRM.UI.Resize({ height: String(h), width: '0' });
        }
      }, 150);
    }

    const observer = new ResizeObserver(sendResize);
    const root = document.getElementById('root');
    if (root) observer.observe(root);

    sendResize();
    const initTimer = setTimeout(sendResize, 500);
    window.addEventListener('resize', sendResize);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(initTimer);
      window.removeEventListener('resize', sendResize);
    };
  }, []);
}

const MainWidget = () => {
  useZohoPageLoadBridge();
  useDynamicHeight();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <ClientDetailsCard />

          <div className="space-y-4">
            <PaymentDetailsCard />
            <PaymentActionsCard />
          </div>
        </div>

        <CreditBureauReportsCard />
        <AlertcontrolPanelCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
            <LogginCredentialsCard stretch />
            <MessageTemplatesCard />
          </div>

          <div className="space-y-4">
            <BillingNotesCard />
            <TotalBalanceCard />
            <ReferralCreditsCard />
          </div>
        </div>

        <StartedAccountsCard />
      </div>

      <div className="space-y-4">
        <CommentsCard />
        <CreditBureauAutomationCard />
        <ProgramEligibilityCard />
        <ActivitiesCard />
        <AccountsCountChart />
      </div>
    </div>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(<MainWidget />);
