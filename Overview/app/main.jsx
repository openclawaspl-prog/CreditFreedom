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
  const [showLoginCredentials, setShowLoginCredentials] = React.useState(false);
  const [loginModalTop, setLoginModalTop] = React.useState(24);
  const [loginModalAnchorX, setLoginModalAnchorX] = React.useState(0);
  const loginButtonRef = React.useRef(null);
  const MonitorLoginWidget = window.OverviewMonitorLoginWidget;

  React.useEffect(() => {
    window.OverviewWidget.requestResize();
  }, [showLoginCredentials]);

  React.useEffect(() => {
    if (!showLoginCredentials) return undefined;

    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [showLoginCredentials]);

  const openLoginCredentials = () => {
    const buttonRect = loginButtonRef.current && loginButtonRef.current.getBoundingClientRect();
    setLoginModalAnchorX(buttonRect ? Math.round(buttonRect.left + buttonRect.width / 2) : Math.round(window.innerWidth / 2));
    setLoginModalTop(Math.max(16, Math.round((buttonRect ? buttonRect.top : 180) - 150)));
    setShowLoginCredentials(true);
  };

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
      </div>

      <div className="space-y-4">
        <CommentsCard />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:col-span-3 xl:grid-cols-[minmax(520px,1fr)_280px_250px_250px]">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
            <CreditBureauReportsCard />
            <MessageTemplatesCard />
          </div>
          <StartedAccountsCard />
        </div>
        <div className="space-y-4 xl:col-span-2">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <CreditBureauAutomationCard />
            <ProgramEligibilityCard />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:col-span-3 xl:grid-cols-[minmax(680px,1fr)_320px_320px]">
        <AlertcontrolPanelCard />
        <div className="space-y-4">
          <ReferralCreditsCard />
          <AccountsCountChart />
          <ActivitiesCard />
        </div>
        <div className="space-y-4">
          <button
            ref={loginButtonRef}
            type="button"
            onClick={openLoginCredentials}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/65 px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_34px_rgba(15,23,42,0.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/80"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Show Login Credentials
          </button>
          <LogginCredentialsCard cardTitles={['Equifax Login', 'Transunion Login', 'Experian Monitoring Login']} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:col-span-3 xl:grid-cols-[minmax(820px,1fr)_minmax(300px,460px)]">
        <div className="min-h-[300px] max-h-[440px] aspect-[16/7]">
          <BureauScoreLineChart />
        </div>
        <BillingNotesCard />
      </div>

      {showLoginCredentials && MonitorLoginWidget && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            className="absolute left-4 right-4 flex flex-col overflow-hidden rounded-2xl border border-white/75 bg-white/65 shadow-[0_34px_90px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-2xl"
            style={{
              top: `${loginModalTop}px`,
              maxHeight: `min(760px, calc(100vh - ${loginModalTop + 16}px))`,
              transformOrigin: `${loginModalAnchorX}px top`,
            }}
          >
            <div className="flex items-center justify-between border-b border-white/70 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Login Credentials</h2>
              <button
                type="button"
                onClick={() => setShowLoginCredentials(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-slate-900 shadow-sm transition hover:bg-white"
                title="Close"
                aria-label="Close login credentials"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <MonitorLoginWidget />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MainWidget />);
