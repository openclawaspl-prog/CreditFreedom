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
    const settleTimers = [];
    let readyTimer;
    let animationFrame;
    let lastSentHeight = 0;

    function resizeZoho(height) {
      if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
        window.ZOHO.CRM.UI.Resize({ height: String(height), width: '0' });
      }
    }

    function animateResize(targetHeight) {
      cancelAnimationFrame(animationFrame);

      if (!lastSentHeight || targetHeight <= lastSentHeight) {
        lastSentHeight = targetHeight;
        resizeZoho(targetHeight);
        return;
      }

      const startHeight = lastSentHeight;
      const delta = targetHeight - startHeight;
      const duration = 260;
      const startedAt = performance.now();

      function step(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextHeight = Math.ceil(startHeight + delta * eased);

        resizeZoho(nextHeight);
        lastSentHeight = nextHeight;

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        } else {
          lastSentHeight = targetHeight;
        }
      }

      animationFrame = requestAnimationFrame(step);
    }

    function measureHeight() {
      const root = document.getElementById('root');
      const content = document.getElementById('overview-content') || root;
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
      const measured = Math.max(measuredRootHeight, measuredContentHeight);
      const h = Math.ceil(measured + paddingTop + paddingBottom + 40);

      animateResize(h);
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
    const content = document.getElementById('overview-content');
    if (root) observer.observe(root);
    if (content && content !== root) observer.observe(content);

    function ensureZohoResizeReady() {
      let attempts = 0;
      const check = () => {
        if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
          burstResize();
          return;
        }
        if (attempts < 20) {
          attempts += 1;
          readyTimer = setTimeout(check, 250);
        }
      };
      check();
    }

    burstResize();
    ensureZohoResizeReady();
    window.addEventListener('resize', sendResize);
    window.addEventListener('load', burstResize);
    const unsubscribeResize = window.OverviewWidget.onResizeRequest(sendResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      clearTimeout(timer);
      clearTimeout(readyTimer);
      settleTimers.forEach(clearTimeout);
      window.removeEventListener('resize', sendResize);
      window.removeEventListener('load', burstResize);
      unsubscribeResize();
    };
  }, []);
}

const MainWidget = () => {
  useZohoPageLoadBridge();
  useDynamicHeight();
  return (
    <div id="overview-content" className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <ClientDetailsCard />

          <div className="space-y-4">
            <PaymentDetailsCard />
            <PaymentActionsCard />
          </div>
        </div>

        <CreditBureauReportsCard />
        <StartedAccountsCard />
        <AlertcontrolPanelCard />
      </div>

      <div className="space-y-4">
        <CommentsCard />
        <MessageTemplatesCard />
        <CreditBureauAutomationCard />
        <ProgramEligibilityCard />
        <ActivitiesCard />
        <AccountsCountChart />
        <TotalBalanceCard />
      </div>

      <div className="space-y-4">
        <LogginCredentialsCard stretch />
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="min-h-[300px] max-h-[440px] aspect-[16/7]">
          <BureauScoreLineChart />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BillingNotesCard />
          <ReferralCreditsCard />
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MainWidget />);
