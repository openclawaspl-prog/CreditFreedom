const MOCK_ACTIVITIES = [
  { id: 1, title: 'Client Consultation',  status: 'Planned',   date: 'Tue 22 Jun, 2021' },
  { id: 2, title: 'Dispute Letter Sent',  status: 'Planned',   date: 'Tue 22 Jun, 2021' },
  { id: 3, title: 'Follow Up Call',       status: 'Completed', date: 'Mon 15 Jun, 2021' },
  { id: 4, title: 'Follow Up Call',       status: 'Completed', date: 'Mon 18 Jun, 2021' },
  { id: 5, title: 'Follow Up Call',       status: 'Completed', date: 'Mon 21 Jun, 2021' },
];

const STATUS_STYLE = {
  Planned:   { dot: 'bg-green-500',  text: 'text-green-600'  },
  Completed: { dot: 'bg-blue-500',   text: 'text-blue-600'   },
  Cancelled: { dot: 'bg-red-400',    text: 'text-red-500'    },
};

function ActivitiesCard() {
  const MAX_VISIBLE = 5;
  const visible = MOCK_ACTIVITIES.slice(0, MAX_VISIBLE);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4">
      <h2 className="text-base font-bold text-gray-900 mb-4">Activities</h2>

      <div className="space-y-4">
        {visible.map(a => {
          const style = STATUS_STYLE[a.status] || { dot: 'bg-gray-400', text: 'text-gray-500' };
          return (
            <div key={a.id} className="flex items-start gap-3">
              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{a.title}</span>
                  <span className={`text-xs font-semibold ${style.text}`}>{a.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ActivitiesCard = ActivitiesCard;
