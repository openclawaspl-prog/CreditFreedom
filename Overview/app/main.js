(() => {
  // main.jsx
  var { useEffect: useResizeEffect } = React;
  function useDynamicHeight() {
    useResizeEffect(() => {
      let timer;
      function sendResize() {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const h = document.body.scrollHeight + 32;
          if (window.ZOHO && window.ZOHO.CRM && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Resize) {
            window.ZOHO.CRM.UI.Resize({ height: String(h), width: "0" });
          }
        }, 150);
      }
      const observer = new ResizeObserver(sendResize);
      observer.observe(document.body);
      const initTimer = setTimeout(sendResize, 500);
      return () => {
        observer.disconnect();
        clearTimeout(timer);
        clearTimeout(initTimer);
      };
    }, []);
  }
  var MainWidget = () => {
    useDynamicHeight();
    return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-start-1" }, /* @__PURE__ */ React.createElement(ClientDetailsCard, null)), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 lg:col-start-2" }, /* @__PURE__ */ React.createElement(PaymentDetailsCard, null), /* @__PURE__ */ React.createElement(PaymentActionsCard, null)), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2 lg:col-span-2 lg:col-start-1" }, /* @__PURE__ */ React.createElement(CreditBureauReportsCard, null)), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2 lg:col-span-2 lg:col-start-1" }, /* @__PURE__ */ React.createElement(AlertcontrolPanelCard, null)), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2 lg:col-span-2 lg:col-start-1" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full gap-4" }, /* @__PURE__ */ React.createElement(LogginCredentialsCard, { stretch: true }), /* @__PURE__ */ React.createElement(MessageTemplatesCard, null)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full gap-4" }, /* @__PURE__ */ React.createElement(BillingNotesCard, null), /* @__PURE__ */ React.createElement(TotalBalanceCard, null), /* @__PURE__ */ React.createElement(ReferralCreditsCard, null)))), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2 lg:col-span-2 lg:col-start-1" }, /* @__PURE__ */ React.createElement(StartedAccountsCard, null)), /* @__PURE__ */ React.createElement("div", { className: "\r\n        md:col-span-2\r\n        lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-6\r\n        space-y-4\r\n      " }, /* @__PURE__ */ React.createElement(CommentsCard, null), /* @__PURE__ */ React.createElement(CreditBureauAutomationCard, null), /* @__PURE__ */ React.createElement(ProgramEligibilityCard, null), /* @__PURE__ */ React.createElement(ActivitiesCard, null), /* @__PURE__ */ React.createElement(AccountsCountChart, null)));
  };
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(MainWidget, null));
})();
