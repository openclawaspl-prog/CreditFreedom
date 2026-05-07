const MainWidget = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <div className="lg:col-span-1 h-full">
        <ClientDetailsCard />
      </div>

      <div className="lg:col-span-1 space-y-4 h-full">
        <PaymentDetailsCard />
        <PaymentActionsCard />
      </div>

      <div className="lg:col-span-1 h-full">
        <CommentsCard />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<MainWidget />);
