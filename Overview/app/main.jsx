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

function useDynamicHeight() {
  useResizeEffect(() => {
    let timer;
    function sendResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const h = document.body.scrollHeight + 32;
        if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
          window.ZOHO.CRM.UI.Resize({ height: String(h), width: '0' });
        }
      }, 150);
    }
    const observer = new ResizeObserver(sendResize);
    observer.observe(document.body);
    const initTimer = setTimeout(sendResize, 500);
    return () => { observer.disconnect(); clearTimeout(timer); clearTimeout(initTimer); };
  }, []);
}

const MainWidget = () => {
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

      {/* ── 3. Credit Bureau Reports ── col 1 on md+, full-width on sm */}
      <div className="lg:col-start-1">
        <CreditBureauReportsCard />
      </div>

      {/* ── 4. Billing Notes ── col 2 on md+, full-width on sm */}
      <div className="lg:col-start-2">
        <BillingNotesCard />
      </div>

      {/* ── 5. Started Accounts ── spans both cols on md+, full-width on sm */}
      <div className="md:col-span-2 lg:col-span-2 lg:col-start-1">
        <StartedAccountsCard />
      </div>

      {/* ── 6. Total Balance ── col 1 on md+, full-width on sm */}
      <div className="lg:col-start-1">
        <TotalBalanceCard />
      </div>

      {/* ── 7. Referral Credits ── col 2 on md+, full-width on sm */}
      <div className="lg:col-start-2">
        <ReferralCreditsCard />
      </div>

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
        <MessageTemplatesCard />
        <ActivitiesCard />
      </div>

    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MainWidget />);
