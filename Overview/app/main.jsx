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
    let retryTimer;

    function getContentHeight() {
      const root = document.getElementById('root');
      const rootRect = root ? root.getBoundingClientRect() : null;
      const bodyRect = document.body.getBoundingClientRect();
      const doc = document.documentElement;

      return Math.ceil(Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        doc.scrollHeight,
        doc.offsetHeight,
        root ? root.scrollHeight : 0,
        rootRect ? rootRect.bottom + window.scrollY : 0,
        bodyRect.bottom + window.scrollY
      ) + 32);
    }

    function publishHeight(height) {
      if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
        window.ZOHO.CRM.UI.Resize({ height: String(height), width: '0' });
      }

      try {
        if (window.frameElement) {
          window.frameElement.style.height = height + 'px';
          window.frameElement.setAttribute('height', String(height));
        }
      } catch (e) {}

      try {
        window.parent && window.parent.postMessage({
          type: 'overview-widget-resize',
          source: 'Overview',
          height,
        }, '*');
      } catch (e) {}
    }

    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        publishHeight(getContentHeight());
      }, 150);
    }

    function burstResize() {
      sendResize();
      requestAnimationFrame(sendResize);
      [250, 750, 1500, 3000, 6000].forEach(delay => setTimeout(sendResize, delay));
    }

    const observer = new ResizeObserver(sendResize);
    observer.observe(document.body);
    observer.observe(document.documentElement);
    const root = document.getElementById('root');
    if (root) observer.observe(root);

    const mutationObserver = new MutationObserver(sendResize);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    window.addEventListener('resize', sendResize);
    window.addEventListener('load', sendResize);

    const unsubscribeResize = window.OverviewWidget.onResizeRequest(burstResize);
    const unsubscribePageLoad = window.OverviewWidget.onPageLoad(burstResize);

    burstResize();
    const initTimer = setTimeout(sendResize, 500);
    retryTimer = setInterval(sendResize, 1000);
    const stopRetryTimer = setTimeout(() => clearInterval(retryTimer), 15000);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      unsubscribeResize();
      unsubscribePageLoad();
      window.removeEventListener('resize', sendResize);
      window.removeEventListener('load', sendResize);
      clearTimeout(timer);
      clearTimeout(initTimer);
      clearTimeout(stopRetryTimer);
      clearInterval(retryTimer);
    };
  }, []);
}

const MainWidget = () => {
  useZohoPageLoadBridge();
  useDynamicHeight();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">

      {/* ── 1. Client Details ── col 1 on md+, full-width on sm */}
      <div className="lg:col-start-1">
        <ClientDetailsCard />
      </div>

      {/* ── 2. Payment Details + Actions ── col 2 on md+, full-width on sm */}
      <div className="space-y-4 lg:col-start-2">
        <PaymentDetailsCard />
        <PaymentActionsCard />
      </div>

      {/* ── 3. Credit Bureau Reports ── spans both cols on md+, full-width on sm */}
      <div className="md:col-span-2 lg:col-span-2 lg:col-start-1">
        <CreditBureauReportsCard />
      </div>

      {/* ── 3a. Alert Control Panel ── spans both cols on md+, full-width on sm */}
      <div className="md:col-span-2 lg:col-span-2 lg:col-start-1">
        <AlertcontrolPanelCard />
      </div>

      {/* ── 3b. Logins + Billing/Balance ── spans both cols on md+, full-width on sm */}
      <div className="md:col-span-2 lg:col-span-2 lg:col-start-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          <div className="flex flex-col h-full gap-4">
            <LogginCredentialsCard stretch />
            <MessageTemplatesCard />
          </div>
          <div className="flex flex-col h-full gap-4">
            <BillingNotesCard />
            <TotalBalanceCard />
              <ReferralCreditsCard />
          </div>
        </div>
      </div>

        {/* ── 3b. Started Accounts ── spans both cols on md+, full-width on sm */}
        <div className="md:col-span-2 lg:col-span-2 lg:col-start-1">
          <StartedAccountsCard />
        </div>
      {/* ── 7. Referral Credits ── col 2 on md+, full-width on sm */}

      {/* ── 8. Sidebar ──────────────────────────────────────────────
           HTML order: LAST → correct stacking on sm/md
           lg: snaps to col 3, row 1, spanning all content rows
      ─────────────────────────────────────────────────────────── */}
      <div className="
        md:col-span-2
        lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-6
        space-y-4
      ">
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
